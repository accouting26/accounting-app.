from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from models.transaction import Transaction, TransactionStatus
from services.ai_service import categorize_transaction_logic
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/categorize/{transaction_id}")
async def categorize_transaction(transaction_id: str, db: Session = Depends(get_db)):
    ai_data = await categorize_transaction_logic(transaction_id, db)
    if ai_data is None:
        raise HTTPException(status_code=500, detail="AI Categorization failed")
    return {"status": "success", "ai_suggestion": ai_data}

@router.post("/feedback")
async def user_feedback(transaction_id: str, category_id: str, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    transaction.category_id = category_id
    transaction.status = TransactionStatus.CONFIRMED
    transaction.user_overrode_category = True
    db.commit()
    
    # In a real app, we'd store this feedback to fine-tune future prompts
    return {"status": "updated"}
