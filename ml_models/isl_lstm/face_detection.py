import cv2
import mediapipe as mp

class FaceDetector:
    def __init__(self):
        self.mp_face_detection = mp.solutions.face_detection
        self.detector = self.mp_face_detection.FaceDetection(
            min_detection_confidence=0.5
        )

    def detect_faces(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.detector.process(rgb)

        face_count = 0
        detections = []

        if results.detections:
            face_count = len(results.detections)
            detections = results.detections

        return face_count, detections
