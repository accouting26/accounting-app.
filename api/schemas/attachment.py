from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AttachmentBase(BaseModel):
    filename: str
    file_size: int
    content_type: str

class AttachmentCreate(AttachmentBase):
    comment_id: str
    storage_path: str

class Attachment(AttachmentBase):
    id: str
    comment_id: str
    created_at: datetime

    class Config:
        from_attributes = True
