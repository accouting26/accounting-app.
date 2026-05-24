from sqlalchemy import Column, String, ForeignKey, DateTime, Integer
from sqlalchemy.orm import relationship
from db.session import Base
import uuid
from datetime import datetime

class Attachment(Base):
    __tablename__ = "attachments"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    comment_id = Column(String, ForeignKey("comments.id"), index=True)
    filename = Column(String)
    file_size = Column(Integer)
    content_type = Column(String)
    storage_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    comment = relationship("Comment", back_populates="attachments")
