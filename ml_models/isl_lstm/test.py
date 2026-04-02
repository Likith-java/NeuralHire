import requests
import numpy as np

fake = np.random.rand(63).tolist()

res = requests.post(
    "http://127.0.0.1:8000/api/gesture/letter",
    json={"landmarks": fake}
)

print("STATUS:", res.status_code)
print("TEXT:", res.text)   # 👈 IMPORTANT
