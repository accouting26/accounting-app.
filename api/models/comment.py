from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from db.session import Base
import uuid
from datetime import datetime

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String, ForeignKey("transactions.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="comments")
    user = relationship("User")
    attachments = relationship("Attachment", back_populates="comment", cascade="all, delete-orphan")
