import joblib
import numpy as np
from loguru import logger
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models", "gesture_classifier")

try:
    clf = joblib.load(os.path.join(MODEL_PATH, "gesture_clf.pkl"))
    le = joblib.load(os.path.join(MODEL_PATH, "label_encoder.pkl"))
    logger.info("Gesture classifier loaded successfully")
    MOCK_MODE = False
except FileNotFoundError:
    logger.warning("gesture_clf.pkl not found — running in MOCK MODE")
    MOCK_MODE = True


def normalize_landmarks(landmarks):
    row = np.array(landmarks)
    # 21 landmarks * 3 (x,y,z) = 63
    wrist_x, wrist_y, wrist_z = row[0], row[1], row[2]
    # Center relative to wrist
    for i in range(0, len(row), 3):
        row[i]   -= wrist_x
        row[i+1] -= wrist_y
        row[i+2] -= wrist_z
    # Scale
    max_val = np.max(np.abs(row))
    if max_val > 0:
        row = row / max_val
    return row

def predict_letter(landmarks: list) -> dict:
    if MOCK_MODE:
        return {"letter": "A", "confidence": 0.99}
    
    try:
        # Preprocess landmarks (must match training!)
        normalized = normalize_landmarks(landmarks)
        arr = normalized.reshape(1, 63)
        
        label_enc = clf.predict(arr)[0]
        letter = le.inverse_transform([label_enc])[0]
        proba = clf.predict_proba(arr)[0].max()
        
        logger.info(f"Gesture: {letter} ({proba:.2f})")
        return {"letter": str(letter), "confidence": float(proba)}
    except Exception as e:
        logger.error(f"Gesture prediction failed: {e}")
        return {"letter": "?", "confidence": 0.0}
