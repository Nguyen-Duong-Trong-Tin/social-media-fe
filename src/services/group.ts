import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findGroups = async ({
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
  let param = `${v1}/groups?`;

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

export const findBySlugGroup = async ({
  accessToken,
  slug,
}: {
  accessToken: string;
  slug: string;
}) => {
  const response = await axios.get(`${v1}/groups/slug/${slug}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};

export const updateDescriptionGroup = async ({
  accessToken,
  id,
  description,
}: {
  accessToken: string;
  id: string;
  description: string;
}) => {
  const response = await axios.patch(
    `${v1}/groups/description/${id}`,
    { description },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};

export const updateInvitationGroup = async ({
  accessToken,
  id,
  invitation,
}: {
  accessToken: string;
  id: string;
  invitation: string;
}) => {
  const response = await axios.patch(
    `${v1}/groups/invitation/${id}`,
    { invitation },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};

export const inviteMemberGroup = async ({
  accessToken,
  id,
  userId,
}: {
  accessToken: string;
  id: string;
  userId: string;
}) => {
  const response = await axios.post(
    `${v1}/groups/invite-member/${userId}/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};

export const inviteMemberGroupAccept = async ({
  accessToken,
  id,
  userId,
}: {
  accessToken: string;
  id: string;
  userId: string;
}) => {
  const response = await axios.post(
    `${v1}/groups/invite-member/accept/${userId}/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};

export const inviteMemberGroupReject = async ({
  accessToken,
  id,
  userId,
}: {
  accessToken: string;
  id: string;
  userId: string;
}) => {
  const response = await axios.post(
    `${v1}/groups/invite-member/reject/${userId}/${id}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response;
};