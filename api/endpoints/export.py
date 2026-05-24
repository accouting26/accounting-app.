from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from db.session import get_db
from models.transaction import Transaction, TransactionStatus
from models.bank_account import BankAccount
from models.tax_category import TaxCategory
from models.drake_mapping import DrakeMapping
from schemas import drake_mapping as drake_schema
import csv
import io
from datetime import date
from typing import Optional, List

router = APIRouter()

DRAKE_MAPPING = {
    "advertising_marketing": "6000",
    "car_and_truck": "6010",
    "commissions_and_fees": "6020",
    "contract_labor": "6030",
    "insurance": "6070",
    "legal_and_professional_services": "6100",
    "office_expense": "6110",
    "rent_or_lease": "6140",
    "repairs_and_maintenance": "6150",
    "supplies": "6160",
    "taxes_and_licenses": "6170",
    "travel": "6180",
    "meals": "6190",
    "utilities": "6200",
    "ministry_outreach": "6220",
    "software_subscriptions": "6220",
    "other_business_expenses": "6220",
    "mortgage_interest": "6080",
    "other_interest": "6090",
    "wages_and_salaries": "6210",
    "business_income": "INCOME",
    "rental_income": "RENTAL"
}

def generate_drake_schedule_c_csv(user_id: str, db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> str:
    # Get user specific mappings
    user_mappings = db.query(DrakeMapping).filter(DrakeMapping.user_id == user_id).all()
    mapping_dict = {m.category_id: m.drake_account_code for m in user_mappings}

    query = db.query(Transaction).join(BankAccount).filter(BankAccount.user_id == user_id)
    query = query.filter(Transaction.status == TransactionStatus.CONFIRMED)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
        
    transactions = query.all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Payee/Vendor", "Amount", "Drake Category Code", "Description", "Memo", "Reimbursable", "Client Tag"])
    
    for tx in transactions:
        # Use user-specific mapping if exists, else fallback to default, else "6220"
        drake_code = mapping_dict.get(tx.category_id) or DRAKE_MAPPING.get(tx.category_id, "6220")
        writer.writerow([
            tx.date.strftime("%m/%d/%Y"),
            tx.vendor,
            f"{tx.amount:.2f}",
            drake_code,
            tx.raw_description,
            tx.memo or "",
            "Yes" if tx.is_reimbursable else "No",
            tx.client_tag or ""
        ])
    return output.getvalue()

def generate_drake_trial_balance_csv(user_id: str, db: Session, start_date: Optional[date] = None, end_date: Optional[date] = None) -> str:
    # Get user specific mappings
    user_mappings = db.query(DrakeMapping).filter(DrakeMapping.user_id == user_id).all()
    mapping_dict = {m.category_id: m.drake_account_code for m in user_mappings}

    query = db.query(Transaction).join(BankAccount).filter(BankAccount.user_id == user_id)
    query = query.filter(Transaction.status == TransactionStatus.CONFIRMED)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
        
    transactions = query.all()
    
    # Aggregate by category
    summary = {}
    for tx in transactions:
        cat_id = tx.category_id or "unassigned"
        if cat_id not in summary:
            # Get category name
            cat = db.query(TaxCategory).filter(TaxCategory.id == cat_id).first()
            cat_name = cat.name if cat else "Unassigned"
            summary[cat_id] = {"name": cat_name, "amount": 0, "type": "Expense"}
            if cat and cat.irs_code == "Income":
                summary[cat_id]["type"] = "Income"
        
        summary[cat_id]["amount"] += tx.amount
        
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Account Number", "Account Description", "Debit Amount", "Credit Amount"])
    
    for cat_id, data in summary.items():
        debit = ""
        credit = ""
        if data["type"] == "Income":
            credit = f"{data['amount']:.2f}"
        else:
            debit = f"{data['amount']:.2f}"
            
        # Use user-specific mapping if exists, else fallback to default
        drake_code = mapping_dict.get(cat_id) or DRAKE_MAPPING.get(cat_id, "")

        writer.writerow([
            drake_code,
            data["name"],
            debit,
            credit
        ])
    return output.getvalue()

@router.get("/drake/schedule_c")
async def export_drake_schedule_c(
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    csv_content = generate_drake_schedule_c_csv(user_id, db, start_date, end_date)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=drake_schedule_c_{user_id}.csv"}
    )

@router.get("/drake/trial_balance")
async def export_drake_trial_balance(
    user_id: str,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    csv_content = generate_drake_trial_balance_csv(user_id, db, start_date, end_date)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=drake_trial_balance_{user_id}.csv"}
    )

@router.get("/drake/defaults")
async def get_drake_defaults():
    return DRAKE_MAPPING

@router.get("/drake/mappings", response_model=List[drake_schema.DrakeMapping])
async def list_drake_mappings(user_id: str, db: Session = Depends(get_db)):
    return db.query(DrakeMapping).filter(DrakeMapping.user_id == user_id).all()

@router.post("/drake/mappings")
async def save_drake_mappings(
    user_id: str, 
    mappings: List[drake_schema.DrakeMappingCreate], 
    db: Session = Depends(get_db)
):
    # Delete existing mappings for this user
    db.query(DrakeMapping).filter(DrakeMapping.user_id == user_id).delete()
    
    for m in mappings:
        new_mapping = DrakeMapping(
            user_id=user_id,
            category_id=m.category_id,
            drake_account_code=m.drake_account_code
        )
        db.add(new_mapping)
        
    db.commit()
    return {"status": "success", "count": len(mappings)}
