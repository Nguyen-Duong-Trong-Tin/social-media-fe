import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findArticleGroups = async ({
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
  let param = `${v1}/articleGroups?`;

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

export const findArticleGroupById = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id: string;
}) => {
  const response = await axios.get(`${v1}/articleGroups/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const findArticleGroupBySlug = async ({
  accessToken,
  slug,
}: {
  accessToken: string;
  slug: string;
}) => {
  const response = await axios.get(`${v1}/articleGroups/slug/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const createArticleGroup = async ({
  accessToken,
  payload,
}: {
  accessToken: string;
  payload: FormData;
}) => {
  const response = await axios.post(`${v1}/articleGroups`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const updateArticleGroup = async ({
  accessToken,
  id,
  payload,
}: {
  accessToken: string;
  id: string;
  payload: FormData;
}) => {
  const response = await axios.patch(`${v1}/articleGroups/${id}`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const deleteArticleGroup = async ({
  accessToken,
  id,
  userId,
}: {
  accessToken: string;
  id: string;
  userId: string;
}) => {
  const response = await axios.delete(`${v1}/articleGroups/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { userId },
  });
  return response;
};
