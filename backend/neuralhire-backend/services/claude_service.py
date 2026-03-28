import anthropic
from dotenv import load_dotenv
from loguru import logger
import os
import json

load_dotenv()

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def generate_question(job_role: str, skills: list, difficulty: str, question_num: int) -> str:
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            system="You are ARIA, an adaptive AI interviewer for NeuralHire. Generate interview question #{question_num} for a {difficulty} level interview. Job role: {job_role}. Required skills: {skills}. Return ONLY the question text. No numbering. No preamble. No explanation. Make it specific, technical, and appropriate for the difficulty level.".format(
                question_num=question_num, difficulty=difficulty, job_role=job_role, skills=", ".join(skills)
            ),
            messages=[{"role": "user", "content": "Generate the next interview question."}]
        )
        result = message.content[0].text
        logger.info(f"Question {question_num} generated for {job_role}")
        return result
    except Exception as e:
        logger.error(f"Claude question generation failed: {e}")
        return f"Can you explain your experience with {skills[0] if skills else 'the required technologies'}?"


def generate_followup(question: str, answer: str, score: float) -> str:
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=150,
            system=f"You are ARIA. The candidate scored {score:.1f}/10 on this answer. Original question: {question} Their answer: {answer} Generate ONE targeted follow-up question that probes their weak point. Return ONLY the follow-up question. No preamble. No explanation.",
            messages=[{"role": "user", "content": "Generate follow-up question."}]
        )
        result = message.content[0].text
        logger.info(f"Follow-up generated with score {score:.1f}")
        return result
    except Exception as e:
        logger.error(f"Claude followup generation failed: {e}")
        return "Can you elaborate on that point with more specific details?"


def evaluate_answer(question: str, answer: str, job_role: str) -> dict:
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=f"You are ARIA evaluating a technical interview answer. Question: {question} Candidate's answer: {answer} Job role: {job_role} Return ONLY valid JSON (no markdown, no backticks) with these exact keys: {{'claude_score': <float 0-10>, 'feedback': '<one sentence max>', 'depth_mode': '<surface or deep_dive or stress_test>'}}",
            messages=[{"role": "user", "content": "Evaluate this answer."}]
        )
        result_text = message.content[0].text.strip()
        result = json.loads(result_text)
        logger.info(f"Answer evaluated: score={result.get('claude_score', 5.0)}")
        return result
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed: {e}, response: {message.content[0].text}")
        return {"claude_score": 5.0, "feedback": "Answer received.", "depth_mode": "surface"}
    except Exception as e:
        logger.error(f"Claude evaluation failed: {e}")
        return {"claude_score": 5.0, "feedback": "Answer received.", "depth_mode": "surface"}


def generate_ideal_answer(question: str, job_role: str) -> str:
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=150,
            system=f"Generate a concise ideal answer (60-80 words) for this interview question for a {job_role} candidate: {question} Return only the answer text. No preamble.",
            messages=[{"role": "user", "content": "Generate ideal answer."}]
        )
        result = message.content[0].text
        logger.info(f"Ideal answer generated for: {question[:50]}...")
        return result
    except Exception as e:
        logger.error(f"Ideal answer generation failed: {e}")
        return "A comprehensive answer would demonstrate deep understanding of the subject with practical examples."
