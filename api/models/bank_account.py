from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from db.session import Base

class BankAccount(Base):
    __tablename__ = "bank_accounts"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    provider = Column(String, default="Plaid")
    account_name = Column(String)
    account_type = Column(String)
    last_four = Column(String)
    plaid_account_id = Column(String, unique=True, index=True)
    access_token = Column(String) # Encrypted
    item_id = Column(String, index=True)
    next_cursor = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
