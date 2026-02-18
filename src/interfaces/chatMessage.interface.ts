interface ChatMessage {
  content: string;
  images?: string[];
  userId: string;
  createdAt?: string;
  status?: "sending";
}

export default ChatMessage;
