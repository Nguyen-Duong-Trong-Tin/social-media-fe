interface ChatMessage {
  content: string;
  images?: string[];
  videos?: string[];
  materials?: string[];
  userId: string;
  createdAt?: string;
  status?: "sending";
}

export default ChatMessage;
