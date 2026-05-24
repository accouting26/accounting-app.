from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Boolean
from db.session import Base
import enum
import uuid
from datetime import datetime

class UserRole(str, enum.Enum):
    CLIENT = "client"
    CPA = "cpa"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(Enum(UserRole), default=UserRole.CLIENT)
    company_name = Column(String, nullable=True)
    referral_code = Column(String, unique=True, index=True, nullable=True)
    referred_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    is_paid = Column(Boolean, default=False)
    subscription_status = Column(String, default="free")
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CPAPartnerClient(Base):
    __tablename__ = "cpa_partner_clients"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    cpa_id = Column(String, ForeignKey("users.id"), index=True)
    client_id = Column(String, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
