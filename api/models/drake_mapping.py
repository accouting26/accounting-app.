from sqlalchemy import Column, String, ForeignKey, DateTime
from db.session import Base
import uuid
from datetime import datetime

class DrakeMapping(Base):
    __tablename__ = "drake_mappings"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    category_id = Column(String, index=True) # ID of the local tax category
    drake_account_code = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
