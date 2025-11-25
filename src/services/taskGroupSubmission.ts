import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findTaskGroupSubmissions = async ({
  accessToken,
  page,
  limit,
  filter,
}: {
  accessToken: string;
  page?: number;
  limit?: number;
  filter?: Record<string, unknown>;
}) => {
  let param = `${v1}/taskGroupSubmissions?`;

  if (page && limit) {
    param += `page=${page}&limit=${limit}&`;
  }

  if (filter) {
    param += `filter=${JSON.stringify(filter)}&`;
  }

  const response = await axios.get(param, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const findTaskGroupSubmissionBySlug = async ({
  accessToken,
  slug,
}: {
  accessToken: string;
  slug: string;
}) => {
  const response = await axios.get(`${v1}/taskGroupSubmissions/slug/${slug}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response;
};

export const findTaskGroupSubmissionsByUserIdAndTaskGroupIds = async ({
  accessToken,
  userId,
  taskGroupIds,
}: {
  accessToken: string;
  userId: string;
  taskGroupIds: string[];
}) => {
  const response = await axios.post(
    `${v1}/taskGroupSubmissions/find-by-user-id-and-task-group-ids`,
    {
      userId,
      taskGroupIds,
    },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response;
};

export const scoringTaskGroupSubmission = async ({
  accessToken,
  id,
  score,
  comment,
  scoredBy,
  scoredAt,
}: {
  accessToken: string;
  id: string;
  score: number;
  comment: string;
  scoredBy: string;
  scoredAt: Date;
}) => {
  const response = await axios.patch(
    `${v1}/taskGroupSubmissions/scoring/${id}`,
    { score, comment, scoredBy, scoredAt },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};
