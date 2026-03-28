import cv2
import mediapipe as mp
import numpy as np

class HeadPoseEstimator:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True
        )

    def get_head_pose(self, frame):
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return None

        face_landmarks = results.multi_face_landmarks[0]

        # Key points
        image_points = np.array([
            (face_landmarks.landmark[1].x * w, face_landmarks.landmark[1].y * h),   # Nose
            (face_landmarks.landmark[152].x * w, face_landmarks.landmark[152].y * h), # Chin
            (face_landmarks.landmark[33].x * w, face_landmarks.landmark[33].y * h),  # Left eye
            (face_landmarks.landmark[263].x * w, face_landmarks.landmark[263].y * h), # Right eye
            (face_landmarks.landmark[57].x * w, face_landmarks.landmark[57].y * h),  # Left mouth
            (face_landmarks.landmark[287].x * w, face_landmarks.landmark[287].y * h) # Right mouth
        ], dtype="double")

        # 3D model points
        model_points = np.array([
            (0.0, 0.0, 0.0),        # Nose
            (0.0, -330.0, -65.0),   # Chin
            (-225.0, 170.0, -135.0),# Left eye
            (225.0, 170.0, -135.0), # Right eye
            (-150.0, -150.0, -125.0),# Left mouth
            (150.0, -150.0, -125.0) # Right mouth
        ])

        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype="double")

        dist_coeffs = np.zeros((4,1))

        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points,
            image_points,
            camera_matrix,
            dist_coeffs
        )

        rmat, _ = cv2.Rodrigues(rotation_vector)

        sy = np.sqrt(rmat[0,0]**2 + rmat[1,0]**2)

        yaw = np.degrees(np.arctan2(-rmat[2,0], sy))

        return yaw
