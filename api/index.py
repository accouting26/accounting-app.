from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from endpoints import plaid, ocr, ai, cpa, users, transactions, export, integrations, payments, messages, attachments
import asyncio
import logging
from db.session import engine, Base, get_db, SessionLocal
from core.config import settings
from models.external_integration import ExternalIntegration
from models.comment import Comment
from models.attachment import Attachment
from models.drake_mapping import DrakeMapping
from services.integration_service import IntegrationService

logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Accounting at your Service")

# Background job for transaction sync
async def scheduled_sync_job():
    while True:
        try:
            logger.info("Starting scheduled transaction sync...")
            db = SessionLocal()
            
            # Find all users with active integrations
            active_integrations = db.query(ExternalIntegration).filter(ExternalIntegration.is_active == True).all()
            user_ids = list(set([integration.user_id for integration in active_integrations]))
            
            for user_id in user_ids:
                logger.info(f"Background syncing for user: {user_id}")
                await IntegrationService.sync_transactions(db, user_id)
                
            db.close()
        except Exception as e:
            logger.error(f"Scheduled sync error: {e}")
        
        await asyncio.sleep(3600) # Run every hour

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(scheduled_sync_job())

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plaid.router, prefix="/api/plaid", tags=["plaid"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["ocr"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(cpa.router, prefix="/api/cpa", tags=["cpa"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
app.include_router(attachments.router, prefix="/api/attachments", tags=["attachments"])

@app.get("/")
async def root():
    return {"message": "Welcome to Accounting at your Service API"}

@app.get("/api/health")
async def health_check(db = Depends(get_db)):
    db_status = "connected"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "mock_mode": settings.MOCK_MODE,
        "database": db_status
    }
