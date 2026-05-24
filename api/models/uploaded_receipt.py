from sqlalchemy import Column, String, JSON, Enum, DateTime
import uuid
from datetime import datetime
from db.session import Base
import enum

class ReceiptStatus(str, enum.Enum):
    PENDING = "Pending"
    EXTRACTED = "Extracted"
    MATCHED = "Matched"
    ERROR = "Error"

class UploadedReceipt(Base):
    __tablename__ = "uploaded_receipts"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    s3_url = Column(String)
    extracted_data = Column(JSON, nullable=True)
    status = Column(Enum(ReceiptStatus), default=ReceiptStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
