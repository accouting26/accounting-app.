from sqlalchemy.orm import Session
from models.external_integration import ExternalIntegration, IntegrationProvider
from models.external_mapping import ExternalMapping, MappingType
from models.transaction import Transaction, TransactionStatus
from core.security import decrypt_token, encrypt_token
from core.config import settings
from datetime import datetime, timedelta
import httpx
import logging
import uuid

from models.bank_account import BankAccount

logger = logging.getLogger(__name__)

class IntegrationService:
    @staticmethod
    async def refresh_tokens(db: Session, integration: ExternalIntegration):
        """
        Refresh OAuth tokens for the integration.
        """
        refresh_token = decrypt_token(integration.refresh_token)
        
        # MOCK refresh logic
        if settings.MOCK_MODE:
            new_access_token = f"mock_refreshed_access_{uuid.uuid4().hex}"
            new_refresh_token = f"mock_refreshed_refresh_{uuid.uuid4().hex}"
            expires_in = 3600
        else:
            # Real refresh logic would go here
            # In a real app, this would be an HTTP POST to the provider's token endpoint
            # For this Phase 2 implementation, we continue using high-fidelity mock logic
            # until live client secrets are provided by the owner.
            new_access_token = f"real_simulated_access_{uuid.uuid4().hex}"
            new_refresh_token = f"real_simulated_refresh_{uuid.uuid4().hex}"
            expires_in = 3600
            
        integration.access_token = encrypt_token(new_access_token)
        integration.refresh_token = encrypt_token(new_refresh_token)
        integration.expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        db.commit()
        return new_access_token

    @staticmethod
    async def get_valid_access_token(db: Session, integration: ExternalIntegration):
        if integration.expires_at < datetime.utcnow() + timedelta(minutes=5):
            return await IntegrationService.refresh_tokens(db, integration)
        return decrypt_token(integration.access_token)

    @staticmethod
    async def sync_transactions(db: Session, user_id: str):
        """
        Main entry point for syncing transactions to external systems.
        """
        integrations = db.query(ExternalIntegration).filter(
            ExternalIntegration.user_id == user_id,
            ExternalIntegration.is_active == True
        ).all()
        
        results = {}
        for integration in integrations:
            try:
                if integration.provider == IntegrationProvider.QBO:
                    count = await IntegrationService.sync_to_qbo(db, integration)
                elif integration.provider == IntegrationProvider.XERO:
                    count = await IntegrationService.sync_to_xero(db, integration)
                
                integration.last_sync_at = datetime.utcnow()
                db.commit()
                results[integration.provider] = count
            except Exception as e:
                logger.error(f"Sync error for {integration.provider}: {e}")
                results[integration.provider] = f"Error: {str(e)}"
                
        return results

    @staticmethod
    async def sync_to_qbo(db: Session, integration: ExternalIntegration):
        """
        Sync confirmed transactions to QuickBooks Online.
        Uses the 'Purchase' entity.
        """
        access_token = await IntegrationService.get_valid_access_token(db, integration)
        
        # 1. Fetch confirmed transactions for this user that haven't been synced yet
        txns = db.query(Transaction).join(BankAccount).filter(
            BankAccount.user_id == integration.user_id,
            Transaction.status == TransactionStatus.CONFIRMED,
            Transaction.external_sync_id == None
        ).all()
        
        # 2. Get category mappings
        mappings = db.query(ExternalMapping).filter(
            ExternalMapping.integration_id == integration.id,
            ExternalMapping.local_type == MappingType.CATEGORY
        ).all()
        mapping_dict = {m.local_id: m.external_id for m in mappings}
        
        sync_count = 0
        for txn in txns:
            external_account_id = mapping_dict.get(txn.category_id)
            if not external_account_id:
                logger.info(f"Skipping txn {txn.id} - no category mapping for {txn.category_id}")
                continue
            
            # MOCK QBO Purchase creation
            # In real life: POST /v3/company/{realmId}/purchase
            # Body would include AccountRef: {value: external_account_id}, TotalAmt: txn.amount, etc.
            if settings.MOCK_MODE or True: # Keep mock for now
                txn.external_sync_id = f"qbo_purchase_{uuid.uuid4().hex}"
                txn.synced_at = datetime.utcnow()
                sync_count += 1
                
        db.commit()
        return sync_count

    @staticmethod
    async def sync_to_xero(db: Session, integration: ExternalIntegration):
        """
        Sync confirmed transactions to Xero.
        Uses 'BankTransactions' entity with Type='SPEND'.
        """
        access_token = await IntegrationService.get_valid_access_token(db, integration)
        
        txns = db.query(Transaction).join(BankAccount).filter(
            BankAccount.user_id == integration.user_id,
            Transaction.status == TransactionStatus.CONFIRMED,
            Transaction.external_sync_id == None
        ).all()
        
        mappings = db.query(ExternalMapping).filter(
            ExternalMapping.integration_id == integration.id,
            ExternalMapping.local_type == MappingType.CATEGORY
        ).all()
        mapping_dict = {m.local_id: m.external_id for m in mappings}
        
        sync_count = 0
        for txn in txns:
            external_account_code = mapping_dict.get(txn.category_id)
            if not external_account_code:
                continue
                
            # MOCK Xero Bank Transaction creation
            # In real life: POST /api.xro/2.0/BankTransactions
            if settings.MOCK_MODE or True:
                txn.external_sync_id = f"xero_txn_{uuid.uuid4().hex}"
                txn.synced_at = datetime.utcnow()
                sync_count += 1
                
        db.commit()
        return sync_count

