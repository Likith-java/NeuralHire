import cv2
import mediapipe as mp
import numpy as np
import os
import time

# 🔥 REDUCED WORD SET (SAFE)
WORDS = ["yes", "no", "api", "database", "code"]

SAMPLES = 15   # per word
FRAMES = 30    # frames per sample
DATA_DIR = "data"

mp_hands = mp.solutions.hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.7
)

cap = cv2.VideoCapture(0)

for word in WORDS:
    os.makedirs(f"{DATA_DIR}/{word}", exist_ok=True)

    for sample in range(SAMPLES):
        print(f"\nWord: {word.upper()} | Sample {sample+1}/{SAMPLES}")
        print("Get ready... starting in 3 seconds")
        time.sleep(3)

        sequence = []

        for frame_num in range(FRAMES):
            ret, frame = cap.read()
            if not ret:
                break

            results = mp_hands.process(
                cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            )

            landmarks = np.zeros(126)

            if results.multi_hand_landmarks:
                for i, hand in enumerate(results.multi_hand_landmarks[:2]):
                    offset = i * 63
                    for j, lm in enumerate(hand.landmark):
                        landmarks[offset + j*3] = lm.x
                        landmarks[offset + j*3 + 1] = lm.y
                        landmarks[offset + j*3 + 2] = lm.z

            sequence.append(landmarks)

            cv2.putText(frame, f"{word} | {frame_num+1}/{FRAMES}",
                        (10, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0,255,0),
                        2)

            cv2.imshow("Data Collection", frame)
            cv2.waitKey(33)

        np.save(f"{DATA_DIR}/{word}/sample_{sample:03d}.npy",
                np.array(sequence))

        print(f"Saved sample {sample+1}")

cap.release()
cv2.destroyAllWindows()
print("\nDONE: All data collected")
