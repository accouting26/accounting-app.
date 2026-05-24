from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import plaid
from plaid.api import plaid_api
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
import logging
import uuid
from datetime import date

from core.config import settings
from core.security import encrypt_token, decrypt_token
from db.session import get_db
from models.bank_account import BankAccount
from models.transaction import Transaction, TransactionStatus, TransactionSource
from schemas import transaction as transaction_schema
from typing import List

from services.ai_service import categorize_transaction_logic
from services.matching_service import match_transaction_to_receipts_logic
from services.currency_service import CurrencyService

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Plaid client
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox if settings.PLAID_ENV == "sandbox" else plaid.Environment.Development,
    api_key={
        'clientId': settings.PLAID_CLIENT_ID,
        'secret': settings.PLAID_SECRET,
    }
)
api_client = plaid.ApiClient(configuration)
client = plaid_api.PlaidApi(api_client)

async def sync_transactions_for_item(db: Session, item_id: str):
    logger.info(f"Syncing transactions for item: {item_id}")
    
    if settings.MOCK_MODE:
        return await _sync_mock_transactions(db, item_id)

    # Fetch any one account for this item to get the access token
    bank_account = db.query(BankAccount).filter(BankAccount.item_id == item_id).first()
    if not bank_account:
        logger.error(f"No bank account found for item: {item_id}")
        return None
        
    access_token = decrypt_token(bank_account.access_token)
    cursor = bank_account.next_cursor
    
    # Get all accounts for this item to map plaid_account_id to our internal id
    all_accounts = db.query(BankAccount).filter(BankAccount.item_id == item_id).all()
    account_map = {acc.plaid_account_id: acc.id for acc in all_accounts}
    
    added = []
    modified = []
    removed = []
    has_more = True
    
    try:
        while has_more:
            request = TransactionsSyncRequest(
                access_token=access_token,
                cursor=cursor,
            )
            response = client.transactions_sync(request)
            
            added.extend(response['added'])
            modified.extend(response['modified'])
            removed.extend(response['removed'])
            
            has_more = response['has_more']
            cursor = response['next_cursor']
            
        logger.info(f"Plaid sync returned: {len(added)} added, {len(modified)} modified, {len(removed)} removed")
            
        # Process removals
        for txn in removed:
            db.query(Transaction).filter(Transaction.plaid_transaction_id == txn['transaction_id']).delete()
            
        # Process additions
        for txn in added:
            plaid_acc_id = txn['account_id']
            internal_acc_id = account_map.get(plaid_acc_id)
            if not internal_acc_id:
                continue 
                
            existing = db.query(Transaction).filter(Transaction.plaid_transaction_id == txn['transaction_id']).first()
            if not existing:
                iso_currency = txn.get('iso_currency_code') or 'USD'
                amount_usd = txn['amount']
                rate = 1.0
                
                if iso_currency != 'USD':
                    amount_usd, rate = CurrencyService.convert_to_usd(txn['amount'], iso_currency)
                
                new_txn = Transaction(
                    account_id=internal_acc_id,
                    plaid_transaction_id=txn['transaction_id'],
                    date=txn['date'],
                    amount=amount_usd,
                    original_amount=txn['amount'],
                    original_currency=iso_currency,
                    exchange_rate=rate,
                    vendor=txn.get('merchant_name') or txn['name'],
                    raw_description=txn['name'],
                    source=TransactionSource.BANK,
                    status=TransactionStatus.UNPROCESSED
                )
                db.add(new_txn)
                db.flush() # To get the id
                
                # Trigger AI Categorization (Async or background task would be better, but doing it inline for MVP consolidation)
                await categorize_transaction_logic(new_txn.id, db)
                
                # Try to match with existing receipts
                await match_transaction_to_receipts_logic(new_txn.id, db)
        
        # Process modifications
        for txn in modified:
            existing = db.query(Transaction).filter(Transaction.plaid_transaction_id == txn['transaction_id']).first()
            if existing:
                existing.date = txn['date']
                existing.amount = txn['amount']
                existing.vendor = txn.get('merchant_name') or txn['name']
                existing.raw_description = txn['name']
        
        # Update cursor for ALL accounts of this item
        for acc in all_accounts:
            acc.next_cursor = cursor
            
        db.commit()
        return {"added": len(added), "modified": len(modified), "removed": len(removed)}
        
    except plaid.ApiException as e:
        logger.error(f"Error syncing transactions: {e}")
        return None

@router.post("/create_link_token")
async def create_link_token(user_id: str):
    if settings.MOCK_MODE:
        return {"link_token": f"mock-link-token-{user_id}", "expiration": "2099-01-01T00:00:00Z"}
    
    try:
        request = LinkTokenCreateRequest(
            products=[Products("transactions")],
            client_name="Accounting at your Service",
            country_codes=[CountryCode("US")],
            language="en",
            user=LinkTokenCreateRequestUser(client_user_id=user_id),
        )
        response = client.link_token_create(request)
        return response.to_dict()
    except plaid.ApiException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/exchange_public_token")
async def exchange_public_token(public_token: str, user_id: str, db: Session = Depends(get_db)):
    if settings.MOCK_MODE:
        return await _mock_exchange_public_token(public_token, user_id, db)
    
    try:
        # Exchange public token for access token
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )
        exchange_response = client.item_public_token_exchange(exchange_request)
        
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']
        
        # Encrypt the access token
        encrypted_token = encrypt_token(access_token)
        
        # Get account info
        accounts_request = AccountsGetRequest(access_token=access_token)
        accounts_response = client.accounts_get(accounts_request)
        
        for account in accounts_response['accounts']:
            # Check if account already exists
            existing = db.query(BankAccount).filter(BankAccount.plaid_account_id == account['account_id']).first()
            if existing:
                existing.access_token = encrypted_token
                existing.item_id = item_id
            else:
                new_account = BankAccount(
                    user_id=user_id,
                    account_name=account['name'],
                    account_type=str(account['type']),
                    last_four=account['mask'],
                    plaid_account_id=account['account_id'],
                    access_token=encrypted_token,
                    item_id=item_id
                )
                db.add(new_account)
            
        db.commit()
        
        # Trigger initial sync
        await sync_transactions_for_item(db, item_id)

        return {"status": "success", "item_id": item_id}
        
    except plaid.ApiException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sync/{item_id}")
async def manual_sync(item_id: str, db: Session = Depends(get_db)):
    result = await sync_transactions_for_item(db, item_id)
    if result is None:
        raise HTTPException(status_code=500, detail="Error syncing with Plaid")
    return result

@router.post("/webhook")
async def plaid_webhook(webhook_data: dict, db: Session = Depends(get_db)):
    webhook_type = webhook_data.get("webhook_type")
    webhook_code = webhook_data.get("webhook_code")
    item_id = webhook_data.get("item_id")
    
    if webhook_type == "TRANSACTIONS" and webhook_code == "SYNC_UPDATES_AVAILABLE":
        await sync_transactions_for_item(db, item_id)
            
    return {"status": "received"}

@router.get("/transactions", response_model=List[transaction_schema.Transaction])
async def get_transactions(db: Session = Depends(get_db)):
    return db.query(Transaction).all()

async def _mock_exchange_public_token(public_token: str, user_id: str, db: Session):
    logger.info(f"MOCK: Exchanging public token for user {user_id}")
    item_id = f"mock-item-{uuid.uuid4().hex[:8]}"
    access_token = encrypt_token(f"mock-access-token-{item_id}")
    
    # Create a mock bank account
    new_account = BankAccount(
        user_id=user_id,
        account_name="Mock Business Checking",
        account_type="depository",
        last_four="4444",
        plaid_account_id=f"mock-acc-{uuid.uuid4().hex[:8]}",
        access_token=access_token,
        item_id=item_id
    )
    db.add(new_account)
    db.commit()
    
    # Trigger mock sync
    await _sync_mock_transactions(db, item_id)
    
    return {"status": "success", "item_id": item_id, "mode": "mock"}

async def _sync_mock_transactions(db: Session, item_id: str):
    logger.info(f"MOCK: Syncing transactions for item {item_id}")
    all_accounts = db.query(BankAccount).filter(BankAccount.item_id == item_id).all()
    if not all_accounts:
        return None
        
    mock_txns_data = [
        {"vendor": "Amazon", "amount": 120.50, "desc": "Office Supplies", "currency": "USD"},
        {"vendor": "Starbucks", "amount": 15.75, "desc": "Business Meal", "currency": "USD"},
        {"vendor": "Verizon", "amount": 89.99, "desc": "Monthly Internet", "currency": "USD"},
        {"vendor": "Staples", "amount": 45.00, "desc": "Printer Ink", "currency": "USD"},
        {"vendor": "Uber", "amount": 32.40, "desc": "Travel to Client", "currency": "USD"},
        {"vendor": "Euro Cafe", "amount": 25.00, "desc": "Business Dinner in Berlin", "currency": "EUR"},
        {"vendor": "London Hotel", "amount": 200.00, "desc": "Business Travel UK", "currency": "GBP"}
    ]
    
    added_count = 0
    for acc in all_accounts:
        for m in mock_txns_data:
            # Check if already exists to avoid duplicates in subsequent mock syncs
            existing = db.query(Transaction).filter(
                Transaction.account_id == acc.id,
                Transaction.vendor == m["vendor"],
                Transaction.original_amount == m["amount"]
            ).first()
            
            if not existing:
                iso_currency = m.get("currency", "USD")
                amount_usd, rate = CurrencyService.convert_to_usd(m["amount"], iso_currency)
                
                new_txn = Transaction(
                    id=str(uuid.uuid4()),
                    account_id=acc.id,
                    plaid_transaction_id=f"mock-txn-{uuid.uuid4().hex[:8]}",
                    date=date.today(),
                    amount=amount_usd,
                    original_amount=m["amount"],
                    original_currency=iso_currency,
                    exchange_rate=rate,
                    vendor=m["vendor"],
                    raw_description=m["desc"],
                    source=TransactionSource.BANK,
                    status=TransactionStatus.UNPROCESSED
                )
                db.add(new_txn)
                db.flush()
                
                # Trigger AI Categorization (which will also use Mock AI if key is missing)
                await categorize_transaction_logic(new_txn.id, db)
                added_count += 1
                
    db.commit()
    return {"added": added_count, "modified": 0, "removed": 0, "mode": "mock"}
