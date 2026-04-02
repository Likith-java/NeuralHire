import cv2
import mediapipe as mp
import numpy as np
import requests
import pyttsx3
import time

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# ---------- FACE (GAZE) ----------
mp_face = mp.solutions.face_mesh
face_mesh = mp_face.FaceMesh(refine_landmarks=True)

# ---------- TTS ----------
engine = pyttsx3.init()
engine.setProperty('rate', 150)

def speak(text):
    engine.say(text)
    engine.runAndWait()

# ---------- APIs ----------
LETTER_API = "http://127.0.0.1:8000/api/gesture/letter"
WORD_API = "http://127.0.0.1:8000/api/gesture/word"

# ---------- HAND MODEL ----------
hand_base = python.BaseOptions(model_asset_path="models/hand_landmarker.task")

hand_options = vision.HandLandmarkerOptions(
    base_options=hand_base,
    num_hands=1,
    min_hand_detection_confidence=0.3,   # 🔥 better detection
    min_tracking_confidence=0.3
)

hand_detector = vision.HandLandmarker.create_from_options(hand_options)

# ---------- CAMERA ----------
cap = cv2.VideoCapture(0)

# ---------- LETTER VARIABLES ----------
prev_letter = ""
count_letter = 0
stable_letter = ""
word = ""
last_added = ""

last_time = 0
cooldown = 1.5

# ---------- LSTM VARIABLES ----------
sequence = []
FRAMES = 30
word_pred = ""

while True:
    ret, frame = cap.read()
    if not ret:
        print("Camera not working")
        break

    # 🔥 Flip for natural interaction
    frame = cv2.flip(frame, 1)

    # DEBUG CAMERA
    cv2.imshow("RAW FEED", frame)

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    # ================= HAND =================
    hand_result = hand_detector.detect(mp_image)

    # DEBUG HAND DETECTION
    # print("Hand:", hand_result.hand_landmarks)

    if hand_result.hand_landmarks:
        for hand_landmarks in hand_result.hand_landmarks:

            landmarks = []
            for lm in hand_landmarks:
                landmarks.extend([lm.x, lm.y, lm.z])

            # DEBUG LENGTH
            # print("Len:", len(landmarks))

            if len(landmarks) == 63:
                try:
                    # -------- LETTER API --------
                    res = requests.post(LETTER_API, json={"landmarks": landmarks})
                    data = res.json()

                    # DEBUG API
                    # print(data)

                    letter = data.get("letter", "?")

                    # -------- STABILITY --------
                    if letter == prev_letter:
                        count_letter += 1
                    else:
                        count_letter = 0

                    prev_letter = letter
                    current_time = time.time()

                    if count_letter > 5:
                        stable_letter = letter

                        if stable_letter != last_added and current_time - last_time > cooldown:
                            word += stable_letter
                            last_added = stable_letter
                            speak(stable_letter)
                            last_time = current_time

                    # -------- LSTM SEQUENCE --------
                    full_landmarks = landmarks + landmarks  # 63 → 126
                    sequence.append(full_landmarks)

                    if len(sequence) > FRAMES:
                        sequence.pop(0)

                    # -------- WORD PREDICTION --------
                    if len(sequence) == FRAMES:
                        try:
                            res = requests.post(
                                WORD_API,
                                json={"sequence": sequence}
                            )
                            data = res.json()
                            word_pred = data.get("word", "")
                        except:
                            word_pred = "ERR"

                except:
                    pass

    # ================= GAZE =================
    gaze_text = "UNKNOWN"
    gaze_score = 2

    face_results = face_mesh.process(rgb)

    if face_results.multi_face_landmarks:
        face_landmarks = face_results.multi_face_landmarks[0]

        left_eye = face_landmarks.landmark[33]
        right_eye = face_landmarks.landmark[263]
        nose = face_landmarks.landmark[1]

        eye_center_x = (left_eye.x + right_eye.x) / 2

        if nose.x < eye_center_x - 0.02:
            gaze_text = "LEFT"
        elif nose.x > eye_center_x + 0.02:
            gaze_text = "RIGHT"
        else:
            gaze_text = "CENTER"
            gaze_score = 5

    # ---------- ENGAGEMENT ----------
    stability_score = 5 if count_letter > 5 else 2
    engagement_score = gaze_score + stability_score

    # ---------- LIMIT WORD ----------
    if len(word) > 25:
        word = word[-25:]

    # ================= DISPLAY =================
    cv2.putText(frame, f"Letter: {stable_letter}", (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,0), 2)

    cv2.putText(frame, f"Typed: {word}", (10, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255,0,0), 3)

    cv2.putText(frame, f"Detected Word: {word_pred}", (10, 120),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,255,255), 2)

    cv2.putText(frame, f"Looking: {gaze_text}", (10, 160),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,255), 2)

    cv2.putText(frame, f"Engagement: {engagement_score}/10", (10, 200),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255,255,0), 2)

    cv2.putText(frame, "C=Clear | S=Speak | SPACE=Gap | ESC=Exit", (10, 240),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200,200,200), 2)

    cv2.imshow("AI Communication & Attention Analyzer", frame)

    key = cv2.waitKey(1) & 0xFF

    # ---------- CONTROLS ----------
    if key == ord('c'):
        word = ""
        last_added = ""

    if key == ord('s'):
        if word:
            speak(word)

    if key == ord(' '):
        if word != "" and not word.endswith(" "):
            word += " "
            last_added = ""

    if key == 27:
        break

cap.release()
cv2.destroyAllWindows()
