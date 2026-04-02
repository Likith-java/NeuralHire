import cv2
from face_detection import FaceDetector

detector = FaceDetector()
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    face_count, detections = detector.detect_faces(frame)

    cv2.putText(frame, f"Faces: {face_count}", (20, 50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    if face_count > 1:
        cv2.putText(frame, "ALERT: Multiple Faces!", (20, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    cv2.imshow("Face Detection Test", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
