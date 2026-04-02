from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from loguru import logger
import io

from schemas import TTSRequest
from services.whisper_service import transcribe_audio
from services.tts_service import text_to_speech
from services.resume_service import parse_resume

router = APIRouter()


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
    transcript = transcribe_audio(audio_bytes, audio.filename)
    return {"transcript": transcript}


@router.post("/tts")
async def synthesize_speech(req: TTSRequest):
    audio_bytes = text_to_speech(req.text)
    if not audio_bytes:
        raise HTTPException(status_code=503, detail="TTS unavailable — use browser speechSynthesis fallback")
    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")


@router.post("/resume/parse")
async def parse_resume_upload(resume: UploadFile = File(...)):
    if not resume.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=422, detail="Only PDF files are supported")
    
    pdf_bytes = await resume.read()
    result = parse_resume(pdf_bytes)
    logger.info(f"Resume uploaded: {resume.filename}")
    return result
