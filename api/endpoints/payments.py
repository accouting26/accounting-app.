from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from db.session import get_db
from core.config import settings
from models.user import User
import stripe

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY

@router.post("/create-checkout-session")
async def create_checkout_session(
    plan: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    price_id = None
    if plan == "professional":
        price_id = settings.STRIPE_PRICE_PROFESSIONAL
    elif plan == "business":
        price_id = settings.STRIPE_PRICE_BUSINESS
    else:
        raise HTTPException(status_code=400, detail="Invalid plan")

    try:
        # If user doesn't have a stripe_customer_id, create one
        customer_id = user.stripe_customer_id
        if not customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                metadata={"user_id": user.id}
            )
            customer_id = customer.id
            user.stripe_customer_id = customer_id
            db.commit()

        checkout_session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=['card'],
            line_items=[
                {
                    'price': price_id,
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=f"http://localhost:3000/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"http://localhost:3000/pricing",
            metadata={
                "user_id": user.id,
                "plan": plan
            }
        )
        return {"id": checkout_session.id, "url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    payload = await request.body()
    event = None

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        handle_checkout_session_completed(session, db)
    elif event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        handle_subscription_updated(subscription, db)
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        handle_subscription_deleted(subscription, db)

    return {"status": "success"}

def handle_checkout_session_completed(session, db: Session):
    user_id = session.get('metadata', {}).get('user_id')
    plan = session.get('metadata', {}).get('plan')
    subscription_id = session.get('subscription')
    
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.is_paid = True
            user.subscription_status = plan
            user.stripe_subscription_id = subscription_id
            db.commit()

def handle_subscription_updated(subscription, db: Session):
    stripe_customer_id = subscription.get('customer')
    user = db.query(User).filter(User.stripe_customer_id == stripe_customer_id).first()
    if user:
        # Map price ID back to plan name if possible, or just update status from subscription status
        status = subscription.get('status')
        if status == 'active':
            user.is_paid = True
        else:
            user.is_paid = False
        db.commit()

def handle_subscription_deleted(subscription, db: Session):
    stripe_customer_id = subscription.get('customer')
    user = db.query(User).filter(User.stripe_customer_id == stripe_customer_id).first()
    if user:
        user.is_paid = False
        user.subscription_status = 'free'
        user.stripe_subscription_id = None
        db.commit()
