import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const userCheckUserExistsEmail = async ({
  email,
}: {
  email: string;
}) => {
  const response = await axios.post(`${v1}/users/check-exists/email`, {
    email,
  });
  return response;
};

export const userCheckUserExistsPhone = async ({
  phone,
}: {
  phone: string;
}) => {
  const response = await axios.post(`${v1}/users/check-exists/phone`, {
    phone,
  });
  return response;
};

export const userFindUserByIds = async ({
  accessToken,
  ids,
}: {
  accessToken: string;
  ids: string[];
}) => {
  const response = await axios.post(
    `${v1}/users/ids`,
    { ids },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response;
};

export const findUsers = async ({
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
  let param = `${v1}/users?`;

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

export const findUserById = async ({
  accessToken,
  id,
}: {
  accessToken: string;
  id: string;
}) => {
  const response = await axios.get(`${v1}/users/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const userFindUserBySlug = async ({
  accessToken,
  slug,
}: {
  accessToken: string;
  slug: string;
}) => {
  const response = await axios.get(`${v1}/users/slug/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const userUpdateBio = async ({
  accessToken,
  id,
  bio,
}: {
  accessToken: string;
  id: string;
  bio: string;
}) => {
  const response = await axios.patch(
    `${v1}/users/bio/${id}`,
    { bio },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};
