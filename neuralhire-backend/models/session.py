from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from database import Base
from datetime import datetime


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String, primary_key=True)
    job_role = Column(String, nullable=False)
    required_skills = Column(String, nullable=True)
    difficulty = Column(String, default="deep_dive")
    input_mode = Column(String, default="text")
    status = Column(String, default="idle")
    overall_score = Column(Float, default=0.0)
    hire_flag = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    candidate_name = Column(String, nullable=True)
    session_metadata = Column(String, nullable=True)
    recruiter_id = Column(Integer, nullable=True)
