from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from db.session import get_db
from models.comment import Comment
from models.attachment import Attachment
import os
import uuid
import shutil

router = APIRouter()

UPLOAD_DIR = "/home/team/shared/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/{message_id}/attachments")
async def upload_attachment(
    message_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload an attachment for a specific message (comment).
    """
    # Check if comment (message) exists
    comment = db.query(Comment).filter(Comment.id == message_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Message not found")
    
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename)[1]
    storage_filename = f"{file_id}{extension}"
    storage_path = os.path.join(UPLOAD_DIR, storage_filename)
    
    # Save file
    with open(storage_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Get file size
    file_size = os.path.getsize(storage_path)
    
    # Create attachment record
    attachment = Attachment(
        id=file_id,
        comment_id=message_id,
        filename=file.filename,
        file_size=file_size,
        content_type=file.content_type,
        storage_path=storage_path
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)
    
    return {
        "id": attachment.id,
        "comment_id": attachment.comment_id,
        "filename": attachment.filename,
        "file_size": attachment.file_size,
        "content_type": attachment.content_type,
        "created_at": attachment.created_at
    }
