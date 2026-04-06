enum SocketEvent {
  CLIENT_SEND_MESSAGE_TO_AI_ASSISTANT = "client.send.message.to.ai.assistant",
  SERVER_RESPONSE_MESSAGE_TO_AI_ASSISTANT = "server.response.message.to.ai.assistant",

  CLIENT_SEND_MESSAGE_TO_ROOM_CHAT = "client.send.message.to.room.chat",
  SERVER_RESPONSE_MESSAGE_TO_ROOM_CHAT = "server.response.message.to.room.chat",

  CLIENT_TOGGLE_PIN_MESSAGE = "client.toggle.pin.message",
  SERVER_RESPONSE_PIN_MESSAGE = "server.response.pin.message",

  CLIENT_DELETE_MESSAGE = "client.delete.message",
  SERVER_RESPONSE_DELETE_MESSAGE = "server.response.delete.message",

  CLIENT_TYPING_TO_ROOM_CHAT = "client.typing.to.room.chat",
  SERVER_RESPONSE_TYPING_TO_ROOM_CHAT = "server.response.typing.to.room.chat",

  CLIENT_REJECT_FRIEND_REQUEST = "client.reject.friend.request",
  SERVER_RESPONSE_REJECT_FRIEND_REQUEST = "server.response.reject.friend.request",

  CLIENT_SEND_FRIEND_REQUEST = "client.send.friend.request",
  SERVER_RESPONSE_SEND_FRIEND_REQUEST = "server.response.send.friend.request",

  CLIENT_ACCEPT_FRIEND_REQUEST = "client.accept.friend.request",
  SERVER_RESPONSE_ACCEPT_FRIEND_REQUEST = "server.response.accept.friend.request",

  CLIENT_DELETE_FRIEND_ACCEPT = "client.delete.friend.accept",
  SERVER_RESPONSE_DELETE_FRIEND_ACCEPT = "server.response.delete.friend.accept",

  CLIENT_DELETE_FRIEND = "client.delete.friend",
  SERVER_RESPONSE_DELETE_FRIEND = "server.response.delete.friend",

  CLIENT_UPDATE_LOCATION = "client.update.location",
  SERVER_LOCATION_UPDATED = "server.location.updated",

  CLIENT_CALL_OFFER = "client.call.offer",
  SERVER_CALL_OFFER = "server.call.offer",
  CLIENT_CALL_ANSWER = "client.call.answer",
  SERVER_CALL_ANSWER = "server.call.answer",
  CLIENT_CALL_ICE = "client.call.ice",
  SERVER_CALL_ICE = "server.call.ice",
  CLIENT_CALL_END = "client.call.end",
  SERVER_CALL_END = "server.call.end",
  CLIENT_CALL_UPGRADE_REQUEST = "client.call.upgrade.request",
  SERVER_CALL_UPGRADE_REQUEST = "server.call.upgrade.request",
  CLIENT_CALL_UPGRADE_RESPONSE = "client.call.upgrade.response",
  SERVER_CALL_UPGRADE_RESPONSE = "server.call.upgrade.response",

  SERVER_PUSH_NOTIFICATION = "server.push.notification",
}

export default SocketEvent;
