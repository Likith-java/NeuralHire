from elevenlabs import ElevenLabs
from dotenv import load_dotenv
from loguru import logger
import os

load_dotenv()

USE_ELEVENLABS = False
client = None

try:
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    if elevenlabs_key and elevenlabs_key != "your_elevenlabs_key_here":
        client = ElevenLabs(api_key=elevenlabs_key)
        USE_ELEVENLABS = True
        logger.info("Using ElevenLabs Scribe for transcription")
    else:
        logger.warning("ElevenLabs API key not configured")
except ImportError:
    logger.warning("ElevenLabs not installed")
except Exception as e:
    logger.warning(f"ElevenLabs not configured: {e}")


def transcribe_audio(audio_bytes: bytes, filename: str) -> str:
    if not USE_ELEVENLABS or not client:
        logger.warning("ElevenLabs not configured, returning empty string")
        return ""
    
    try:
        result = client.audio.intelligence.scribe(
            audio=audio_bytes,
            tag_audio=False,
            language=None,
        )
        transcription = result.text
        logger.info(f"Transcribed {len(audio_bytes)} bytes using ElevenLabs Scribe")
        return transcription
    except Exception as e:
        logger.error(f"ElevenLabs transcription failed: {e}")
        return ""
