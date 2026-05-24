from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from db.session import get_db
from models.user import User, UserRole, CPAPartnerClient
from models.transaction import Transaction, TransactionStatus
from models.bank_account import BankAccount
from schemas.user import ClientSummary, LeaderboardEntry
from schemas.transaction import Transaction as TransactionSchema

import zipfile
import io
from fastapi.responses import StreamingResponse
from endpoints.export import generate_drake_schedule_c_csv, generate_drake_trial_balance_csv
from fpdf import FPDF
from datetime import date

router = APIRouter()

def generate_client_pdf_report(client: User, db: Session) -> bytes:
    """
    Generate a simple PDF financial report for a client.
    """
    # 1. Fetch data
    bank_accounts = db.query(BankAccount).filter(BankAccount.user_id == client.id).all()
    account_ids = [acc.id for acc in bank_accounts]
    
    from models.tax_category import TaxCategory
    
    summary = db.query(
        TaxCategory.name,
        func.sum(Transaction.amount).label("total")
    ).join(
        TaxCategory, Transaction.category_id == TaxCategory.id
    ).filter(
        Transaction.account_id.in_(account_ids),
        Transaction.status == TransactionStatus.CONFIRMED
    ).group_by(TaxCategory.name).all()

    # 2. Create PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("helvetica", "B", 16)
    pdf.cell(0, 10, f"Financial Report: {client.company_name or client.email}", ln=True)
    pdf.ln(5)
    
    pdf.set_font("helvetica", "", 12)
    pdf.cell(0, 10, f"Client Email: {client.email}", ln=True)
    pdf.cell(0, 10, f"Generated on: {date.today()}", ln=True)
    pdf.ln(10)
    
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(120, 10, "Tax Category", 1)
    pdf.cell(40, 10, "Total Amount", 1)
    pdf.ln()
    
    pdf.set_font("helvetica", "", 12)
    total_all = 0
    for row in summary:
        pdf.cell(120, 10, str(row.name), 1)
        pdf.cell(40, 10, f"${float(row.total):.2f}", 1)
        pdf.ln()
        total_all += float(row.total)
        
    pdf.ln(5)
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(120, 10, "Total Confirmed Transactions", 1)
    pdf.cell(40, 10, f"${total_all:.2f}", 1)
    
    return pdf.output()

async def get_cpa_user(cpa_id: str, db: Session = Depends(get_db)):
    """
    In a real app, this would use JWT and check roles.
    For MVP, we use the provided cpa_id.
    """
    user = db.query(User).filter(User.id == cpa_id).first()
    if not user or user.role != UserRole.CPA:
        raise HTTPException(status_code=403, detail="Access denied. User is not a CPA.")
    return user

@router.get("/clients", response_model=List[ClientSummary])
async def list_clients(current_cpa: User = Depends(get_cpa_user), db: Session = Depends(get_db)):
    """
    List all clients linked to this CPA partner.
    """
    client_links = db.query(CPAPartnerClient).filter(CPAPartnerClient.cpa_id == current_cpa.id).all()
    client_ids = [link.client_id for link in client_links]
    
    clients = db.query(User).filter(User.id.in_(client_ids)).all()
    
    results = []
    for client in clients:
        # Get transaction counts
        # First find all bank accounts for this client
        bank_accounts = db.query(BankAccount).filter(BankAccount.user_id == client.id).all()
        account_ids = [acc.id for acc in bank_accounts]
        
        confirmed_count = db.query(Transaction).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.status == TransactionStatus.CONFIRMED
        ).count()
        
        unprocessed_count = db.query(Transaction).filter(
            Transaction.account_id.in_(account_ids),
            Transaction.status == TransactionStatus.UNPROCESSED
        ).count()
        
        results.append(ClientSummary(
            id=client.id,
            email=client.email,
            company_name=client.company_name,
            total_confirmed_transactions=confirmed_count,
            total_unprocessed_transactions=unprocessed_count,
            is_paid=client.is_paid,
            subscription_status=client.subscription_status
            ))

    return results

@router.get("/clients/{client_id}/transactions", response_model=List[TransactionSchema])
async def get_client_transactions(
    client_id: str, 
    current_cpa: User = Depends(get_cpa_user), 
    db: Session = Depends(get_db)
):
    """
    View confirmed transactions for a specific client (read-only).
    """
    # Verify link
    link = db.query(CPAPartnerClient).filter(
        CPAPartnerClient.cpa_id == current_cpa.id,
        CPAPartnerClient.client_id == client_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=403, detail="Unauthorized. Client is not linked to this CPA.")
        
    bank_accounts = db.query(BankAccount).filter(BankAccount.user_id == client_id).all()
    account_ids = [acc.id for acc in bank_accounts]
    
    transactions = db.query(Transaction).filter(
        Transaction.account_id.in_(account_ids),
        Transaction.status == TransactionStatus.CONFIRMED
    ).order_by(Transaction.date.desc()).all()
    
    return transactions

@router.get("/clients/{client_id}/dashboard")
async def get_client_dashboard(
    client_id: str, 
    current_cpa: User = Depends(get_cpa_user), 
    db: Session = Depends(get_db)
):
    """
    Get a high-level dashboard summary for a client.
    """
    # Verify link
    link = db.query(CPAPartnerClient).filter(
        CPAPartnerClient.cpa_id == current_cpa.id,
        CPAPartnerClient.client_id == client_id
    ).first()
    
    if not link:
        raise HTTPException(status_code=403, detail="Unauthorized. Client is not linked to this CPA.")
        
    bank_accounts = db.query(BankAccount).filter(BankAccount.user_id == client_id).all()
    account_ids = [acc.id for acc in bank_accounts]
    
    # Calculate simple totals
    # Note: In a production app, we'd filter by date range and use TaxCategory types
    # For now, let's just get the sum of all confirmed transactions
    
    # This is a bit simplified as we don't have the "Income" vs "Expense" sign logic fully established 
    # but let's assume we can aggregate by category type if we join with TaxCategory
    from models.tax_category import TaxCategory
    
    summary = db.query(
        TaxCategory.irs_code, # irs_code stores "Income" or "Expense" from seed_data
        func.sum(Transaction.amount).label("total")
    ).join(
        TaxCategory, Transaction.category_id == TaxCategory.id
    ).filter(
        Transaction.account_id.in_(account_ids),
        Transaction.status == TransactionStatus.CONFIRMED
    ).group_by(TaxCategory.irs_code).all()
    
    report = {"revenue": 0.0, "expenses": 0.0, "net_profit": 0.0}
    for row in summary:
        if row.irs_code == "Income":
            report["revenue"] = float(row.total)
        elif row.irs_code == "Expense":
            report["expenses"] = float(row.total)
            
    report["net_profit"] = report["revenue"] - report["expenses"]
    
    return report

@router.get("/bulk-download")
async def bulk_download_packages(
    client_ids: List[str] = Query(None),
    formats: List[str] = Query(None),
    current_cpa: User = Depends(get_cpa_user), 
    db: Session = Depends(get_db)
):
    """
    Bulk download financial packages for selected clients and formats.
    """
    if client_ids:
        clients = db.query(User).filter(User.id.in_(client_ids)).all()
        # Verify all clients are linked to this CPA
        for client in clients:
            link = db.query(CPAPartnerClient).filter(
                CPAPartnerClient.cpa_id == current_cpa.id,
                CPAPartnerClient.client_id == client.id
            ).first()
            if not link:
                 raise HTTPException(status_code=403, detail=f"Unauthorized. Client {client.email} is not linked.")
    else:
        client_links = db.query(CPAPartnerClient).filter(CPAPartnerClient.cpa_id == current_cpa.id).all()
        client_ids = [link.client_id for link in client_links]
        clients = db.query(User).filter(User.id.in_(client_ids)).all()
    
    if not clients:
        raise HTTPException(status_code=404, detail="No clients selected or linked.")
    
    # Default to all if none specified
    if not formats:
        formats = ["drake_schedule_c", "drake_trial_balance", "pdf_report"]

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        for client in clients:
            # Create a folder for each client in the ZIP
            folder_name = client.email.replace("@", "_at_")
            
            # 1. Drake Schedule C CSV
            if "drake_schedule_c" in formats:
                schedule_c = generate_drake_schedule_c_csv(client.id, db)
                zip_file.writestr(f"{folder_name}/drake_schedule_c.csv", schedule_c)
            
            # 2. Drake Trial Balance CSV
            if "drake_trial_balance" in formats:
                trial_balance = generate_drake_trial_balance_csv(client.id, db)
                zip_file.writestr(f"{folder_name}/drake_trial_balance.csv", trial_balance)
            
            # 3. PDF Report
            if "pdf_report" in formats:
                pdf_report = generate_client_pdf_report(client, db)
                zip_file.writestr(f"{folder_name}/financial_report.pdf", pdf_report)
            
            # 4. Simple Summary Text File
            summary_text = f"Financial Package for: {client.company_name or client.email}\n"
            summary_text += f"Email: {client.email}\n"
            summary_text += f"Export Date: {date.today()}\n"
            summary_text += "-" * 30 + "\n"
            summary_text += "Contents:\n"
            if "drake_schedule_c" in formats: summary_text += "- drake_schedule_c.csv\n"
            if "drake_trial_balance" in formats: summary_text += "- drake_trial_balance.csv\n"
            if "pdf_report" in formats: summary_text += "- financial_report.pdf\n"
            if "qbo" in formats: summary_text += "- qbo_export.txt (Placeholder)\n"
            
            zip_file.writestr(f"{folder_name}/package_summary.txt", summary_text)

            # 5. QBO Placeholder
            if "qbo" in formats:
                zip_file.writestr(f"{folder_name}/qbo_export.txt", "QBO Export functionality is coming soon in Phase 4.")
            
    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment; filename=cpa_bulk_export.zip"}
    )

@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_referral_leaderboard(db: Session = Depends(get_db)):
    """
    Get a list of referrers (CPAs/Users) ranked by their referral count.
    """
    # 1. Get all users who have a referral_code (potential referrers)
    referrers = db.query(User).filter(User.referral_code != None).all()
    
    results = []
    for ref in referrers:
        # Count total referred users
        referrals = db.query(User).filter(User.referred_by_id == ref.id).all()
        signup_count = len(referrals)
        
        if signup_count == 0:
            continue
            
        active_count = 0
        paid_count = 0
        for referred_user in referrals:
            # Check if active (has bank account)
            has_bank = db.query(BankAccount).filter(BankAccount.user_id == referred_user.id).first() is not None
            if has_bank:
                active_count += 1
            
            # Check if paid
            if referred_user.is_paid:
                paid_count += 1
        
        results.append(LeaderboardEntry(
            referrer_email=ref.email,
            company_name=ref.company_name,
            referral_count=signup_count,
            active_referral_count=active_count,
            paid_referral_count=paid_count
        ))
    
    # Sort by signup_count desc, then active_count desc, then paid_count desc
    results.sort(key=lambda x: (x.referral_count, x.active_referral_count, x.paid_referral_count), reverse=True)
    
    return results
