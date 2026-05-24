from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from schemas.attachment import Attachment

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    pass

class Comment(CommentBase):
    id: str
    transaction_id: str
    user_id: str
    created_at: datetime
    attachments: List[Attachment] = []

    class Config:
        from_attributes = True
