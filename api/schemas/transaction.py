from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

class TransactionBase(BaseModel):
    account_id: str
    plaid_transaction_id: Optional[str] = None
    date: date
    amount: Decimal
    vendor: str
    raw_description: str
    category_id: Optional[str] = None
    status: str
    source: str
    receipt_id: Optional[str] = None
    ai_confidence: Optional[float] = None
    user_overrode_category: bool = False
    suggestion_source: Optional[str] = None
    is_reimbursable: bool = False
    client_tag: Optional[str] = None
    original_amount: Optional[Decimal] = None
    original_currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    memo: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    status: Optional[str] = None
    is_reimbursable: Optional[bool] = None
    client_tag: Optional[str] = None
    memo: Optional[str] = None

class Transaction(TransactionBase):
    id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
