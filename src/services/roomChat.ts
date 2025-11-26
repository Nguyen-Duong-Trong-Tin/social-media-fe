import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findRoomChatByAiAssistantAndUserId = async ({
  accessToken,
  userId,
}: {
  accessToken: string;
  userId: string;
}) => {
  const response = await axios.get(`${v1}/roomChats/ai-assistant/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};
