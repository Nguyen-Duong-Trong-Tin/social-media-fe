import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const getUnreadNotificationCounts = async ({
  accessToken,
  userId,
}: {
  accessToken: string;
  userId: string;
}) => {
  const response = await axios.get(
    `${v1}/notifications/unread-count?userId=${userId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response;
};

export const markNotificationsRead = async ({
  accessToken,
  userId,
  type,
  roomChatId,
}: {
  accessToken: string;
  userId: string;
  type?: string;
  roomChatId?: string;
}) => {
  const response = await axios.patch(
    `${v1}/notifications/mark-read`,
    { userId, type, roomChatId },
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  return response;
};

export const findNotifications = async ({
  accessToken,
  userId,
  isRead,
  limit,
}: {
  accessToken: string;
  userId: string;
  isRead?: boolean;
  limit?: number;
}) => {
  const params = new URLSearchParams({ userId });
  if (typeof isRead === "boolean") {
    params.append("isRead", String(isRead));
  }
  if (limit) {
    params.append("limit", String(limit));
  }

  const response = await axios.get(`${v1}/notifications?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};
