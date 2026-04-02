import numpy as np
import joblib
from fastapi import FastAPI
from pydantic import BaseModel

# 🔥 ADD THIS
from word_endpoint import router  

app = FastAPI()

# 🔥 FIX PATH (important if running from backend folder)
model = joblib.load("../models/gesture_clf.pkl")


# 🔥 ADD THIS (activate word API)
app.include_router(router)


class GestureRequest(BaseModel):
    landmarks: list  # (126 values)


@app.post("/api/gesture/letter")
def predict_letter(data: GestureRequest):
    X = np.array(data.landmarks)

    # Handle 126 → 63
    if len(X) == 126:
        X = X[:63]

    X = X.reshape(1, -1)

    pred = model.predict(X)[0]

    LABELS = list("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    letter = LABELS[int(pred)]

    return {"letter": letter}
