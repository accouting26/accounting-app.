from sqlalchemy.orm import Session
from models.uploaded_receipt import UploadedReceipt, ReceiptStatus
from models.transaction import Transaction, TransactionStatus
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

async def match_receipt_to_transaction_logic(receipt_id: str, db: Session):
    receipt = db.query(UploadedReceipt).filter(UploadedReceipt.id == receipt_id).first()
    if not receipt or not receipt.extracted_data:
        return None
        
    data = receipt.extracted_data
    amount = data.get("total_amount")
    vendor = data.get("vendor_name")
    date_str = data.get("date")
    
    if not amount or not date_str:
        return None
        
    try:
        receipt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        logger.error(f"Invalid date format in receipt {receipt_id}: {date_str}")
        return None
    
    start_date = receipt_date - timedelta(days=3)
    end_date = receipt_date + timedelta(days=3)
    
    possible_matches = db.query(Transaction).filter(
        Transaction.amount == amount,
        Transaction.date >= start_date,
        Transaction.date <= end_date,
        Transaction.receipt_id == None
    ).all()
    
    if possible_matches:
        # Try to find a match that also matches the vendor name
        if vendor:
            for m in possible_matches:
                if m.vendor and vendor.lower() in m.vendor.lower():
                    match = m
                    break
            else:
                # If no vendor match, just pick the first one (or we could be more strict)
                match = possible_matches[0]
        else:
            match = possible_matches[0]
            
        match.receipt_id = receipt.id
        match.status = TransactionStatus.CONFIRMED
        receipt.status = ReceiptStatus.MATCHED
        db.commit()
        return match.id
    
    return None

async def match_transaction_to_receipts_logic(transaction_id: str, db: Session):
    """Try to find an unmatched receipt for a new transaction"""
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction or transaction.receipt_id:
        return None
        
    start_date = transaction.date - timedelta(days=3)
    end_date = transaction.date + timedelta(days=3)
    
    # Look for unmatched receipts with the same amount and near date
    # Optimization: Filter by amount in the query
    unmatched_receipts = db.query(UploadedReceipt).filter(
        UploadedReceipt.status == ReceiptStatus.EXTRACTED
    ).all()
    
    # We still need to check the date in the JSON field in Python unless we use SQLite JSON functions
    # For now, let's at least mention it. 
    # Actually, let's filter by amount if possible, but total_amount is inside a JSON column.
    
    for receipt in unmatched_receipts:
        data = receipt.extracted_data
        if not data: continue
        
        r_amount = data.get("total_amount")
        r_date_str = data.get("date")
        if not r_amount or not r_date_str: continue
        
        try:
            r_date = datetime.strptime(r_date_str, "%Y-%m-%d").date()
        except ValueError: continue
        
        if r_amount == float(transaction.amount) and start_date <= r_date <= end_date:
            # Check for vendor name match if available
            if transaction.vendor and data.get("vendor_name"):
                if transaction.vendor.lower() in data.get("vendor_name").lower() or \
                   data.get("vendor_name").lower() in transaction.vendor.lower():
                    # High confidence match
                    transaction.receipt_id = receipt.id
                    transaction.status = TransactionStatus.CONFIRMED
                    receipt.status = ReceiptStatus.MATCHED
                    db.commit()
                    return receipt.id
            else:
                # Fallback to amount/date match if vendor info is missing
                transaction.receipt_id = receipt.id
                transaction.status = TransactionStatus.CONFIRMED
                receipt.status = ReceiptStatus.MATCHED
                db.commit()
                return receipt.id
            
    return None
