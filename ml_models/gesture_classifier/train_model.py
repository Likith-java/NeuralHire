import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
import joblib

print("Loading data...")
# df = pd.read_csv(r"data\landmarks.csv")
df = pd.read_csv(r"data\landmarks_normalized.csv")

X = df.drop("label", axis=1).values
y = df["label"].values

le = LabelEncoder()
y_encoded = le.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

print(f"Training samples : {len(X_train)}")
print(f"Testing samples  : {len(X_test)}")
print(f"Classes          : {list(le.classes_)}")

print("\nTraining Random Forest... (10-15 minutes)")
clf = RandomForestClassifier(
    n_estimators=100,
    max_depth=None,
    n_jobs=-1,
    random_state=42,
    verbose=1
)
clf.fit(X_train, y_train)

print("\nEvaluating...")
y_pred = clf.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"\nAccuracy : {acc * 100:.2f}%")
print("\nDetailed Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

print("\nSaving model...")
joblib.dump(clf, "gesture_clf.pkl")
joblib.dump(le,  "label_encoder.pkl")
print("Saved: gesture_clf.pkl")
print("Saved: label_encoder.pkl")
print("\nDONE. Model ready.")