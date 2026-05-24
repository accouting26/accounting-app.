from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.session import get_db
from models.external_integration import ExternalIntegration, IntegrationProvider
from core.config import settings
from core.security import encrypt_token
import uuid
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/qbo/connect")
async def qbo_connect(user_id: str):
    """
    Returns the QBO authorization URL.
    """
    # In a real app, this would construct the URL with client_id, scope, etc.
    # For MVP, we'll return a mock URL.
    client_id = "MOCK_QBO_CLIENT_ID"
    redirect_uri = "https://api.accountingforyou.com/api/integrations/qbo/callback"
    scope = "com.intuit.quickbooks.accounting"
    state = str(uuid.uuid4())
    
    auth_url = f"https://appcenter.intuit.com/connect/oauth2?client_id={client_id}&response_type=code&scope={scope}&redirect_uri={redirect_uri}&state={state}"
    
    return {"auth_url": auth_url, "state": state}

@router.get("/qbo/callback")
async def qbo_callback(code: str, realmId: str, state: str, user_id: str, db: Session = Depends(get_db)):
    """
    Callback from QBO to exchange code for tokens.
    """
    # 1. Exchange code for access_token and refresh_token (MOCK)
    # In reality, this would be a POST to Intuit's token endpoint.
    
    access_token = f"mock_qbo_access_token_{uuid.uuid4().hex}"
    refresh_token = f"mock_qbo_refresh_token_{uuid.uuid4().hex}"
    expires_in = 3600
    
    # 2. Store integration
    integration = db.query(ExternalIntegration).filter(
        ExternalIntegration.user_id == user_id,
        ExternalIntegration.provider == IntegrationProvider.QBO
    ).first()
    
    if not integration:
        integration = ExternalIntegration(
            user_id=user_id,
            provider=IntegrationProvider.QBO
        )
        db.add(integration)
        
    integration.access_token = encrypt_token(access_token)
    integration.refresh_token = encrypt_token(refresh_token)
    integration.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    integration.realm_id = realmId
    integration.is_active = True
    
    db.commit()
    
    return {"status": "success", "provider": "QBO"}

@router.get("/xero/connect")
async def xero_connect(user_id: str):
    """
    Returns the Xero authorization URL.
    """
    client_id = "MOCK_XERO_CLIENT_ID"
    redirect_uri = "https://api.accountingforyou.com/api/integrations/xero/callback"
    scope = "accounting.transactions accounting.contacts accounting.settings offline_access"
    state = str(uuid.uuid4())
    
    auth_url = f"https://login.xero.com/identity/connect/authorize?client_id={client_id}&response_type=code&scope={scope}&redirect_uri={redirect_uri}&state={state}"
    
    return {"auth_url": auth_url, "state": state}

@router.get("/xero/callback")
async def xero_callback(code: str, state: str, user_id: str, db: Session = Depends(get_db)):
    """
    Callback from Xero to exchange code for tokens.
    """
    # 1. Exchange code for access_token and refresh_token (MOCK)
    
    access_token = f"mock_xero_access_token_{uuid.uuid4().hex}"
    refresh_token = f"mock_xero_refresh_token_{uuid.uuid4().hex}"
    expires_in = 1800
    tenant_id = str(uuid.uuid4()) # Xero uses tenants
    
    # 2. Store integration
    integration = db.query(ExternalIntegration).filter(
        ExternalIntegration.user_id == user_id,
        ExternalIntegration.provider == IntegrationProvider.XERO
    ).first()
    
    if not integration:
        integration = ExternalIntegration(
            user_id=user_id,
            provider=IntegrationProvider.XERO
        )
        db.add(integration)
        
    integration.access_token = encrypt_token(access_token)
    integration.refresh_token = encrypt_token(refresh_token)
    integration.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    integration.tenant_id = tenant_id
    integration.is_active = True
    
    db.commit()
    
    return {"status": "success", "provider": "XERO"}

@router.get("/{provider}/accounts")
async def get_external_accounts(provider: IntegrationProvider, user_id: str, db: Session = Depends(get_db)):
    """
    Fetch the Chart of Accounts from the external provider.
    """
    # 1. Get integration
    integration = db.query(ExternalIntegration).filter(
        ExternalIntegration.user_id == user_id,
        ExternalIntegration.provider == provider
    ).first()
    
    if not integration or not integration.is_active:
        raise HTTPException(status_code=400, detail=f"{provider} not connected")
        
    # 2. Mock fetching accounts
    mock_accounts = [
        {"external_id": "101", "name": "Advertising & Marketing"},
        {"external_id": "102", "name": "Office Supplies"},
        {"external_id": "103", "name": "Travel"},
        {"external_id": "104", "name": "Meals & Entertainment"},
        {"external_id": "105", "name": "Rent or Lease"},
        {"external_id": "106", "name": "Professional Services"},
    ]
    
    return mock_accounts

from models.external_mapping import ExternalMapping, MappingType
from services.integration_service import IntegrationService
from pydantic import BaseModel
from typing import List

class MappingIn(BaseModel):
    local_id: str
    external_id: str
    external_name: str

@router.post("/{provider}/mappings")
async def save_mappings(
    provider: IntegrationProvider, 
    user_id: str, 
    mappings: List[MappingIn], 
    db: Session = Depends(get_db)
):
    """
    Save mappings between local tax categories and external accounts.
    """
    integration = db.query(ExternalIntegration).filter(
        ExternalIntegration.user_id == user_id,
        ExternalIntegration.provider == provider
    ).first()
    
    if not integration:
        raise HTTPException(status_code=400, detail=f"{provider} not connected")
        
    # For MVP, we'll just replace existing mappings
    db.query(ExternalMapping).filter(ExternalMapping.integration_id == integration.id).delete()
    
    for m in mappings:
        new_mapping = ExternalMapping(
            integration_id=integration.id,
            local_type=MappingType.CATEGORY,
            local_id=m.local_id,
            external_id=m.external_id,
            external_name=m.external_name
        )
        db.add(new_mapping)
        
    db.commit()
    return {"status": "success", "count": len(mappings)}

@router.get("/{provider}/mappings")
async def list_mappings(provider: IntegrationProvider, user_id: str, db: Session = Depends(get_db)):
    """
    List existing mappings for the provider.
    """
    integration = db.query(ExternalIntegration).filter(
        ExternalIntegration.user_id == user_id,
        ExternalIntegration.provider == provider
    ).first()
    
    if not integration:
        return []
        
    return db.query(ExternalMapping).filter(ExternalMapping.integration_id == integration.id).all()

@router.post("/sync")
async def trigger_sync(user_id: str, db: Session = Depends(get_db)):
    """
    Manually trigger a sync for all active integrations for a user.
    """
    results = await IntegrationService.sync_transactions(db, user_id)
    return results
