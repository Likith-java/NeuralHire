from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from loguru import logger
from typing import List

from database import get_db
from schemas import CandidateSummary, RecruiterStats
from models.recruiter import Recruiter, RecruiterSession
from models.session import InterviewSession
from models.question import Question
from models.answer import Answer
from models.integrity import IntegrityScore
from services.auth_service import get_current_recruiter

router = APIRouter()


async def require_recruiter(x_auth_token: str = Header(...), db: Session = Depends(get_db)):
    recruiter = get_current_recruiter(x_auth_token, db)
    if not recruiter:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please login again.")
    return recruiter


def get_hire_label(flag: str):
    return {"strong_yes": "STRONG HIRE", "maybe": "MAYBE", "no": "NO HIRE"}.get(flag, "PENDING")


@router.get("/candidates")
async def get_candidates(recruiter: Recruiter = Depends(require_recruiter), db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.recruiter_id == recruiter.id
    ).order_by(InterviewSession.created_at.desc()).all()
    
    logger.info(f"Recruiter {recruiter.email} fetched {len(sessions)} candidates")
    
    return [
        {
            "session_id": s.id,
            "candidate_name": s.candidate_name,
            "job_role": s.job_role,
            "status": s.status,
            "overall_score": s.overall_score,
            "hire_flag": s.hire_flag,
            "hire_label": get_hire_label(s.hire_flag),
            "input_mode": s.input_mode,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None
        }
        for s in sessions
    ]


@router.get("/candidates/{session_id}")
async def get_candidate_detail(
    session_id: str,
    recruiter: Recruiter = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.recruiter_id == recruiter.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=403, detail="Access denied. This session does not belong to your account.")
    
    questions = db.query(Question).filter(Question.session_id == session_id).order_by(Question.question_number).all()
    answers = db.query(Answer).filter(Answer.session_id == session_id).all()
    integrity = db.query(IntegrityScore).filter(IntegrityScore.session_id == session_id).first()
    
    logger.info(f"Recruiter {recruiter.email} accessed session {session_id}")
    
    return {
        "session": {
            "id": session.id,
            "job_role": session.job_role,
            "required_skills": session.required_skills.split(",") if session.required_skills else [],
            "status": session.status,
            "overall_score": session.overall_score,
            "hire_flag": session.hire_flag,
            "hire_label": get_hire_label(session.hire_flag),
            "candidate_name": session.candidate_name,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None
        },
        "questions": [
            {
                "id": q.id,
                "text": q.question_text,
                "number": q.question_number,
                "is_followup": q.is_followup
            }
            for q in questions
        ],
        "answers": [
            {
                "id": a.id,
                "question_id": a.question_id,
                "text": a.answer_text,
                "final_score": a.final_score,
                "semantic_score": a.semantic_score,
                "confidence_score": a.confidence_score,
                "hesitation_score": a.hesitation_score,
                "aria_feedback": a.aria_feedback,
                "created_at": a.created_at.isoformat() if a.created_at else None
            }
            for a in answers
        ],
        "integrity": {
            "score": integrity.current_score if integrity else 100.0,
            "status": integrity.status if integrity else "verified"
        }
    }


@router.get("/candidates/compare")
async def compare_candidates(
    session_ids: str = Query(..., description="Comma-separated session IDs"),
    recruiter: Recruiter = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    ids = [s.strip() for s in session_ids.split(",")]
    
    sessions = db.query(InterviewSession).filter(
        InterviewSession.id.in_(ids),
        InterviewSession.recruiter_id == recruiter.id
    ).all()
    
    candidates = []
    for s in sessions:
        answers = db.query(Answer).filter(Answer.session_id == s.id).all()
        integrity = db.query(IntegrityScore).filter(IntegrityScore.session_id == s.id).first()
        
        skill_scores = {
            "problem_solving": 0.0,
            "system_design": 0.0,
            "communication": 0.0,
            "code_quality": 0.0,
            "technical_depth": 0.0,
            "adaptability": 0.0
        }
        
        if answers:
            skill_scores["problem_solving"] = sum(a.semantic_score for a in answers) / len(answers) * 10
            skill_scores["system_design"] = sum(a.depth_score for a in answers) / len(answers) * 10
            skill_scores["communication"] = sum(a.clarity_score for a in answers) / len(answers) * 10
            skill_scores["code_quality"] = sum(a.claude_score for a in answers) / len(answers) * 10
            skill_scores["technical_depth"] = sum(a.confidence_score for a in answers) / len(answers) * 10
            skill_scores["adaptability"] = s.overall_score
        
        candidates.append({
            "session_id": s.id,
            "candidate_name": s.candidate_name,
            "overall_score": s.overall_score,
            "hire_flag": s.hire_flag,
            "skill_scores": skill_scores,
            "integrity_score": integrity.current_score if integrity else 100.0,
            "total_questions": len(answers),
            "input_mode": s.input_mode
        })
    
    return {"candidates": candidates}


@router.get("/stats")
async def get_stats(recruiter: Recruiter = Depends(require_recruiter), db: Session = Depends(get_db)):
    sessions = db.query(InterviewSession).filter(
        InterviewSession.recruiter_id == recruiter.id
    ).all()
    
    completed = [s for s in sessions if s.status == "complete"]
    in_progress = [s for s in sessions if s.status == "active"]
    
    total = len(sessions)
    strong_hire = len([s for s in completed if s.hire_flag == "strong_yes"])
    maybe = len([s for s in completed if s.hire_flag == "maybe"])
    no_hire = len([s for s in completed if s.hire_flag == "no"])
    
    avg_score = sum(s.overall_score for s in completed) / len(completed) if completed else 0.0
    
    top = None
    if completed:
        top_session = max(completed, key=lambda s: s.overall_score)
        top = {"session_id": top_session.id, "name": top_session.candidate_name, "score": top_session.overall_score}
    
    recent = sorted(sessions, key=lambda s: s.created_at or datetime.min, reverse=True)[:5]
    recent_sessions = [
        {
            "session_id": s.id,
            "candidate_name": s.candidate_name,
            "overall_score": s.overall_score,
            "status": s.status
        }
        for s in recent
    ]
    
    return {
        "total_interviews": total,
        "completed": len(completed),
        "in_progress": len(in_progress),
        "strong_hire_count": strong_hire,
        "maybe_count": maybe,
        "no_hire_count": no_hire,
        "avg_score": round(avg_score, 1),
        "top_candidate": top,
        "recent_sessions": recent_sessions
    }


@router.delete("/candidates/{session_id}")
async def delete_candidate(
    session_id: str,
    recruiter: Recruiter = Depends(require_recruiter),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.recruiter_id == recruiter.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=403, detail="Access denied. This session does not belong to your account.")
    
    session.status = "deleted"
    db.commit()
    
    logger.info(f"Session {session_id} deleted by {recruiter.email}")
    return {"message": "Interview record removed from your dashboard"}


from datetime import datetime
