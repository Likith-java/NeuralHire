import cv2
from head_pose import HeadPoseEstimator

pose = HeadPoseEstimator()
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    yaw = pose.get_head_pose(frame)

    if yaw is not None:
        cv2.putText(frame, f"Yaw: {int(yaw)}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        if abs(yaw) > 30:
            cv2.putText(frame, "ALERT: Looking Away!", (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    cv2.imshow("Head Pose Test", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()
