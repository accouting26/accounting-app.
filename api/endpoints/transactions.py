from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.session import get_db
from models.transaction import Transaction, TransactionStatus
from models.comment import Comment
from models.user import User, UserRole, CPAPartnerClient
from models.bank_account import BankAccount
from models.tax_category import TaxCategory
from schemas import transaction as transaction_schema
from schemas import comment as comment_schema

router = APIRouter()

@router.get("/", response_model=List[transaction_schema.Transaction])
async def list_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()

@router.patch("/{transaction_id}/confirm", response_model=transaction_schema.Transaction)
async def confirm_transaction(transaction_id: str, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    transaction.status = TransactionStatus.CONFIRMED
    db.commit()
    db.refresh(transaction)
    return transaction

@router.patch("/{transaction_id}/category", response_model=transaction_schema.Transaction)
async def update_transaction_category(
    transaction_id: str, 
    category_id: str, 
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If the new category is different from what we had, mark as overrode
    if transaction.category_id != category_id:
        transaction.user_overrode_category = True
    
    transaction.category_id = category_id
    transaction.status = TransactionStatus.CONFIRMED # Usually confirmed when user updates it
    
    db.commit()
    db.refresh(transaction)
    return transaction

@router.patch("/{transaction_id}", response_model=transaction_schema.Transaction)
async def update_transaction(
    transaction_id: str,
    transaction_in: transaction_schema.TransactionUpdate,
    db: Session = Depends(get_db)
):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    update_data = transaction_in.dict(exclude_unset=True)
    
    # If category is being updated, handle logic
    if "category_id" in update_data:
        if transaction.category_id != update_data["category_id"]:
            transaction.user_overrode_category = True
            transaction.status = TransactionStatus.CONFIRMED
            
    for field in update_data:
        setattr(transaction, field, update_data[field])

    db.commit()
    db.refresh(transaction)
    return transaction

@router.get("/categories")
async def list_categories(db: Session = Depends(get_db)):
    return db.query(TaxCategory).all()

@router.get("/{transaction_id}/comments", response_model=List[comment_schema.Comment])
async def get_transaction_comments(
    transaction_id: str,
    user_id: str, # For MVP, passed as param
    db: Session = Depends(get_db)
):
    # 1. Get transaction and verify it exists
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    # 2. Authorization check
    bank_account = db.query(BankAccount).filter(BankAccount.id == transaction.account_id).first()
    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")
        
    owner_id = bank_account.user_id
    
    if user_id != owner_id:
        # Check if user is a CPA linked to this owner
        is_linked_cpa = db.query(CPAPartnerClient).filter(
            CPAPartnerClient.cpa_id == user_id,
            CPAPartnerClient.client_id == owner_id
        ).first() is not None
        
        if not is_linked_cpa:
            raise HTTPException(status_code=403, detail="Not authorized to view comments for this transaction")
            
    return db.query(Comment).filter(Comment.transaction_id == transaction_id).order_by(Comment.created_at.asc()).all()

@router.post("/{transaction_id}/comments", response_model=comment_schema.Comment)
async def create_transaction_comment(
    transaction_id: str,
    comment_in: comment_schema.CommentCreate,
    user_id: str, # For MVP, passed as param
    db: Session = Depends(get_db)
):
    # 1. Get transaction and verify it exists
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    # 2. Authorization check
    bank_account = db.query(BankAccount).filter(BankAccount.id == transaction.account_id).first()
    if not bank_account:
        raise HTTPException(status_code=404, detail="Bank account not found")
        
    owner_id = bank_account.user_id
    
    if user_id != owner_id:
        # Check if user is a CPA linked to this owner
        is_linked_cpa = db.query(CPAPartnerClient).filter(
            CPAPartnerClient.cpa_id == user_id,
            CPAPartnerClient.client_id == owner_id
        ).first() is not None
        
        if not is_linked_cpa:
            raise HTTPException(status_code=403, detail="Not authorized to comment on this transaction")
            
    new_comment = Comment(
        transaction_id=transaction_id,
        user_id=user_id,
        content=comment_in.content
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
