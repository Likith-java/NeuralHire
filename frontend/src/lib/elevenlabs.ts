import { ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID } from './secrets';

export const speakText = async (text: string) => {
    if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.includes("YOUR_ELEVENLABS_KEY")) {
        console.warn("ElevenLabs: No API key found. Falling back to browser TTS.");
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
        return;
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            })
        });

        if (!response.ok) throw new Error('ElevenLabs API request failed');

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
    } catch (err) {
        console.error('ElevenLabs Error:', err);
        // Fallback to Web Speech API
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
};
