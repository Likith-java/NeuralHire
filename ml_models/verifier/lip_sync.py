import mediapipe as mp
import cv2
import numpy as np


class LipSyncDetector:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True
        )

    def get_mouth_openness(self, frame):
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return None

        lm = results.multi_face_landmarks[0].landmark

        # Upper lip & lower lip
        upper_lip = lm[13]
        lower_lip = lm[14]

        mouth_open = abs(upper_lip.y - lower_lip.y)

        return mouth_open
