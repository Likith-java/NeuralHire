import cv2
import numpy as np
import requests
import mediapipe as mp

from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import pyttsx3

# 🔊 TTS SETUP
engine = pyttsx3.init()
engine.setProperty('rate', 150)

def speak(text):
    engine.say(text)
    engine.runAndWait()

API_URL = "http://127.0.0.1:8000/api/gesture/letter"

# Load model
base_options = python.BaseOptions(model_asset_path="hand_landmarker.task")
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=1
)

detector = vision.HandLandmarker.create_from_options(options)

cap = cv2.VideoCapture(0)

# 🔥 Stability variables
prev_letter = ""
count = 0
stable_letter = ""

# 🔥 Word building
word = ""
last_added = ""

while True:
    ret, frame = cap.read()
    if not ret:
        break

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    result = detector.detect(mp_image)

    if result.hand_landmarks:
        for hand_landmarks in result.hand_landmarks:

            landmarks = []
            for lm in hand_landmarks:
                landmarks.extend([lm.x, lm.y, lm.z])

            if len(landmarks) == 63:
                try:
                    res = requests.post(API_URL, json={"landmarks": landmarks})
                    data = res.json()

                    letter = data.get("letter", "?")

                    # 🔥 Stability logic
                    if letter == prev_letter:
                        count += 1
                    else:
                        count = 0

                    prev_letter = letter

                    # 🔥 Accept only stable predictions
                    if count > 5:
                        stable_letter = letter

                        # 🔥 Add to word only once
                        if stable_letter != last_added:
                            word += stable_letter
                            last_added = stable_letter

                            # 🔊 SPEAK LETTER
                            speak(stable_letter)

                except:
                    pass

    # 🔥 Display letter
    cv2.putText(frame, f"Letter: {stable_letter}",
                (10, 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2)

    # 🔥 Display word
    cv2.putText(frame, f"Word: {word}",
                (10, 100),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (255, 0, 0),
                2)

    # 🔥 Instructions
    cv2.putText(frame, "C = Clear | S = Speak Word | ESC = Exit",
                (10, 150),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (200, 200, 200),
                2)

    cv2.imshow("Gesture Detection", frame)

    key = cv2.waitKey(1) & 0xFF
    # 🔲 Add space
    if key == ord(' '):   # press SPACE key
       if word != "" and not word.endswith(" "):
           word += " "
           last_added = ""

    # 🔥 Controls
    if key == ord('c'):
        word = ""
        last_added = ""

    # 🔊 Speak full word
    if key == ord('s'):
        if word != "":
            speak(word)

    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()
