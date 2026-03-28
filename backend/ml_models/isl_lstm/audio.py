import sounddevice as sd
import numpy as np

def get_audio_level():
    duration = 0.1
    fs = 44100

    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()

    volume = np.linalg.norm(recording)
    return volume
