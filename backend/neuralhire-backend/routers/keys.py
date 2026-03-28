from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from sqlalchemy.orm import Session
from loguru import logger
from datetime import datetime, timedelta
import secrets
import string
from passlib.context import CryptContext

from database import get_db
from schemas import RequestKeyRequest, VerifyKeyRequest
from models.interview_key import InterviewKey
from services.email_service import send_key_email

pwd_context = CryptContext(schemes=["bcrypt"])
router = APIRouter()


@router.post("/request-key")
async def request_key(req: RequestKeyRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    try:
        key = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        hashed_key = pwd_context.hash(key)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        interview_key = InterviewKey(
            email=req.email,
            hashed_key=hashed_key,
            expires_at=expires_at
        )
        db.add(interview_key)
        db.commit()
        
        background_tasks.add_task(send_key_email, req.email, key)
        
        logger.info(f"Interview key requested for {req.email}")
        return {"message": "Key sent to your email", "expires_in": "24 hours"}
    except Exception as e:
        logger.error(f"Key generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate key")


@router.post("/verify-key")
async def verify_key(req: VerifyKeyRequest, db: Session = Depends(get_db)):
    interview_key = db.query(InterviewKey).filter(
        InterviewKey.email == req.email,
        InterviewKey.is_used == False
    ).order_by(InterviewKey.created_at.desc()).first()
    
    if not interview_key:
        raise HTTPException(status_code=404, detail="No active key found for this email")
    
    if datetime.utcnow() > interview_key.expires_at:
        raise HTTPException(status_code=400, detail="Key has expired. Request a new one.")
    
    if not pwd_context.verify(req.key, interview_key.hashed_key):
        logger.warning(f"Failed key attempt for {req.email}")
        raise HTTPException(status_code=401, detail="Invalid key")
    
    interview_key.is_used = True
    interview_key.used_at = datetime.utcnow()
    db.commit()
    
    logger.info(f"Key verified successfully for {req.email}")
    return {"verified": True, "email": req.email, "message": "Access granted"}

