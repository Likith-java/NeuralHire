# # cd ml_models\gesture_classifier
# # python test_model.py

# import cv2
# import mediapipe as mp
# import numpy as np
# import joblib

# clf = joblib.load("gesture_clf.pkl")
# le  = joblib.load("label_encoder.pkl")

# mp_hands   = mp.solutions.hands
# mp_drawing = mp.solutions.drawing_utils
# hands = mp_hands.Hands(
#     static_image_mode=False,
#     max_num_hands=1,
#     min_detection_confidence=0.7
# )

# cap = cv2.VideoCapture(0)
# print("Camera started. Show your hand. Press Q to quit.")

# while True:
#     ret, frame = cap.read()
#     if not ret:
#         break

#     frame = cv2.flip(frame, 1)
#     rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#     result = hands.process(rgb)

#     letter     = ""
#     confidence = 0.0

#     if result.multi_hand_landmarks:
#         lm = result.multi_hand_landmarks[0].landmark

#         mp_drawing.draw_landmarks(
#             frame,
#             result.multi_hand_landmarks[0],
#             mp_hands.HAND_CONNECTIONS
#         )

#         row = []
#         for point in lm:
#             row += [point.x, point.y, point.z]

#         features = np.array(row).reshape(1, -1)
#         pred     = clf.predict(features)[0]
#         proba    = clf.predict_proba(features)[0]

#         letter     = le.inverse_transform([pred])[0]
#         confidence = round(max(proba) * 100, 1)

#         # if confidence < 40:
#         #     letter = "?"

#     h, w = frame.shape[:2]

#     cv2.rectangle(frame, (0, 0), (w, 80), (0, 0, 0), -1)

#     cv2.putText(frame, f"Letter     : {letter}",
#                 (20, 30), cv2.FONT_HERSHEY_SIMPLEX,
#                 0.8, (0, 255, 0), 2)

#     cv2.putText(frame, f"Confidence : {confidence}%",
#                 (20, 60), cv2.FONT_HERSHEY_SIMPLEX,
#                 0.8, (0, 255, 0), 2)

#     cv2.imshow("NeuralHire — Gesture Test", frame)

#     if cv2.waitKey(1) & 0xFF == ord('q'):
#         break

# cap.release()
# cv2.destroyAllWindows()
# print("Camera closed.")

# # cd ml_models\gesture_classifier
# # python test_model.py


import cv2
import mediapipe as mp
import numpy as np
import joblib
from collections import deque, Counter

clf = joblib.load("gesture_clf.pkl")
le  = joblib.load("label_encoder.pkl")

mp_hands   = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7
)

def normalize_landmarks(landmarks):
    row = []
    for point in landmarks:
        row += [point.x, point.y, point.z]
    row = np.array(row)
    wrist_x, wrist_y, wrist_z = row[0], row[1], row[2]
    for i in range(0, len(row), 3):
        row[i]   -= wrist_x
        row[i+1] -= wrist_y
        row[i+2] -= wrist_z
    max_val = np.max(np.abs(row))
    if max_val > 0:
        row = row / max_val
    return row

BUFFER_SIZE    = 15
MIN_CONFIDENCE = 30
MIN_CONSISTENT = 10

buffer         = deque(maxlen=BUFFER_SIZE)
stable_letter  = ""
word           = ""

cap = cv2.VideoCapture(0)
print("Camera started. Show your hand steadily.")
print("Hold a sign for 1 second to register the letter.")
print("Press SPACE to add space. Press C to clear word. Press Q to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame  = cv2.flip(frame, 1)
    rgb    = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    raw_letter = ""
    confidence = 0.0

    if result.multi_hand_landmarks:
        lm = result.multi_hand_landmarks[0].landmark

        mp_drawing.draw_landmarks(
            frame,
            result.multi_hand_landmarks[0],
            mp_hands.HAND_CONNECTIONS
        )

        features   = normalize_landmarks(lm).reshape(1, -1)
        pred       = clf.predict(features)[0]
        proba      = clf.predict_proba(features)[0]
        confidence = round(max(proba) * 100, 1)

        if confidence >= MIN_CONFIDENCE:
            raw_letter = le.inverse_transform([pred])[0]
            buffer.append(raw_letter)
        else:
            buffer.append("")
    else:
        buffer.append("")

    stable_letter = ""
    if len(buffer) == BUFFER_SIZE:
        counts = Counter(buffer)
        most_common_letter, most_common_count = counts.most_common(1)[0]
        if most_common_count >= MIN_CONSISTENT and most_common_letter != "":
            stable_letter = most_common_letter

    h, w = frame.shape[:2]

    cv2.rectangle(frame, (0, 0), (w, 100), (0, 0, 0), -1)

    cv2.putText(frame, f"Detecting  : {raw_letter if raw_letter else '?'}  ({confidence}%)",
                (20, 30), cv2.FONT_HERSHEY_SIMPLEX,
                0.7, (100, 255, 100), 2)

    cv2.putText(frame, f"Stable     : {stable_letter if stable_letter else '...'}",
                (20, 60), cv2.FONT_HERSHEY_SIMPLEX,
                0.7, (0, 255, 255), 2)

    cv2.putText(frame, f"Word       : {word}",
                (20, 90), cv2.FONT_HERSHEY_SIMPLEX,
                0.7, (255, 255, 255), 2)

    cv2.imshow("NeuralHire — Gesture Test", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == ord('q'):
        break
    elif key == ord(' '):
        word += " "
        print(f"Word so far: {word}")
    elif key == ord('c'):
        word = ""
        print("Word cleared.")
    elif stable_letter and stable_letter not in ['del', 'space', 'nothing']:
        if not word or word[-1] != stable_letter:
            word += stable_letter
            print(f"Letter added: {stable_letter} → Word: {word}")
    elif stable_letter == 'del' and word:
        word = word[:-1]
        print(f"Deleted last letter → Word: {word}")
    elif stable_letter == 'space':
        word += " "
        print(f"Space added → Word: {word}")

cap.release()
cv2.destroyAllWindows()
print(f"Final word: {word}")