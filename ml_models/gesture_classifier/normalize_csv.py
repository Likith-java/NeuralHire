import pandas as pd
import numpy as np

print("Loading landmarks.csv...")
df = pd.read_csv(r"data\landmarks.csv")

labels = df["label"].values
coords = df.drop("label", axis=1).values

print("Normalizing...")
normalized = []
for row in coords:
    wrist_x = row[0]
    wrist_y = row[1]
    wrist_z = row[2]

    for i in range(0, len(row), 3):
        row[i]   -= wrist_x
        row[i+1] -= wrist_y
        row[i+2] -= wrist_z

    max_val = np.max(np.abs(row))
    if max_val > 0:
        row = row / max_val

    normalized.append(row)

normalized = np.array(normalized)

cols = []
for i in range(21):
    cols += [f"x{i}", f"y{i}", f"z{i}"]

df_norm = pd.DataFrame(normalized, columns=cols)
df_norm["label"] = labels

df_norm.to_csv(r"data\landmarks_normalized.csv", index=False)
print(f"Done. Saved landmarks_normalized.csv — {len(df_norm)} rows")