import cv2
from verifier_engine import VerifierEngine

engine = VerifierEngine()
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    score, events, yaw, face_count, gaze = engine.process_frame(frame)

    # Score display
    cv2.putText(frame, f"Score: {score}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Face count
    cv2.putText(frame, f"Faces: {face_count}", (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    # Events
    cv2.putText(frame, f"Looking Away: {events['looking_away']}", (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    # Yaw
    if yaw is not None:
        cv2.putText(frame, f"Yaw: {int(yaw)}", (20, 150),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    # Gaze
    if gaze:
        cv2.putText(frame, f"Gaze: {round(gaze[0],2)}", (20, 180),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    # Alerts
    if face_count > 1:
        cv2.putText(frame, "ALERT: Multiple Faces!", (20, 220),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    if yaw is not None and abs(yaw) > 30:
        cv2.putText(frame, "ALERT: Looking Away!", (20, 260),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    cv2.imshow("Verifier System", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
