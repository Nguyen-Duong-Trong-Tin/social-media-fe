import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findArticleUsers = async ({
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
  let param = `${v1}/articleUsers?`;

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

export const findArticleUserById = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id: string;
}) => {
  const response = await axios.get(`${v1}/articleUsers/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const findArticleUserBySlug = async ({
  accessToken,
  slug,
}: {
  accessToken: string;
  slug: string;
}) => {
  const response = await axios.get(`${v1}/articleUsers/slug/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const createArticleUser = async ({
  accessToken,
  payload,
}: {
  accessToken: string;
  payload: FormData;
}) => {
  const response = await axios.post(`${v1}/articleUsers`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const updateArticleUser = async ({
  accessToken,
  id,
  payload,
}: {
  accessToken: string;
  id: string;
  payload: FormData;
}) => {
  const response = await axios.patch(`${v1}/articleUsers/${id}`, payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const deleteArticleUser = async ({
  accessToken,
  id,
  userId,
}: {
  accessToken: string;
  id: string;
  userId: string;
}) => {
  const response = await axios.delete(`${v1}/articleUsers/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { userId },
  });
  return response;
};
