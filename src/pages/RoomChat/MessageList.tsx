import type { RefObject } from "react";
import { Avatar, Flex } from "antd";
import { Bubble } from "@ant-design/x";
import { UserOutlined } from "@ant-design/icons";

import type ChatMessage from "@/interfaces/chatMessage.interface";

type MessageListProps = {
  messages: ChatMessage[];
  userId?: string;
  messagesEndRef: RefObject<HTMLDivElement>;
};

function renderMessageContent(item: ChatMessage) {
  if (!item.images?.length) {
    return item.content;
  }

  return (
    <div className="flex flex-col gap-2">
      {item.content && <div>{item.content}</div>}
      <div className="grid grid-cols-2 gap-2">
        {item.images.map((url, index) => (
          <img
            key={`${url}-${index}`}
            src={url}
            alt="Shared"
            className="w-full max-w-[220px] rounded-lg object-cover"
          />
        ))}
      </div>
    </div>
  );
}

function MessageList({ messages, userId, messagesEndRef }: MessageListProps) {
  return (
    <Flex
      vertical
      gap="small"
      className="overflow-y-auto pr-2"
      style={{ height: 420 }}
    >
      {messages.map((item, index) => (
        <Flex key={`${item.userId}-${index}`} gap="small" wrap>
          <div style={{ width: "100%" }}>
            <Bubble
              content={renderMessageContent(item)}
              placement={item.userId === userId ? "end" : "start"}
              avatar={<Avatar icon={<UserOutlined />} />}
            />
          </div>
        </Flex>
      ))}

      <div ref={messagesEndRef} />
    </Flex>
  );
}

export default MessageList;
