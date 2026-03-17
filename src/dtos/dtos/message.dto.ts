export interface ServerResponseMessageToAIAssistantDto {
  userId: string;
  message: string;
  groupId: string;
};

export interface ServerResponseMessageToRoomChatDto {
  _id?: string;
  userId: string;
  roomChatId: string;
  content: string;
  images?: string[];
  videos?: string[];
  materials?: string[];
  pinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: string | null;
  createdAt?: string;
  deleted?: boolean;
};

export interface ServerResponsePinMessageDto {
  userId: string;
  roomChatId: string;
  messageId: string;
  pinned: boolean;
  pinnedBy?: string;
  pinnedAt?: string | null;
};

export interface ServerResponseDeleteMessageDto {
  userId: string;
  roomChatId: string;
  messageId: string;
  deleted: boolean;
};

export interface ServerResponseTypingToRoomChatDto {
  userId: string;
  roomChatId: string;
  isTyping: boolean;
};