export interface ServerResponseMessageToAIAssistantDto {
  userId: string;
  message: string;
  groupId: string;
};

export interface ServerResponseMessageToRoomChatDto {
  userId: string;
  roomChatId: string;
  content: string;
  images?: string[];
  createdAt?: string;
};

export interface ServerResponseTypingToRoomChatDto {
  userId: string;
  roomChatId: string;
  isTyping: boolean;
};