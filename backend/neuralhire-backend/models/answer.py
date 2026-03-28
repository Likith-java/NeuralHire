from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base
from datetime import datetime


class Answer(Base):
    __tablename__ = "answers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(String, nullable=False)
    input_mode = Column(String, default="text")
    semantic_score = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    clarity_score = Column(Float, default=0.0)
    depth_score = Column(Float, default=0.0)
    hesitation_score = Column(Float, default=0.0)
    claude_score = Column(Float, default=0.0)
    final_score = Column(Float, default=0.0)
    aria_feedback = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
