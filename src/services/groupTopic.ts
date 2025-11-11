import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findGroupTopics = async ({
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
  let param = `${v1}/groupTopics?`;

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

export const findByIdGroupTopic = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id: string;
}) => {
  const response = await axios.get(`${v1}/groupTopics/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};


export const findBySlugGroupTopic = async ({
  accessToken,
  slug,
}: {
  accessToken: string;
  slug: string;
}) => {
  const response = await axios.get(`${v1}/groupTopics/slug/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};
