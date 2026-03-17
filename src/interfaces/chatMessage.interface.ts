interface ChatMessage {
  _id?: string;
  content: string;
  images?: string[];
  videos?: string[];
  materials?: string[];
  userId: string;
  pinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: string | null;
  createdAt?: string;
  status?: "sending";
}

export default ChatMessage;
