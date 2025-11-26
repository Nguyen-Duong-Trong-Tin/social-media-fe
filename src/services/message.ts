import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findMessages = async ({
  accessToken,
  page,
  limit,
  filter,
  sort,
}: {
  accessToken: string;
  page?: number;
  limit?: number;
  filter?: Record<string, unknown>;
  sort?: { sortKey: string; sortValue: string };
}) => {
  let param = `${v1}/messages?`;

  if (page && limit) {
    param += `page=${page}&limit=${limit}&`;
  }

  if (filter) {
    param += `filter=${JSON.stringify(filter)}&`;
  }

  if (sort) {
    const { sortKey, sortValue } = sort;

    param += `sort=${sortKey}-${sortValue}&`;
  }

  const response = await axios.get(param, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};
