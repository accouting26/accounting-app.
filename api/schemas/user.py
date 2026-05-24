from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    role: UserRole
    company_name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    referral_code_applied: Optional[str] = None
    is_paid: bool = False
    subscription_status: str = "free"

class User(UserBase):
    id: str
    referral_code: Optional[str] = None
    referred_by_id: Optional[str] = None
    is_paid: bool = False
    subscription_status: str = "free"
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ClientSummary(BaseModel):
    id: str
    email: str
    company_name: Optional[str]
    total_confirmed_transactions: int
    total_unprocessed_transactions: int
    is_paid: bool = False
    subscription_status: str = "free"

    class Config:
        from_attributes = True

class LeaderboardEntry(BaseModel):
    referrer_email: str
    company_name: Optional[str] = None
    referral_count: int
    active_referral_count: int
    paid_referral_count: int

    class Config:
        from_attributes = True
