from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class UploadedReceiptBase(BaseModel):
    user_id: str
    s3_url: str
    extracted_data: Optional[Any] = None
    status: str

class UploadedReceiptCreate(UploadedReceiptBase):
    pass

class UploadedReceipt(UploadedReceiptBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
