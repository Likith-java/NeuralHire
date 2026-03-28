import cv2
import mediapipe as mp
import math

from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# ---------- ANGLE FUNCTION ----------
def calculate_angle(a, b, c):
    angle = math.degrees(
        math.atan2(c[1] - b[1], c[0] - b[0]) -
        math.atan2(a[1] - b[1], a[0] - b[0])
    )
    return abs(angle)

# ---------- LOAD MODEL ----------
base_options = python.BaseOptions(model_asset_path="pose_landmarker_full.task")

options = vision.PoseLandmarkerOptions(
    base_options=base_options,
    output_segmentation_masks=False
)

detector = vision.PoseLandmarker.create_from_options(options)

# ---------- CAMERA ----------
cap = cv2.VideoCapture(0)

# ---------- STABILITY ----------
prev_posture = ""
count = 0
stable_posture = ""

# ---------- SCORES ----------
confidence_score = 0
stability_score = 0
posture_score = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break

    h, w, _ = frame.shape

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    result = detector.detect(mp_image)

    if result.pose_landmarks:
        landmarks = result.pose_landmarks[0]

        # Key points
        nose = landmarks[0]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]

        # Convert to coordinates
        nose_pt = (int(nose.x * w), int(nose.y * h))
        left_pt = (int(left_shoulder.x * w), int(left_shoulder.y * h))
        right_pt = (int(right_shoulder.x * w), int(right_shoulder.y * h))

        shoulder_center = (
            (left_pt[0] + right_pt[0]) // 2,
            (left_pt[1] + right_pt[1]) // 2
        )

        # Vertical reference point
        vertical_ref = (shoulder_center[0], shoulder_center[1] - 100)

        # ---------- CALCULATE ANGLE ----------
        angle = calculate_angle(nose_pt, shoulder_center, vertical_ref)

        # ---------- POSTURE ----------
        if angle < 20:
            posture = "GOOD"
            color = (0, 255, 0)
            posture_score = 5
        else:
            posture = "BAD"
            color = (0, 0, 255)
            posture_score = 2

        # ---------- STABILITY ----------
        if posture == prev_posture:
            count += 1
        else:
            count = 0

        prev_posture = posture

        if count > 5:
            stable_posture = posture
            stability_score = 5
        else:
            stability_score = 2

        # ---------- CONFIDENCE ----------
        confidence_score = posture_score + stability_score

        # ---------- DRAW ----------
        cv2.circle(frame, nose_pt, 5, (0, 255, 0), -1)
        cv2.circle(frame, shoulder_center, 5, (255, 0, 0), -1)

        # ---------- DISPLAY ----------
        cv2.putText(frame, f"Posture: {stable_posture}",
                    (10, 50),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    color,
                    2)

        cv2.putText(frame, f"Angle: {int(angle)}",
                    (10, 90),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255, 255, 255),
                    2)

        cv2.putText(frame, f"Confidence: {confidence_score}/10",
                    (10, 130),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (255, 255, 0),
                    2)

    cv2.imshow("AI Body Language Analyzer", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
