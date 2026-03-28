import numpy as np
import joblib
from fastapi import APIRouter
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

router = APIRouter()

# 🔥 Rebuild model
model = Sequential()
model.add(LSTM(64, return_sequences=True, input_shape=(30, 126)))
model.add(LSTM(64))
model.add(Dense(32, activation='relu'))
model.add(Dense(2, activation='softmax'))

model.load_weights("../models/isl_lstm.h5")
label_encoder = joblib.load("../models/isl_label_encoder.pkl")


@router.post("/api/gesture/word")
def predict_word(data: dict):
    seq = np.array(data["sequence"])
    seq = np.expand_dims(seq, axis=0)

    pred = model.predict(seq)[0]
    idx = np.argmax(pred)

    word = label_encoder.inverse_transform([idx])[0]
    confidence = float(pred[idx])

    return {
        "word": word,
        "confidence": confidence
    }
