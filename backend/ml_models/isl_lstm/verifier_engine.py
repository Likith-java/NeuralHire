from face_detection import FaceDetector
from head_pose import HeadPoseEstimator
from gaze_tracking import GazeTracker
from lip_sync import LipSyncDetector
from audio import get_audio_level

import time


class VerifierEngine:
    def __init__(self):
        self.face_detector = FaceDetector()
        self.head_pose = HeadPoseEstimator()
        self.gaze_tracker = GazeTracker()
        self.lip_sync = LipSyncDetector()
        self.last_decay_time = time.time()

        self.events = {
            "multiple_faces": 0,
            "looking_away": 0,
            "reading_suspicion": 0,
            "audio_mismatch": 0
        }

        # State control
        self.prev_multiple_faces = False
        self.look_away_start = None
        self.prev_gaze_flag = False
        self.prev_audio_flag = False

        # Audio optimization
        self.last_audio_check = 0
        self.audio_value = 0

    def process_frame(self, frame):
        # -------------------------
        # SIGNAL EXTRACTION
        # -------------------------
        face_count, _ = self.face_detector.detect_faces(frame)
        yaw = self.head_pose.get_head_pose(frame)
        gaze = self.gaze_tracker.get_gaze(frame)

        # -------------------------
        # MULTIPLE FACES EVENT
        # -------------------------
        if face_count > 1:
            if not self.prev_multiple_faces:
                self.events["multiple_faces"] += 1
                self.prev_multiple_faces = True
        else:
            self.prev_multiple_faces = False

        # -------------------------
        # LOOKING AWAY EVENT (HEAD POSE)
        # -------------------------
        if yaw is not None and abs(yaw) > 30:
            if self.look_away_start is None:
                self.look_away_start = time.time()
            elif time.time() - self.look_away_start > 3:
                self.events["looking_away"] += 1
                self.look_away_start = None
        else:
            self.look_away_start = None

        # -------------------------
        # GAZE EVENT (EYE MOVEMENT)
        # -------------------------
        if gaze:
            gaze_x, gaze_y = gaze

            if gaze_x < 0.3 or gaze_x > 0.7:
                if not self.prev_gaze_flag:
                    self.events["reading_suspicion"] += 1
                    self.prev_gaze_flag = True
            else:
                self.prev_gaze_flag = False

        # -------------------------
        # AUDIO (optimized sampling)
        # -------------------------
        if time.time() - self.last_audio_check > 0.5:
            self.audio_value = get_audio_level()
            self.last_audio_check = time.time()

        audio = self.audio_value

        # -------------------------
        # LIP SYNC EVENT
        # -------------------------
        mouth = self.lip_sync.get_mouth_openness(frame)

        if mouth is not None:
            if audio > 0.01 and mouth < 0.01:
                if not self.prev_audio_flag:
                    self.events["audio_mismatch"] += 1
                    self.prev_audio_flag = True
            else:
                self.prev_audio_flag = False
        # -------------------------
        # EVENT DECAY (every 5 sec)
        # -------------------------
        if time.time() - self.last_decay_time > 5:
            for key in self.events:
                if self.events[key] > 0:
                
                    self.events[key] -= 1
                    
                    self.last_decay_time = time.time()
        # -------------------------
        # SCORE CALCULATION
        # -------------------------
        score = 100
        score -= self.events["multiple_faces"] * 10
        score -= self.events["looking_away"] * 2
        score -= self.events["reading_suspicion"] * 3
        score -= self.events["audio_mismatch"] * 5

        score = max(0, score)

        return score, self.events, yaw, face_count, gaze
