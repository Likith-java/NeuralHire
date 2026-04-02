import numpy as np
import joblib
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense

# 🔥 REBUILD MODEL (same as training)
model = Sequential()
model.add(LSTM(64, return_sequences=True, input_shape=(30, 126)))
model.add(LSTM(64))
model.add(Dense(32, activation='relu'))
model.add(Dense(2, activation='softmax'))

# 🔥 LOAD WEIGHTS ONLY
model.load_weights("models/isl_lstm.h5")

# Load label encoder
label_encoder = joblib.load("models/isl_label_encoder.pkl")

# Load test sample
data = np.load("data/yes/sample_000.npy")
data = np.expand_dims(data, axis=0)

# Predict
pred = model.predict(data)[0]
idx = np.argmax(pred)

word = label_encoder.inverse_transform([idx])[0]
confidence = pred[idx]

print("Prediction:", word)
print("Confidence:", confidence)
