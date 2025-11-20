import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findTaskGroupSubmissionsByUserIdAndTaskGroupIds = async ({
  accessToken,
  userId,
  taskGroupIds,
}: {
  accessToken: string;
  userId: string;
  taskGroupIds: string[];
}) => {
  const response = await axios.post(`${v1}/taskGroupSubmissions/find-by-user-id-and-task-group-ids`, {
    userId,
    taskGroupIds,
  }, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};
