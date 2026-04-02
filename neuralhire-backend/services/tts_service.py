import elevenlabs
from dotenv import load_dotenv
from loguru import logger
import os

load_dotenv()

elevenlabs.api_key = os.getenv("ELEVENLABS_API_KEY")


def text_to_speech(text: str) -> bytes:
    try:
        voice_id = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
        audio = elevenlabs.generate(text=text, voice=voice_id)
        logger.info(f"TTS generated {len(text)} chars")
        return audio
    except Exception as e:
        logger.warning(f"ElevenLabs TTS failed: {e}")
        return b""
