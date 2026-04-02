from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from loguru import logger
import uuid
from datetime import datetime

from database import get_db
from models.session import InterviewSession
from models.question import Question
from models.answer import Answer
from schemas import StartSessionRequest, AnswerRequest, SessionResponse, AnswerResponse
from services.groq_service import generate_question, generate_followup
from services.scoring_service import score_answer

router = APIRouter()


@router.post("/session/start", response_model=SessionResponse)
async def start_session(req: StartSessionRequest, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    
    session = InterviewSession(
        id=session_id,
        job_role=req.job_role,
        required_skills=",".join(req.required_skills),
        difficulty=req.difficulty,
        input_mode=req.input_mode,
        status="active",
        candidate_name=req.candidate_name,
        recruiter_id=req.recruiter_id
    )
    db.add(session)
    
    question_text = generate_question(
        req.job_role, req.required_skills, req.difficulty, 1
    )
    
    question = Question(
        session_id=session_id,
        question_text=question_text,
        question_number=1,
        is_followup=False,
        depth_mode=req.difficulty
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    
    logger.info(f"Session {session_id} started — Role: {req.job_role}")
    
    return SessionResponse(
        session_id=session_id,
        first_question=question_text,
        question_number=1,
        question_id=question.id
    )


@router.post("/session/answer", response_model=AnswerResponse)
async def submit_answer(req: AnswerRequest, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        raise HTTPException(status_code=400, detail="Session is not active")
    
    question = db.query(Question).filter(Question.id == req.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    scores = score_answer(req.answer, question.question_text, session.job_role)
    
    answer = Answer(
        session_id=req.session_id,
        question_id=req.question_id,
        answer_text=req.answer,
        input_mode=req.input_mode,
        semantic_score=scores["semantic_score"],
        confidence_score=scores["confidence_score"],
        clarity_score=scores["clarity_score"],
        depth_score=scores["depth_score"],
        hesitation_score=scores["hesitation_score"],
        claude_score=scores["claude_score"],
        final_score=scores["final_score"],
        aria_feedback=scores["aria_feedback"]
    )
    db.add(answer)
    
    existing_answers = db.query(Answer).filter(Answer.session_id == req.session_id).all()
    total_score = sum(a.final_score for a in existing_answers) + scores["final_score"]
    avg_score = total_score / (len(existing_answers) + 1)
    session.overall_score = avg_score
    
    question_number = question.question_number
    is_followup = question.is_followup
    next_question = None
    next_question_id = None
    interview_complete = False
    
    if req.input_mode == "sign":
        max_questions = 10
    else:
        max_questions = 8
    
    if scores["final_score"] < 70 and not is_followup:
        next_question = generate_followup(question.question_text, req.answer, scores["final_score"])
        is_followup = True
        next_q = Question(
            session_id=req.session_id,
            question_text=next_question,
            question_number=question_number + 1,
            is_followup=True,
            depth_mode="deep_dive"
        )
        db.add(next_q)
        db.flush()
        next_question_id = next_q.id
        question_number += 1
    elif question_number >= max_questions:
        interview_complete = True
        session.status = "complete"
        session.completed_at = datetime.utcnow()
        
        if avg_score >= 75:
            session.hire_flag = "strong_yes"
        elif avg_score >= 50:
            session.hire_flag = "maybe"
        else:
            session.hire_flag = "no"
    else:
        next_q_num = question_number + 1
        next_question = generate_question(
            session.job_role,
            session.required_skills.split(","),
            session.difficulty,
            next_q_num
        )
        next_q = Question(
            session_id=req.session_id,
            question_text=next_question,
            question_number=next_q_num,
            is_followup=False,
            depth_mode=session.difficulty
        )
        db.add(next_q)
        db.flush()
        next_question_id = next_q.id
        question_number = next_q_num
    
    db.commit()
    
    logger.info(f"Answer scored {scores['final_score']:.1f} — session {req.session_id} Q{question_number}")
    
    return AnswerResponse(
        scores=scores,
        confidence_score=scores["confidence_score"] * 10,
        clarity_score=scores["clarity_score"] * 10,
        depth_score=scores["depth_score"] * 10,
        hesitation_score=scores["hesitation_score"] * 10,
        overall_score=scores["final_score"],
        semantic_score=scores["semantic_score"] * 10,
        next_question=next_question,
        next_question_id=next_question_id,
        question_number=question_number,
        is_followup=is_followup,
        interview_complete=interview_complete,
        aria_feedback=scores["aria_feedback"],
        skill_scores=scores["skill_scores"]
    )


@router.get("/session/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    questions = db.query(Question).filter(Question.session_id == session_id).order_by(Question.question_number).all()
    answers = db.query(Answer).filter(Answer.session_id == session_id).order_by(Answer.created_at).all()
    
    return {
        "session": {
            "id": session.id,
            "job_role": session.job_role,
            "required_skills": session.required_skills.split(",") if session.required_skills else [],
            "status": session.status,
            "overall_score": session.overall_score,
            "hire_flag": session.hire_flag,
            "candidate_name": session.candidate_name,
            "created_at": session.created_at,
            "completed_at": session.completed_at
        },
        "questions": [{"id": q.id, "text": q.question_text, "number": q.question_number, "is_followup": q.is_followup} for q in questions],
        "answers": [{
            "id": a.id,
            "question_id": a.question_id,
            "text": a.answer_text,
            "final_score": a.final_score,
            "aria_feedback": a.aria_feedback,
            "created_at": a.created_at
        } for a in answers]
    }

@router.post("/session/finish")
async def finish_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "complete"
    session.completed_at = datetime.utcnow()
    
    # Set hire flag based on overall score so far
    avg_score = session.overall_score or 0
    if avg_score >= 75:
        session.hire_flag = "strong_yes"
    elif avg_score >= 50:
        session.hire_flag = "maybe"
    else:
        session.hire_flag = "no"
        
    db.commit()
    logger.info(f"Session {session_id} finished early via user request")
    return {"message": "Interview finished", "overall_score": avg_score}
