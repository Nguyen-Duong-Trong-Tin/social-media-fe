import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findTaskGroups = async ({
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
  let param = `${v1}/taskGroups?`;

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

export const findTaskGroupById = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id: string;
}) => {
  const response = await axios.get(`${v1}/taskGroups/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const deleteTaskGroup = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id: string;
}) => {
  const response = await axios.delete(`${v1}/taskGroups/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};
