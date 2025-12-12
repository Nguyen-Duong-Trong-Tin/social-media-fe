enum SocketEvent {
  CLIENT_SEND_MESSAGE_TO_AI_ASSISTANT = "client.send.message.to.ai.assistant",
  SERVER_RESPONSE_MESSAGE_TO_AI_ASSISTANT = "server.response.message.to.ai.assistant",

  CLIENT_REJECT_FRIEND_REQUEST = "client.reject.friend.request",
  SERVER_RESPONSE_REJECT_FRIEND_REQUEST = "server.response.reject.friend.request",
}

export default SocketEvent;
