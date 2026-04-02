from fastapi import APIRouter, HTTPException
from loguru import logger

from schemas import GestureRequest
from services.gesture_service import predict_letter
from services.word_service import get_suggestions

router = APIRouter()


@router.post("/gesture")
async def predict_gesture(req: GestureRequest):
    if len(req.landmarks) != 63:
        raise HTTPException(status_code=422, detail="Expected 63 landmarks")
    
    result = predict_letter(req.landmarks)
    logger.info(f"Gesture: {result['letter']} conf={result['confidence']:.2f}")
    
    return {"letter": result["letter"], "confidence": result["confidence"]}


@router.get("/words")
async def get_word_suggestions(prefix: str):
    suggestions = get_suggestions(prefix)
    logger.info(f"Words for '{prefix}': {suggestions}")
    return {"suggestions": suggestions}
