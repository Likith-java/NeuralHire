import cv2
from verifier_engine import VerifierEngine

engine = VerifierEngine()
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    score, events, yaw, face_count, gaze, posture = engine.process_frame(frame)

    # -------------------------
    # STATUS + COLOR
    # -------------------------
    if score >= 90:
        status = "VERIFIED"
        color = (0, 255, 0)
    elif score >= 70:
        status = "CAUTION"
        color = (0, 165, 255)
    else:
        status = "FLAGGED"
        color = (0, 0, 255)

    # -------------------------
    # SCORE
    # -------------------------
    cv2.putText(frame, f"Score: {score}", (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)

    # -------------------------
    # BASIC INFO
    # -------------------------
    cv2.putText(frame, f"Faces: {face_count}", (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    cv2.putText(frame, f"Looking Away Events: {events['looking_away']}", (20, 110),
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)

    # -------------------------
    # HEAD POSE
    # -------------------------
    if yaw is not None:
        cv2.putText(frame, f"Yaw: {int(yaw)}", (20, 140),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    # -------------------------
    # GAZE
    # -------------------------
    if gaze:
        cv2.putText(frame, f"Gaze: {round(gaze[0],2)}", (20, 170),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    # -------------------------
    # POSTURE
    # -------------------------
    if posture is not None:
        cv2.putText(frame, f"Posture: {int(posture)}", (20, 200),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    # -------------------------
    # ALERTS (REAL-TIME ONLY)
    # -------------------------
    if face_count > 1:
        cv2.putText(frame, "ALERT: Multiple Faces!", (20, 240),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    if yaw is not None and abs(yaw) > 30:
        cv2.putText(frame, "ALERT: Looking Away!", (20, 280),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    # -------------------------
    # FINAL STATUS (BIG TEXT 🔥)
    # -------------------------
    cv2.putText(frame, f"STATUS: {status}", (20, 330),
                cv2.FONT_HERSHEY_SIMPLEX, 1.3, color, 3)

    cv2.imshow("NeuralHire Verifier", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
