from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from loguru import logger
import numpy as np

sbert_model = None

def load_sbert_model():
    global sbert_model
    if sbert_model is None:
        try:
            sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence-BERT model loaded")
        except Exception as e:
            logger.error(f"Failed to load SBERT model: {e}")
            sbert_model = None

HEDGING_WORDS = [
    "i think", "maybe", "i'm not sure", "probably", "i believe",
    "perhaps", "sort of", "kind of", "i guess", "not sure",
    "i don't know", "i'm unsure", "might be", "could be"
]

FILLER_WORDS = [
    "um", "uh", "like", "you know", "basically", "literally",
    "actually", "so um", "right so"
]


def score_answer(answer_text: str, question_text: str, job_role: str) -> dict:
    from services.groq_service import generate_ideal_answer, evaluate_answer
    
    semantic_score = 0.5
    load_sbert_model()
    if sbert_model is not None:
        try:
            ideal = generate_ideal_answer(question_text, job_role)
            emb_answer = sbert_model.encode(answer_text)
            emb_ideal = sbert_model.encode(ideal)
            semantic_score = float(cosine_similarity([emb_answer], [emb_ideal])[0][0])
        except Exception as e:
            logger.error(f"Semantic scoring failed: {e}")
            semantic_score = 0.5

    hedging_count = sum(1 for h in HEDGING_WORDS if h in answer_text.lower())
    filler_count = sum(answer_text.lower().count(f) for f in FILLER_WORDS)
    
    confidence_score = max(0.0, 1.0 - (hedging_count * 0.15))
    clarity_score = max(0.0, 1.0 - (filler_count * 0.1))
    
    word_count = len(answer_text.split())
    depth_score = min(1.0, word_count / 80.0)
    
    hesitation_score = min(1.0, (hedging_count + filler_count) / 10.0)
    
    try:
        eval_result = evaluate_answer(question_text, answer_text, job_role)
        claude_score = eval_result["claude_score"] / 10.0
        aria_feedback = eval_result["feedback"]
    except Exception as e:
        logger.error(f"Claude eval failed: {e}")
        claude_score = 0.5
        aria_feedback = "Answer received."

    final_score = (
        semantic_score * 0.30 +
        confidence_score * 0.25 +
        (1 - hesitation_score) * 0.20 +
        claude_score * 0.25
    ) * 10

    skill_scores = {
        "problem_solving": round(semantic_score * 10, 1),
        "system_design": round(depth_score * 10, 1),
        "communication": round(clarity_score * 10, 1),
        "code_quality": round(claude_score * 10, 1),
        "technical_depth": round(confidence_score * 10, 1),
        "adaptability": round(final_score, 1)
    }

    logger.info(f"Scored answer: final={final_score:.2f} semantic={semantic_score:.2f} claude={claude_score:.2f}")

    return {
        "semantic_score": semantic_score,
        "confidence_score": confidence_score,
        "clarity_score": clarity_score,
        "depth_score": depth_score,
        "hesitation_score": hesitation_score,
        "claude_score": claude_score,
        "final_score": final_score,
        "aria_feedback": aria_feedback,
        "skill_scores": skill_scores
    }
