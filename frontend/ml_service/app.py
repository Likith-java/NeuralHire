from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI(title="NeuralHire ML Service", version="0.1.0")


def tokenize(text: str) -> list[str]:
    return [token for token in "".join(ch.lower() if ch.isalnum() else " " for ch in text).split() if token]


def overlap_ratio(left: str, right: str) -> float:
    left_tokens = set(tokenize(left))
    right_tokens = tokenize(right)
    if not left_tokens or not right_tokens:
        return 0.0
    matches = [token for token in right_tokens if token in left_tokens]
    return round(len(matches) / max(len(left_tokens), len(right_tokens)), 3)


class ResumeRequest(BaseModel):
    resumeText: str
    jobDescription: str
    requiredSkills: list[str]


class SemanticRequest(BaseModel):
    idealAnswer: str
    candidateAnswer: str


class SpeechRequest(BaseModel):
    transcript: str
    audioArtifactPath: str | None = None


class GestureRequest(BaseModel):
    landmarks: list[list[float]]


class IntegrityEvent(BaseModel):
    type: str


class IntegrityRequest(BaseModel):
    eventType: str | None = None
    events: list[IntegrityEvent]


@app.post("/resume/parse")
def resume_parse(payload: ResumeRequest) -> dict[str, Any]:
    matched_skills = [
        skill for skill in payload.requiredSkills if skill.lower() in payload.resumeText.lower()
    ]
    ats_score = int(overlap_ratio(payload.jobDescription, payload.resumeText) * 100)
    return {
        "name": None,
        "skills": matched_skills,
        "ats_score": ats_score,
        "matched_keywords": matched_skills,
        "model_version": "resume-service-v1",
    }


@app.post("/semantic/score")
def semantic_score(payload: SemanticRequest) -> dict[str, Any]:
    score = overlap_ratio(payload.idealAnswer, payload.candidateAnswer)
    if score >= 0.8:
        label = "strong match"
    elif score >= 0.6:
        label = "good match"
    elif score >= 0.4:
        label = "partial match"
    else:
        label = "poor match"
    return {
        "semantic_score": score,
        "label": label,
        "model_version": "semantic-service-v1",
    }


@app.post("/speech/analyze")
def speech_analyze(payload: SpeechRequest) -> dict[str, Any]:
    fillers = {"um", "uh", "like", "actually", "basically"}
    tokens = tokenize(payload.transcript)
    filler_count = sum(1 for token in tokens if token in fillers)
    hesitation = min(100, int((filler_count / max(len(tokens), 1)) * 400))
    confidence = max(0, 100 - hesitation - (15 if len(tokens) < 15 else 0))
    return {
        "transcript": payload.transcript,
        "hesitation_score": hesitation,
        "confidence_score": confidence,
        "model_version": "speech-service-v1",
    }


@app.post("/sign/gesture")
def sign_gesture(payload: GestureRequest) -> dict[str, Any]:
    flattened = [coord for point in payload.landmarks for coord in point]
    confidence = 0.65 if flattened else 0.0
    return {
        "letter": "A" if flattened else "",
        "confidence": confidence,
        "model_version": "sign-service-v1",
    }


@app.post("/integrity/evaluate")
def integrity_evaluate(payload: IntegrityRequest) -> dict[str, Any]:
    penalties = 0
    for event in payload.events:
        if event.type == "multiple_faces":
            penalties += 12
        elif event.type == "audio_mismatch":
            penalties += 8
        elif event.type == "looking_away":
            penalties += 5
        else:
            penalties += 3
    return {
        "integrity_score": max(0, 100 - penalties),
        "events": [event.model_dump() for event in payload.events],
        "model_version": "integrity-service-v1",
    }
