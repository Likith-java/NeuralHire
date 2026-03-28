import os
import csv
import mediapipe as mp
import cv2

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.3)

DATA_DIR = r"data\raw_images"
OUTPUT_CSV = r"data\landmarks.csv"

with open(OUTPUT_CSV, "w", newline="") as csvfile:
    writer = csv.writer(csvfile)

    header = []
    for i in range(21):
        header += [f"x{i}", f"y{i}", f"z{i}"]
    header.append("label")
    writer.writerow(header)

    for label in sorted(os.listdir(DATA_DIR)):
        label_path = os.path.join(DATA_DIR, label)
        if not os.path.isdir(label_path):
            continue

        print(f"Processing: {label}")
        count = 0

        for img_file in os.listdir(label_path):
            img_path = os.path.join(label_path, img_file)
            img = cv2.imread(img_path)
            if img is None:
                continue

            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            result = hands.process(img_rgb)

            if result.multi_hand_landmarks:
                lm = result.multi_hand_landmarks[0].landmark
                row = []
                for point in lm:
                    row += [point.x, point.y, point.z]
                row.append(label)
                writer.writerow(row)
                count += 1

        print(f"  {label} done — {count} landmarks saved")

hands.close()
print("DONE. landmarks.csv created.")