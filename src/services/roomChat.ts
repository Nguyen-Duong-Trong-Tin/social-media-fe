import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const findRoomChatByAiAssistantAndUserId = async ({
  accessToken,
  userId,
  groupId
}: {
  accessToken: string;
  userId: string;
  groupId: string;
}) => {
  const response = await axios.get(`${v1}/roomChats/ai-assistant/${groupId}/${userId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response;
};
