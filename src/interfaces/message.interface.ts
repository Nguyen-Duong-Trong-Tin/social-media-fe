export interface IMessage {
  _id?: string;
  content?: string;
  images?: string[];
  videos?: string[];
  materials?: string[];
  userId?: string;
  roomChatId: string;
  pinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: string | null;
  createdAt?: string;
  deleted?: boolean;
}


