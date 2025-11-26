interface IMessage {
  content: string;
  images: string[];
  videos: string[];
  materials: string[];
  userId: string;
  roomChatId: string;
  deleted: boolean;
}

export default IMessage;