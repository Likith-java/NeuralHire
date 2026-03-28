from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from database import Base
from datetime import datetime


class IntegrityEvent(Base):
    __tablename__ = "integrity_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), nullable=False)
    event_type = Column(String, nullable=False)
    severity = Column(String, default="low")
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(String, nullable=True)


class IntegrityScore(Base):
    __tablename__ = "integrity_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("interview_sessions.id"), unique=True, nullable=False)
    current_score = Column(Float, default=100.0)
    looking_away_count = Column(Integer, default=0)
    reading_suspicion_count = Column(Integer, default=0)
    multiple_faces_count = Column(Integer, default=0)
    tab_switch_count = Column(Integer, default=0)
    status = Column(String, default="verified")
    last_updated = Column(DateTime, default=datetime.utcnow)
