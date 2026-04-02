from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks
from sqlalchemy.orm import Session
from loguru import logger
from datetime import datetime, timedelta
import secrets

from database import get_db
from schemas import SignupRequest, LoginRequest, ForgotPasswordReq, ResetPasswordReq
from models.recruiter import Recruiter, RecruiterSession
from services.auth_service import (
    generate_company_password, hash_password, verify_password,
    create_session_token, get_current_recruiter
)
from services.email_service import send_welcome_email, send_reset_email

router = APIRouter()


async def require_recruiter(x_auth_token: str = Header(...), db: Session = Depends(get_db)):
    recruiter = get_current_recruiter(x_auth_token, db)
    if not recruiter:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please login again.")
    return recruiter


@router.post("/signup")
async def signup(req: SignupRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    existing = db.query(Recruiter).filter(Recruiter.email == req.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered. Please login.")
    
    try:
        plain_password = generate_company_password(req.company_name)
        hashed = hash_password(plain_password)
    except Exception as e:
        logger.error(f"Password generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate password")
    
    hint = plain_password[:3] + "*" * (len(plain_password) - 3)
    
    recruiter = Recruiter(
        full_name=req.full_name,
        email=req.email,
        company_name=req.company_name,
        company_size=req.company_size,
        hashed_password=hashed,
        raw_password_hint=hint
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)
    
    token = create_session_token(recruiter.id, db)
    
    background_tasks.add_task(send_welcome_email, req.email, req.full_name, req.company_name, plain_password)
    
    logger.info(f"New recruiter: {req.email} | {req.company_name}")
    
    return {
        "message": "Account created successfully",
        "recruiter_id": recruiter.id,
        "company_name": recruiter.company_name,
        "session_token": token,
        "generated_password": plain_password,
        "password_hint": hint,
        "note": "Save this password — it will NOT be shown again"
    }


@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.email == req.email).first()
    if not recruiter:
        raise HTTPException(status_code=404, detail="No account found. Please sign up first.")
    
    if not verify_password(req.password, recruiter.hashed_password):
        logger.warning(f"Failed login: {req.email}")
        raise HTTPException(status_code=401, detail="Incorrect password. Check your email for your generated password.")
    
    recruiter.last_login = datetime.utcnow()
    db.commit()
    
    token = create_session_token(recruiter.id, db)
    
    logger.info(f"Recruiter login: {req.email}")
    
    return {
        "message": "Login successful",
        "session_token": token,
        "recruiter_id": recruiter.id,
        "full_name": recruiter.full_name,
        "company_name": recruiter.company_name,
        "expires_in": "7 days"
    }


@router.post("/logout")
async def logout(x_auth_token: str = Header(...), db: Session = Depends(get_db)):
    recruiter = get_current_recruiter(x_auth_token, db)
    session = db.query(RecruiterSession).filter(RecruiterSession.token == x_auth_token).first()
    if session:
        session.is_active = False
        db.commit()
    
    logger.info(f"Recruiter logged out: {recruiter.email if recruiter else 'Unknown'}")
    return {"message": "Logged out successfully"}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordReq, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(Recruiter.email == req.email).first()
    
    if recruiter:
        reset_token = secrets.token_urlsafe(32)
        recruiter.reset_token = reset_token
        recruiter.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        
        background_tasks.add_task(send_reset_email, recruiter.email, recruiter.full_name, reset_token)
        logger.info(f"Password reset requested: {recruiter.email}")
    
    return {"message": "If that email exists, a reset link was sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordReq, db: Session = Depends(get_db)):
    recruiter = db.query(Recruiter).filter(
        Recruiter.email == req.email,
        Recruiter.reset_token == req.token
    ).first()
    
    if not recruiter:
        raise HTTPException(status_code=404, detail="Invalid or expired reset token")
    
    if datetime.utcnow() > recruiter.reset_token_expires:
        raise HTTPException(status_code=400, detail="Reset token has expired. Request a new one.")
    
    if len(req.new_password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")
    
    recruiter.hashed_password = hash_password(req.new_password)
    recruiter.reset_token = None
    recruiter.reset_token_expires = None
    db.commit()
    
    logger.info(f"Password reset successful: {recruiter.email}")
    return {"message": "Password updated successfully. Please login with your new password."}


@router.get("/me")
async def get_me(recruiter: Recruiter = Depends(require_recruiter)):
    return {
        "id": recruiter.id,
        "full_name": recruiter.full_name,
        "email": recruiter.email,
        "company_name": recruiter.company_name,
        "company_size": recruiter.company_size,
        "created_at": recruiter.created_at.isoformat() if recruiter.created_at else None,
        "last_login": recruiter.last_login.isoformat() if recruiter.last_login else None
    }
