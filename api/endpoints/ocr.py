from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import boto3
from botocore.config import Config
from core.config import settings
from db.session import get_db
from models.uploaded_receipt import UploadedReceipt, ReceiptStatus
from models.transaction import Transaction, TransactionStatus
from datetime import datetime, timedelta
import uuid

from services.matching_service import match_receipt_to_transaction_logic

router = APIRouter()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION,
    config=Config(signature_version="s3v4")
)

textract_client = boto3.client(
    "textract",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

def parse_textract_expense(response):
    """
    Parses AWS Textract AnalyzeExpense response to extract key fields.
    """
    extracted_data = {
        "vendor_name": None,
        "total_amount": 0.0,
        "date": None,
        "tax": 0.0,
        "raw_fields": {}
    }
    
    if 'ExpenseDocuments' not in response:
        return extracted_data
        
    # We typically only process the first document if multiple are sent
    doc = response['ExpenseDocuments'][0]
    
    for field in doc.get('SummaryFields', []):
        field_type = field.get('Type', {}).get('Text')
        field_value = field.get('ValueDetection', {}).get('Text')
        
        if not field_type or not field_value:
            continue
            
        extracted_data["raw_fields"][field_type] = field_value
        
        if field_type == "VENDOR_NAME":
            extracted_data["vendor_name"] = field_value
        elif field_type == "TOTAL":
            # Clean up currency symbols and commas
            clean_value = field_value.replace("$", "").replace(",", "").strip()
            try:
                extracted_data["total_amount"] = float(clean_value)
            except ValueError:
                pass
        elif field_type == "TRANSACTION_DATE":
            extracted_data["date"] = field_value # Textract returns it as it is
        elif field_type == "TAX":
            clean_value = field_value.replace("$", "").replace(",", "").strip()
            try:
                extracted_data["tax"] = float(clean_value)
            except ValueError:
                pass
                
    return extracted_data

@router.post("/upload-url")
async def get_upload_url(user_id: str, file_name: str, db: Session = Depends(get_db)):
    receipt_id = str(uuid.uuid4())
    s3_key = f"receipts/{user_id}/{receipt_id}_{file_name}"
    
    if settings.MOCK_MODE:
        new_receipt = UploadedReceipt(
            id=receipt_id,
            user_id=user_id,
            s3_url=f"s3://mock-bucket/{s3_key}",
            status=ReceiptStatus.PENDING
        )
        db.add(new_receipt)
        db.commit()
        return {"receipt_id": receipt_id, "upload_url": f"https://mock-s3-upload-url.com/{s3_key}", "mode": "mock"}

    try:
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": s3_key,
                "ContentType": "image/jpeg" # Or detect from extension
            },
            ExpiresIn=3600
        )
        
        # Create record in database
        new_receipt = UploadedReceipt(
            id=receipt_id,
            user_id=user_id,
            s3_url=f"s3://{settings.S3_BUCKET_NAME}/{s3_key}",
            status=ReceiptStatus.PENDING
        )
        db.add(new_receipt)
        db.commit()
        
        return {"receipt_id": receipt_id, "upload_url": presigned_url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process/{receipt_id}")
async def process_receipt(receipt_id: str, db: Session = Depends(get_db)):
    receipt = db.query(UploadedReceipt).filter(UploadedReceipt.id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
        
    # Extract Bucket and Key from S3 URL
    s3_url_parts = receipt.s3_url.replace("s3://", "").split("/", 1)
    bucket = s3_url_parts[0]
    key = s3_url_parts[1]
    
    try:
        # MOCK response for development
        if settings.MOCK_MODE:
            # Try to match the amount of a mock transaction to make the demo work nicely
            extracted_data = {
                "vendor_name": "Amazon",
                "total_amount": 120.50,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "tax": 10.00
            }
        elif not settings.AWS_ACCESS_KEY_ID:
            extracted_data = {
                "vendor_name": "Starbucks",
                "total_amount": 5.45,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "tax": 0.45
            }
        else:
            import asyncio
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                lambda: textract_client.analyze_expense(
                    Document={'S3Object': {'Bucket': bucket, 'Name': key}}
                )
            )
            extracted_data = parse_textract_expense(response)
            
        receipt.extracted_data = extracted_data
        receipt.status = ReceiptStatus.EXTRACTED
        db.commit()
        
        # Trigger matching logic
        await match_receipt_to_transaction_logic(receipt_id, db)
        
        return {"status": "processed", "data": extracted_data}
        
    except Exception as e:
        receipt.status = ReceiptStatus.ERROR
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
