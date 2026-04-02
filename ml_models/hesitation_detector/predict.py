import librosa
import numpy as np
import joblib
from extract_features import extract_features

# Load model + scaler
model = joblib.load("hesitation_model.pkl")
scaler = joblib.load("hesitation_scaler.pkl")

def predict(file_path):
    features = extract_features(file_path).reshape(1, -1)
    features_scaled = scaler.transform(features)

    prediction = model.predict(features_scaled)[0]
    probability = model.predict_proba(features_scaled)[0][1]

    label = "Hesitant" if prediction == 1 else "Confident"

    print("\nResult:")
    print("Label:", label)
    print("Hesitation Score:", round(probability, 3))


# 👇 PUT FILE PATH HERE (outside function)
predict("data/confident/03-01-01-01-01-01-04.wav")
