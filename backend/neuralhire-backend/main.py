from fastapi import FastAPI, Request, Depends, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware
from dotenv import load_dotenv
from loguru import logger
import os
import io
import sys

from database import engine, Base, get_db
from routers import session, gesture, integrity, report, media, keys, recruiter_auth, recruiter_dashboard

load_dotenv()

os.makedirs("logs", exist_ok=True)
logger.remove()
logger.add(
    "logs/neuralhire.log",
    rotation="10 MB",
    retention="3 days",
    level="INFO",
    format="{time} | {level} | {message}"
)
logger.add(sys.stderr, level="INFO", format="{time} | {level} | {message}")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        logger.info(f"{request.method} {request.url.path} → {response.status_code}")
        return response


app = FastAPI(title="NeuralHire OS API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)


app.include_router(session.router, prefix="/api", tags=["Session"])
app.include_router(gesture.router, prefix="/api", tags=["Gesture"])
app.include_router(integrity.router, prefix="/api", tags=["Integrity"])
app.include_router(report.router, prefix="/api", tags=["Report"])
app.include_router(media.router, prefix="/api", tags=["Media"])
app.include_router(keys.router, tags=["Access Keys"])
app.include_router(recruiter_auth.router, prefix="/api/recruiter", tags=["Recruiter Auth"])
app.include_router(recruiter_dashboard.router, prefix="/api/recruiter", tags=["Recruiter Dashboard"])


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled: {request.method} {request.url.path} — {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    logger.info("=" * 60)
    logger.info("NeuralHire OS API v2.0 — ONLINE")
    logger.info("ARIA is ready to conduct interviews")
    logger.info("Swagger: http://localhost:8000/docs")
    logger.info("=" * 60)


@app.get("/api/health")
async def health_check():
    return {"status": "online", "version": "2.0", "aria": "ready"}


@app.post("/api/demo/load")
async def load_demo_data(db: Session = Depends(get_db)):
    from models.session import InterviewSession
    from models.question import Question
    from models.answer import Answer
    from models.integrity import IntegrityScore
    from models.recruiter import Recruiter
    from datetime import datetime, timedelta
    import bcrypt

    demo_recruiter_email = "demo@neuralhire.io"
    demo_recruiter = db.query(Recruiter).filter(Recruiter.email == demo_recruiter_email).first()
    if not demo_recruiter:
        hashed = bcrypt.hashpw("demo1234".encode(), bcrypt.gensalt())
        demo_recruiter = Recruiter(
            full_name="Demo Recruiter",
            email=demo_recruiter_email,
            company_name="NeuralHire Demo",
            company_size="1-10",
            password_hash=hashed.decode(),
        )
        db.add(demo_recruiter)
        db.flush()

    demo_sessions = [
        {
            "id": "demo-session-A",
            "job_role": "Backend Engineer",
            "required_skills": "REST,SQL,System Design",
            "overall_score": 92.0,
            "hire_flag": "strong_yes",
            "status": "complete",
            "candidate_name": "Priya Sharma",
        },
        {
            "id": "demo-session-B",
            "job_role": "Backend Engineer",
            "required_skills": "REST,SQL,System Design",
            "overall_score": 54.0,
            "hire_flag": "maybe",
            "status": "complete",
            "candidate_name": "Rohan Mehta",
        },
        {
            "id": "demo-session-C",
            "job_role": "Frontend Engineer",
            "required_skills": "React,TypeScript,CSS",
            "overall_score": 78.0,
            "hire_flag": "strong_yes",
            "status": "complete",
            "candidate_name": "Arjun Kumar",
            "input_mode": "sign",
        },
    ]

    loaded = []
    for demo in demo_sessions:
        existing = db.query(InterviewSession).filter(InterviewSession.id == demo["id"]).first()
        if existing:
            continue

        session = InterviewSession(
            id=demo["id"],
            job_role=demo["job_role"],
            required_skills=demo["required_skills"],
            difficulty="deep_dive",
            input_mode=demo.get("input_mode", "text"),
            status=demo["status"],
            overall_score=demo["overall_score"],
            hire_flag=demo["hire_flag"],
            candidate_name=demo["candidate_name"],
            recruiter_id=demo_recruiter.id,
            created_at=datetime.utcnow() - timedelta(days=1),
            completed_at=datetime.utcnow(),
        )
        db.add(session)

        questions_data = [
            "Explain the difference between REST and GraphQL APIs.",
            "How would you design a database schema for a social media application?",
            "Describe the concept of database indexing and its performance impact.",
            "What are microservices and when would you choose them over a monolith?",
        ]

        for i, q_text in enumerate(questions_data):
            q = Question(
                session_id=demo["id"],
                question_text=q_text,
                question_number=i + 1,
                is_followup=False,
                depth_mode="deep_dive",
            )
            db.add(q)
            db.flush()

            score_range = (8.5, 9.5) if demo["hire_flag"] == "strong_yes" else (5.0, 6.0)
            for j in range(2):
                a = Answer(
                    session_id=demo["id"],
                    question_id=q.id,
                    answer_text="This is a comprehensive answer demonstrating deep technical knowledge and practical experience.",
                    input_mode=demo.get("input_mode", "text"),
                    semantic_score=score_range[0] / 10,
                    confidence_score=score_range[0] / 10,
                    clarity_score=score_range[0] / 10,
                    depth_score=score_range[0] / 10,
                    hesitation_score=0.1,
                    claude_score=score_range[0] / 10,
                    final_score=score_range[0] + j * 0.3,
                    aria_feedback="Good answer with solid technical depth.",
                )
                db.add(a)

        integrity = IntegrityScore(
            session_id=demo["id"],
            current_score=95.0 if demo["hire_flag"] == "strong_yes" else 80.0,
            status="verified",
        )
        db.add(integrity)

        loaded.append(demo["id"])

    db.commit()

    logger.info(f"Demo data loaded: {loaded}")
    return {"message": f"{len(loaded)} demo profiles loaded", "sessions": loaded}
