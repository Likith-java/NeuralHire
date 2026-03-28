# collect_data.py
import cv2, mediapipe as mp, numpy as np, os, time

WORDS = ["yes","no","explain","describe","REST","API",
         "database","system","design","problem",
         "solution","code","server","network",
         "security","1","2","3","4","5"]
SAMPLES  = 30   # recordings per word
FRAMES   = 30   # frames per recording
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

        # Countdown
        for countdown in range(3, 0, -1):
            ret, frame = cap.read()
            cv2.putText(frame, f"GET READY: {word.upper()} in {countdown}s",
                        (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
            cv2.imshow("NeuralHire — Data Collection", frame)
            cv2.waitKey(1000)

        # Capture 30 frames
        sequence = []
        for frame_num in range(FRAMES):
            ret, frame = cap.read()
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = mp_hands.process(rgb)

            landmarks = np.zeros(126)  # default zeros (handles missing hand)

            if results.multi_hand_landmarks:
                for i, hand in enumerate(results.multi_hand_landmarks[:2]):
                    offset = i * 63
                    for j, lm in enumerate(hand.landmark):
                        landmarks[offset + j*3]     = lm.x
                        landmarks[offset + j*3 + 1] = lm.y
                        landmarks[offset + j*3 + 2] = lm.z

            sequence.append(landmarks)

            cv2.putText(frame, f"Recording: {word.upper()} [{frame_num+1}/{FRAMES}]",
                        (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            cv2.imshow("NeuralHire — Data Collection", frame)
            cv2.waitKey(33)  # ~30 fps

        np.save(f"{DATA_DIR}/{word}/sample_{sample:03d}.npy", np.array(sequence))
        print(f"  ✓ Saved sample {sample+1}")

cap.release()
cv2.destroyAllWindows()
print("\n✅ Done! All 600 samples recorded.")
