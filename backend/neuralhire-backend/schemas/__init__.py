from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class StartSessionRequest(BaseModel):
    job_role: str
    required_skills: List[str]
    difficulty: str = "deep_dive"
    input_mode: str = "text"
    candidate_name: Optional[str] = None
    recruiter_id: Optional[int] = None


class AnswerRequest(BaseModel):
    session_id: str
    answer: str
    input_mode: str = "text"
    question_id: int


class SessionResponse(BaseModel):
    session_id: str
    first_question: str
    question_number: int = 1
    question_id: int


class AnswerResponse(BaseModel):
    scores: dict
    confidence_score: float
    clarity_score: float
    depth_score: float
    hesitation_score: float
    overall_score: float
    semantic_score: float
    next_question: Optional[str] = None
    next_question_id: Optional[int] = None
    question_number: int
    is_followup: bool
    interview_complete: bool
    aria_feedback: str
    skill_scores: dict


class GestureRequest(BaseModel):
    landmarks: List[float]


class IntegrityEventRequest(BaseModel):
    event_type: str
    details: Optional[str] = None


class RequestKeyRequest(BaseModel):
    email: EmailStr


class VerifyKeyRequest(BaseModel):
    email: EmailStr
    key: str


class SignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    company_name: str
    company_size: str = "1-10"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordReq(BaseModel):
    email: EmailStr


class ResetPasswordReq(BaseModel):
    token: str
    email: EmailStr
    new_password: str


class AnswerDetail(BaseModel):
    question_number: int
    question: str
    answer: str
    final_score: float
    confidence_score: float
    semantic_score: float
    hesitation_score: float
    aria_feedback: str
    input_mode: str
    is_followup: bool


class ReportResponse(BaseModel):
    session_id: str
    candidate_name: Optional[str]
    job_role: str
    required_skills: List[str]
    overall_score: float
    hire_flag: Optional[str]
    hire_label: str
    total_questions: int
    avg_score: float
    skill_scores: dict
    answers: List[AnswerDetail]
    integrity: dict
    completed_at: Optional[str]


class TTSRequest(BaseModel):
    text: str


class CandidateSummary(BaseModel):
    session_id: str
    candidate_name: Optional[str]
    job_role: str
    status: str
    overall_score: float
    hire_flag: Optional[str]
    hire_label: str
    input_mode: str
    created_at: datetime
    completed_at: Optional[datetime]


class CandidateCompareItem(BaseModel):
    session_id: str
    candidate_name: Optional[str]
    overall_score: float
    hire_flag: Optional[str]
    skill_scores: dict
    integrity_score: float
    total_questions: int
    input_mode: str


class RecruiterStats(BaseModel):
    total_interviews: int
    completed: int
    in_progress: int
    strong_hire_count: int
    maybe_count: int
    no_hire_count: int
    avg_score: float
    top_candidate: Optional[dict]
    recent_sessions: List[dict]
