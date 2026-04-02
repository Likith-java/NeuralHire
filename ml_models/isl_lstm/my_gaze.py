import cv2
import mediapipe as mp

class GazeTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True
        )

    def get_gaze(self, frame):
        h, w, _ = frame.shape
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb)

        if not results.multi_face_landmarks:
            return None

        lm = results.multi_face_landmarks[0].landmark

        # Iris centers
        left_iris = lm[468]
        right_iris = lm[473]

        # Eye corners
        left_eye_left = lm[33]
        left_eye_right = lm[133]

        right_eye_left = lm[362]
        right_eye_right = lm[263]

        # Normalize iris position inside eye
        left_ratio = (left_iris.x - left_eye_left.x) / (left_eye_right.x - left_eye_left.x + 1e-6)
        right_ratio = (right_iris.x - right_eye_left.x) / (right_eye_right.x - right_eye_left.x + 1e-6)

        gaze_x = (left_ratio + right_ratio) / 2

        # Vertical (simple)
        gaze_y = (left_iris.y + right_iris.y) / 2

        return gaze_x, gaze_y
