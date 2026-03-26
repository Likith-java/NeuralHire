import librosa
import numpy as np
import os

def extract_features(file_path):
    y, sr = librosa.load(file_path, sr=16000)

    # ---------- MFCC ----------
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
    mfcc_mean = np.mean(mfcc, axis=1)

    # ---------- ZCR ----------
    zcr = np.mean(librosa.feature.zero_crossing_rate(y))

    # ---------- Energy ----------
    energy = np.mean(librosa.feature.rms(y=y))

    # ---------- Pitch ----------
    pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
    pitch_vals = pitches[pitches > 0]

    if len(pitch_vals) > 0:
        pitch_mean = np.mean(pitch_vals)
        pitch_std = np.std(pitch_vals)
    else:
        pitch_mean = 0
        pitch_std = 0

    # ---------- Pause Detection ----------
    intervals = librosa.effects.split(y, top_db=30)

    pauses = []
    prev_end = 0

    for start, end in intervals:
        pause = start - prev_end
        if pause > 0:
            pauses.append(pause)
        prev_end = end

    if len(pauses) > 0:
        pause_mean = np.mean(pauses)
        pause_max = np.max(pauses)
        pause_count = len(pauses)
    else:
        pause_mean = 0
        pause_max = 0
        pause_count = 0

    # Combine all features
    return np.hstack([
        mfcc_mean,
        zcr,
        energy,
        pitch_mean,
        pitch_std,
        pause_mean,
        pause_max,
        pause_count
    ])


def process_folder(folder, label):
    features = []
    labels = []

    for file in os.listdir(folder):
        if file.endswith(".wav"):
            path = os.path.join(folder, file)
            feat = extract_features(path)

            features.append(feat)
            labels.append(label)

    return features, labels
# TEST RUN
if __name__ == "__main__":

    conf_features, conf_labels = process_folder("data/confident", 0)

    print("Number of samples:", len(conf_features))
    print("Feature vector size:", len(conf_features[0]))
