from sqlalchemy import Column, String, ForeignKey, Date, Numeric, DateTime, Enum, Float, Boolean
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from db.session import Base
import enum

class TransactionStatus(str, enum.Enum):
    UNPROCESSED = "UNPROCESSED"
    CONFIRMED = "CONFIRMED"
    SPLIT = "SPLIT"

class TransactionSource(str, enum.Enum):
    BANK = "BANK"
    MANUAL = "MANUAL"
    OCR = "OCR"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String, ForeignKey("bank_accounts.id"), index=True)
    plaid_transaction_id = Column(String, unique=True, index=True, nullable=True)
    date = Column(Date)
    amount = Column(Numeric(10, 2))
    vendor = Column(String)
    raw_description = Column(String)
    category_id = Column(String, ForeignKey("tax_categories.id"), nullable=True)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.UNPROCESSED)
    source = Column(Enum(TransactionSource), default=TransactionSource.BANK)
    receipt_id = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    user_overrode_category = Column(Boolean, default=False)
    suggestion_source = Column(String, nullable=True)
    is_reimbursable = Column(Boolean, default=False)
    client_tag = Column(String, nullable=True)
    original_amount = Column(Numeric(10, 2), nullable=True)
    original_currency = Column(String, nullable=True)
    exchange_rate = Column(Float, nullable=True)
    memo = Column(String, nullable=True)
    external_sync_id = Column(String, nullable=True)
    synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    comments = relationship("Comment", back_populates="transaction", cascade="all, delete-orphan")
