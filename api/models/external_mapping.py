from sqlalchemy import Column, String, ForeignKey, DateTime, Enum
from db.session import Base
import uuid
from datetime import datetime
import enum

class MappingType(str, enum.Enum):
    CATEGORY = "Category"
    VENDOR = "Vendor"
    ACCOUNT = "Account"

class ExternalMapping(Base):
    __tablename__ = "external_mappings"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    integration_id = Column(String, ForeignKey("external_integrations.id"), index=True)
    local_type = Column(Enum(MappingType))
    local_id = Column(String) # UUID of local entity (e.g. tax_category.id)
    external_id = Column(String)
    external_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
