import os

folders = [
    "NeuralHire/backend/verifier",
    "NeuralHire/backend/api",
    "NeuralHire/backend/services",
    "NeuralHire/backend/utils",
    "NeuralHire/frontend/components",
    "NeuralHire/frontend/pages",
    "NeuralHire/ml_models",
    "NeuralHire/tests"
]

files = [
    "NeuralHire/backend/main.py",
    "NeuralHire/backend/config.py",

    "NeuralHire/backend/verifier/__init__.py",
    "NeuralHire/backend/verifier/face_detection.py",
    "NeuralHire/backend/verifier/head_pose.py",
    "NeuralHire/backend/verifier/gaze_tracking.py",
    "NeuralHire/backend/verifier/lip_sync.py",
    "NeuralHire/backend/verifier/verifier_engine.py",

    "NeuralHire/backend/api/routes.py",
    "NeuralHire/backend/api/schemas.py",

    "NeuralHire/backend/services/scoring.py",

    "NeuralHire/backend/utils/helpers.py",
    "NeuralHire/backend/utils/logger.py",

    "NeuralHire/requirements.txt",
    "NeuralHire/README.md",
    "NeuralHire/run.py"
]

# Create folders
for folder in folders:
    os.makedirs(folder, exist_ok=True)

# Create files
for file in files:
    open(file, 'a').close()

print("✅ NeuralHire project structure created successfully!")
