from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Enum
from db.session import Base
import uuid
from datetime import datetime
import enum

class IntegrationProvider(str, enum.Enum):
    QBO = "QBO"
    XERO = "XERO"

class ExternalIntegration(Base):
    __tablename__ = "external_integrations"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), index=True)
    provider = Column(Enum(IntegrationProvider))
    access_token = Column(String) # Encrypted
    refresh_token = Column(String) # Encrypted
    expires_at = Column(DateTime)
    realm_id = Column(String, nullable=True) # For QBO
    tenant_id = Column(String, nullable=True) # For Xero
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
