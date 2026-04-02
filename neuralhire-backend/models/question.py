from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from database import Base
from datetime import datetime


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    question_text = Column(String, nullable=False)
    question_number = Column(Integer, nullable=False)
    is_followup = Column(Boolean, default=False)
    depth_mode = Column(String, default="surface")
    created_at = Column(DateTime, default=datetime.utcnow)
