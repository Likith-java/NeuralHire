from passlib.context import CryptContext
from datetime import datetime, timedelta
import secrets
import string
import bcrypt
from loguru import logger
from sqlalchemy.orm import Session
from models.recruiter import Recruiter, RecruiterSession

pwd_context = CryptContext(schemes=["bcrypt"])


def generate_company_password(company_name: str) -> str:
    # Clean company name (only alphanumeric)
    clean_name = ''.join(c for c in company_name.upper() if c.isalnum())[:4]
    if not clean_name:
        clean_name = "COMP"
    
    # Generate password with only ASCII characters (short password)
    digits = ''.join(secrets.choice(string.digits) for _ in range(4))
    special = ''.join(secrets.choice("!@#$") for _ in range(2))
    suffix = ''.join(secrets.choice(string.ascii_lowercase) for _ in range(3))
    
    password = clean_name + digits + special + suffix
    return password


def hash_password(plain: str) -> str:
    # Use bcrypt directly with proper encoding
    password_bytes = plain.encode('utf-8')[:60]  # Limit to 60 chars for safety
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    # Use bcrypt directly for verification
    password_bytes = plain.encode('utf-8')[:60]
    hashed_bytes = hashed.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_session_token(recruiter_id: int, db: Session) -> str:
    token = secrets.token_urlsafe(48)
    expires = datetime.utcnow() + timedelta(days=7)
    session = RecruiterSession(
        recruiter_id=recruiter_id,
        token=token,
        expires_at=expires
    )
    db.add(session)
    db.commit()
    logger.info(f"Session created for recruiter_id={recruiter_id}")
    return token


def get_current_recruiter(token: str, db: Session):
    session = db.query(RecruiterSession).filter(
        RecruiterSession.token == token,
        RecruiterSession.is_active == True
    ).first()
    
    if not session:
        return None
    
    if datetime.utcnow() > session.expires_at:
        session.is_active = False
        db.commit()
        logger.warning("Expired session token used")
        return None
    
    recruiter = db.query(Recruiter).filter(Recruiter.id == session.recruiter_id).first()
    return recruiter


async def require_recruiter(x_auth_token: str = None, db: Session = None):
    if not x_auth_token:
        return None
    return get_current_recruiter(x_auth_token, db)
