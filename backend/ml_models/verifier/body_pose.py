import cv2
import mediapipe as mp
import math


class BodyPoseEstimator:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose()

    def get_posture(self, frame):
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        if not results.pose_landmarks:
            return None

        lm = results.pose_landmarks.landmark

        # Points
        nose = lm[0]
        left_shoulder = lm[11]
        right_shoulder = lm[12]

        # Convert to coordinates
        nose_pt = (nose.x * w, nose.y * h)
        shoulder_center = (
            (left_shoulder.x + right_shoulder.x) / 2 * w,
            (left_shoulder.y + right_shoulder.y) / 2 * h
        )

        # Simple tilt measure
        angle = abs(nose_pt[0] - shoulder_center[0])

        return angle
