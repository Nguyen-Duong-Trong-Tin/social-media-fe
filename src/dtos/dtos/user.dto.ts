export interface ServerResponseRejectFriendRequest {
  userId: string;
  userRequestId: string;
}

export interface ServerResponseSendFriendRequest {
  userId: string;
  userRequestId: string;
}

export interface ServerResponseAcceptFriendRequest {
  userId: string;
  userRequestId: string;
  roomChatId: string;
}

export interface ServerResponseDeleteFriendAccept {
  userId: string;
  userRequestId: string;
}

export interface ServerResponseDeleteFriend {
  userId: string;
  userRequestId: string;
}

