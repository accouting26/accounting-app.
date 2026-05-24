import google.generativeai as genai
from sqlalchemy.orm import Session
from core.config import settings
from models.transaction import Transaction, TransactionStatus
from models.tax_category import TaxCategory
import json
import logging

logger = logging.getLogger(__name__)

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

async def categorize_transaction_logic(transaction_id: str, db: Session):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        logger.error(f"Transaction {transaction_id} not found for categorization")
        return None
        
    # Fetch all available tax categories
    categories = db.query(TaxCategory).all()
    category_list = [f"{c.id}: {c.name}" for c in categories]
    
    if not category_list:
        category_list = [
            "Advertising", "Office Supplies", "Professional Services", 
            "Travel", "Meals", "Software", "Rent", "Utilities"
        ]

    prompt = f"""
    You are an expert accountant. Categorize the following transaction into exactly one of these tax categories:
    {", ".join(category_list)}
    
    Transaction Details:
    Vendor: {transaction.vendor}
    Description: {transaction.raw_description}
    Amount: {transaction.amount}
    Date: {transaction.date}
    
    Return the result in JSON format ONLY:
    {{
        "category_id": "the exact ID or name from the list",
        "confidence": 0.0 to 1.0,
        "reasoning": "brief explanation"
    }}
    """
    
    try:
        if settings.MOCK_MODE or not model:
            # Mock AI response
            mock_response = {
                "category_id": categories[0].id if categories else "Office Supplies",
                "confidence": 0.95,
                "reasoning": "Mocked AI categorization"
            }
            ai_data = mock_response
        else:
            import asyncio
            # Offload blocking generative AI call to a thread
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: model.generate_content(prompt))
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            ai_data = json.loads(text)
            
        suggested = ai_data.get("category_id")
        confidence = ai_data.get("confidence", 0)
        
        # Populate KPI tracking fields
        transaction.ai_confidence = confidence
        transaction.suggestion_source = "gemini-1.5-flash-v1" if model else "mock-ai-v1"
        transaction.user_overrode_category = False # Freshly categorized
        
        category = None
        if categories:
            category = db.query(TaxCategory).filter(TaxCategory.id == suggested).first()
            if not category:
                category = db.query(TaxCategory).filter(TaxCategory.name == suggested).first()
        
        if category:
            transaction.category_id = category.id
            # Only update status if it's not already confirmed (e.g. by a receipt)
            if transaction.status != TransactionStatus.CONFIRMED:
                if confidence > 0.9:
                    transaction.status = TransactionStatus.CONFIRMED
                else:
                    transaction.status = TransactionStatus.UNPROCESSED
                    
        db.commit()
        return ai_data
        
    except Exception as e:
        logger.error(f"AI Categorization error: {e}")
        return None
