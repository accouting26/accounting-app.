from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.session import get_db
from models.user import User, UserRole, CPAPartnerClient
from schemas import user as user_schema
from core.config import settings
import stripe
import uuid
import string
import random

router = APIRouter()

def generate_referral_code(email: str) -> str:
    # Simple referral code: first 4 chars of email + 4 random digits/chars
    prefix = "".join(filter(str.isalnum, email.split("@")[0]))[:4].upper()
    random_part = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"{prefix}{random_part}"

@router.post("/register", response_model=user_schema.User)
async def register_user(user_in: user_schema.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user (Client or CPA).
    """
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    referred_by_id = None
    if user_in.referral_code_applied:
        referrer = db.query(User).filter(User.referral_code == user_in.referral_code_applied.upper()).first()
        if referrer:
            referred_by_id = referrer.id
    
    # In a real app, hash the password
    user_id = str(uuid.uuid4())
    stripe_customer_id = None
    
    # Create Stripe customer if not in mock mode and keys are present
    if settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            customer = stripe.Customer.create(
                email=user_in.email,
                metadata={"user_id": user_id}
            )
            stripe_customer_id = customer.id
        except Exception as e:
            # For MVP, we might log this and continue, or fail registration
            print(f"Failed to create Stripe customer: {e}")

    new_user = User(
        id=user_id,
        email=user_in.email,
        hashed_password=user_in.password, # Plain text for MVP mock
        role=user_in.role,
        company_name=user_in.company_name,
        referral_code=generate_referral_code(user_in.email),
        referred_by_id=referred_by_id,
        is_paid=user_in.is_paid,
        subscription_status=user_in.subscription_status,
        stripe_customer_id=stripe_customer_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/validate-referral/{code}")
async def validate_referral(code: str, db: Session = Depends(get_db)):
    """
    Validate a referral code and return the referrer info.
    """
    referrer = db.query(User).filter(User.referral_code == code.upper()).first()
    if not referrer:
        raise HTTPException(status_code=404, detail="Referral code invalid")
    
    return {
        "valid": True,
        "referrer_email": referrer.email,
        "referrer_company": referrer.company_name
    }

@router.post("/link-cpa")
async def link_to_cpa(cpa_email: str, client_id: str, db: Session = Depends(get_db)):
    """
    Link a client to a CPA partner.
    """
    cpa = db.query(User).filter(User.email == cpa_email, User.role == UserRole.CPA).first()
    if not cpa:
        raise HTTPException(status_code=404, detail="CPA not found")
        
    client = db.query(User).filter(User.id == client_id, User.role == UserRole.CLIENT).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    existing = db.query(CPAPartnerClient).filter(
        CPAPartnerClient.cpa_id == cpa.id,
        CPAPartnerClient.client_id == client.id
    ).first()
    
    if existing:
        return {"status": "success", "message": "Already linked"}
        
    new_link = CPAPartnerClient(cpa_id=cpa.id, client_id=client.id)
    db.add(new_link)
    db.commit()
    
    return {"status": "success", "message": f"Client {client.email} linked to CPA {cpa.email}"}
