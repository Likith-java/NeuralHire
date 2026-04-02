import cv2
from gaze_tracking import GazeTracker

gaze = GazeTracker()
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    result = gaze.get_gaze(frame)

    if result:
        gaze_x, gaze_y = result

        cv2.putText(frame, f"Gaze X: {round(gaze_x, 2)}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        if gaze_x < 0.3:
            cv2.putText(frame, "Looking LEFT", (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        elif gaze_x > 0.7:
            cv2.putText(frame, "Looking RIGHT", (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        else:
            cv2.putText(frame, "Looking CENTER", (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    cv2.imshow("Gaze Test", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
