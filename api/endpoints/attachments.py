from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from db.session import get_db
from models.attachment import Attachment
import os

router = APIRouter()

@router.get("/{attachment_id}")
async def get_attachment(attachment_id: str, db: Session = Depends(get_db)):
    """
    Retrieve an attachment by ID.
    """
    attachment = db.query(Attachment).filter(Attachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    if not os.path.exists(attachment.storage_path):
        raise HTTPException(status_code=404, detail="File not found on storage")
        
    return FileResponse(
        attachment.storage_path,
        media_type=attachment.content_type,
        filename=attachment.filename
    )
