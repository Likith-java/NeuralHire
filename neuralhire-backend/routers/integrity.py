from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from loguru import logger
from datetime import datetime

from database import get_db
from schemas import IntegrityEventRequest
from models.integrity import IntegrityEvent, IntegrityScore
from models.session import InterviewSession
from services.integrity_service import calculate_score, get_status, get_badge, get_severity

router = APIRouter()


@router.post("/integrity/{session_id}")
async def log_integrity_event(session_id: str, req: IntegrityEventRequest, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    severity = get_severity(req.event_type)
    
    event = IntegrityEvent(
        session_id=session_id,
        event_type=req.event_type,
        severity=severity,
        details=req.details
    )
    db.add(event)
    
    score_record = db.query(IntegrityScore).filter(IntegrityScore.session_id == session_id).first()
    if not score_record:
        score_record = IntegrityScore(session_id=session_id)
        db.add(score_record)
    
    if req.event_type == "looking_away":
        score_record.looking_away_count += 1
    elif req.event_type == "reading_suspicion":
        score_record.reading_suspicion_count += 1
    elif req.event_type == "multiple_faces":
        score_record.multiple_faces_count += 1
    elif req.event_type == "tab_switch":
        score_record.tab_switch_count += 1
    
    events = {
        "looking_away": score_record.looking_away_count,
        "reading_suspicion": score_record.reading_suspicion_count,
        "multiple_faces": score_record.multiple_faces_count,
        "tab_switch": score_record.tab_switch_count
    }
    
    new_score = calculate_score(events)
    score_record.current_score = new_score
    score_record.status = get_status(new_score)
    score_record.last_updated = datetime.utcnow()
    
    db.commit()
    
    logger.warning(f"[INTEGRITY] {req.event_type} on session {session_id} → score={new_score:.0f}")
    
    return {
        "score": new_score,
        "status": score_record.status,
        "event_logged": req.event_type
    }


@router.get("/integrity/{session_id}/summary")
async def get_integrity_summary(session_id: str, db: Session = Depends(get_db)):
    score_record = db.query(IntegrityScore).filter(IntegrityScore.session_id == session_id).first()
    
    if not score_record:
        return {
            "score": 100.0,
            "status": "verified",
            "badge": "green",
            "counters": {
                "looking_away": 0,
                "reading_suspicion": 0,
                "multiple_faces": 0,
                "tab_switch": 0
            },
            "flags": []
        }
    
    events = db.query(IntegrityEvent).filter(
        IntegrityEvent.session_id == session_id
    ).order_by(IntegrityEvent.timestamp.desc()).all()
    
    return {
        "score": score_record.current_score,
        "status": score_record.status,
        "badge": get_badge(score_record.status),
        "counters": {
            "looking_away": score_record.looking_away_count,
            "reading_suspicion": score_record.reading_suspicion_count,
            "multiple_faces": score_record.multiple_faces_count,
            "tab_switch": score_record.tab_switch_count
        },
        "flags": [
            {
                "event_type": e.event_type,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
                "details": e.details,
                "severity": e.severity
            } for e in events
        ]
    }
