import streamlit as st
import joblib
from extract_features import extract_features

# ---------- PAGE ----------
st.set_page_config(page_title="Voice Confidence Analyzer", layout="centered")

st.title("🎤 Voice Confidence Analyzer")
st.write("Record or upload your answer to analyze confidence.")

# ---------- LOAD MODEL ----------
model = joblib.load("hesitation_model.pkl")
scaler = joblib.load("hesitation_scaler.pkl")

# ---------- INPUT MODE ----------
option = st.radio("Choose input method:", ["🎙 Record Audio", "📂 Upload Audio"])

audio_file = None

# ---------- RECORD ----------
if option == "🎙 Record Audio":
    audio_file = st.audio_input("Record your answer")

# ---------- UPLOAD ----------
else:
    audio_file = st.file_uploader("Upload .wav audio", type=["wav"])

# ---------- PROCESS ----------
if audio_file:
    with open("temp.wav", "wb") as f:
        f.write(audio_file.read())

    # Extract features
    features = extract_features("temp.wav").reshape(1, -1)
    features_scaled = scaler.transform(features)

    # Predict
    prediction = model.predict(features_scaled)[0]
    probability = model.predict_proba(features_scaled)[0][1]

    confidence = (1 - probability) * 100

    st.divider()

    # ---------- RESULT ----------
    if prediction == 1:
        st.error("😬 Hesitant")
    else:
        st.success("😎 Confident")

    st.metric("Confidence Level", f"{confidence:.1f}%")

    st.write("Hesitation Score:", round(probability, 3))
    st.progress(int(probability * 100))

    # ---------- INSIGHT ----------
    if probability > 0.7:
        st.warning("High hesitation detected")
    elif probability > 0.4:
        st.info("Moderate hesitation detected")
    else:
        st.success("Strong confidence detected")

# ---------- FOOTER ----------
st.markdown("---")
st.caption("AI Vocal Hesitation Detection")
