import numpy as np
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

from extract_features import process_folder

# Load data
conf_features, conf_labels = process_folder("data/confident", 0)
hes_features, hes_labels = process_folder("data/hesitant", 1)

# Combine
X = np.array(conf_features + hes_features)
y = np.array(conf_labels + hes_labels)

print("Total samples:", len(X))

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42
)

# Train SVM
model = SVC(kernel='rbf', probability=True)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)

print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# Save model + scaler
joblib.dump(model, "hesitation_model.pkl")
joblib.dump(scaler, "hesitation_scaler.pkl")

print("\nModel saved successfully!")
