from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from loguru import logger
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

from database import get_db
from schemas import ReportResponse, AnswerDetail
from models.session import InterviewSession
from models.question import Question
from models.answer import Answer
from models.integrity import IntegrityScore

router = APIRouter()


@router.get("/report/{session_id}", response_model=ReportResponse)
async def get_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    questions = db.query(Question).filter(Question.session_id == session_id).order_by(Question.question_number).all()
    answers = db.query(Answer).filter(Answer.session_id == session_id).order_by(Answer.created_at).all()
    
    integrity_record = db.query(IntegrityScore).filter(IntegrityScore.session_id == session_id).first()
    integrity = {
        "score": integrity_record.current_score if integrity_record else 100.0,
        "status": integrity_record.status if integrity_record else "verified"
    }
    
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
        skill_scores["adaptability"] = session.overall_score
    
    hire_labels = {"strong_yes": "STRONG HIRE", "maybe": "MAYBE", "no": "NO HIRE"}
    hire_label = hire_labels.get(session.hire_flag, "PENDING")
    
    answer_details = []
    for a in answers:
        q = next((q for q in questions if q.id == a.question_id), None)
        answer_details.append(AnswerDetail(
            question_number=q.question_number if q else 0,
            question=q.question_text if q else "",
            answer=a.answer_text,
            final_score=a.final_score,
            confidence_score=a.confidence_score * 10,
            semantic_score=a.semantic_score * 10,
            hesitation_score=a.hesitation_score * 10,
            aria_feedback=a.aria_feedback or "",
            input_mode=a.input_mode,
            is_followup=q.is_followup if q else False
        ))
    
    logger.info(f"Report generated for session {session_id}")
    
    return ReportResponse(
        session_id=session_id,
        candidate_name=session.candidate_name,
        job_role=session.job_role,
        required_skills=session.required_skills.split(",") if session.required_skills else [],
        overall_score=session.overall_score,
        hire_flag=session.hire_flag,
        hire_label=hire_label,
        total_questions=len(questions),
        avg_score=session.overall_score,
        skill_scores=skill_scores,
        answers=answer_details,
        integrity=integrity,
        completed_at=session.completed_at.isoformat() if session.completed_at else None
    )


@router.get("/report/{session_id}/pdf")
async def get_report_pdf(session_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    questions = db.query(Question).filter(Question.session_id == session_id).order_by(Question.question_number).all()
    answers = db.query(Answer).filter(Answer.session_id == session_id).order_by(Answer.created_at).all()
    integrity_record = db.query(IntegrityScore).filter(IntegrityScore.session_id == session_id).first()
    
    hire_labels = {"strong_yes": "STRONG HIRE", "maybe": "MAYBE", "no": "NO HIRE"}
    hire_label = hire_labels.get(session.hire_flag, "PENDING")
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    content = []
    
    content.append(Paragraph("NeuralHire OS — Interview Evaluation Report", styles['Title']))
    content.append(Paragraph(f"Candidate: {session.candidate_name or 'N/A'} | Role: {session.job_role}", styles['Normal']))
    content.append(Paragraph(f"Date: {session.completed_at or 'In Progress'}", styles['Normal']))
    content.append(Spacer(1, 16))
    
    content.append(Paragraph(f"Overall Score: {session.overall_score:.1f} / 100", styles['Heading1']))
    content.append(Paragraph(f"Recommendation: {hire_label}", styles['Heading2']))
    content.append(Spacer(1, 12))
    
    content.append(Paragraph("Question-by-Question Breakdown", styles['Heading2']))
    table_data = [["#", "Question", "Score", "ARIA Feedback"]]
    
    for a in answers:
        q = next((q for q in questions if q.id == a.question_id), None)
        q_text = (q.question_text[:55] + "...") if q and len(q.question_text) > 55 else (q.question_text if q else "")
        feedback = (a.aria_feedback[:50] + "...") if a.aria_feedback and len(a.aria_feedback) > 50 else (a.aria_feedback or "")
        table_data.append([
            str(q.question_number if q else 0),
            q_text,
            f"{a.final_score:.1f}",
            feedback
        ])
    
    t = Table(table_data, colWidths=[30, 250, 50, 180])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#7c6af7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f5f5ff')])
    ]))
    content.append(t)
    content.append(Spacer(1, 12))
    
    content.append(Paragraph(
        f"Integrity Score: {integrity_record.current_score if integrity_record else 100:.0f}/100 — {(integrity_record.status if integrity_record else 'verified').upper()}",
        styles['Normal']
    ))
    content.append(Paragraph("Generated by NeuralHire OS v2.0 · Powered by Claude Sonnet 4.5", styles['Normal']))
    
    doc.build(content)
    buffer.seek(0)
    
    logger.info(f"PDF report downloaded for session {session_id}")
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{session_id[:8]}.pdf"}
    )
