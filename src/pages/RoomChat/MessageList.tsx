import type { RefObject } from "react";
import { Avatar, Flex } from "antd";
import { Bubble } from "@ant-design/x";
import { EyeOutlined, UserOutlined } from "@ant-design/icons";

import type ChatMessage from "@/interfaces/chatMessage.interface";

type MessageListProps = {
  messages: ChatMessage[];
  userId?: string;
  messagesEndRef: RefObject<HTMLDivElement>;
};

function renderMessageContent(item: ChatMessage) {
  const hasImages = (item.images?.length || 0) > 0;
  const hasVideos = (item.videos?.length || 0) > 0;
  const hasMaterials = (item.materials?.length || 0) > 0;

  if (!hasImages && !hasVideos && !hasMaterials) {
    return item.content;
  }

  const getMaterialName = (url: string) => {
    const fileName = url.split("/").pop() || url;
    return fileName.split("?")[0] || "Material";
  };

  const getMaterialExtension = (name: string) => {
    const parts = name.toLowerCase().split(".");
    return parts.length > 1 ? parts[parts.length - 1] : "";
  };

  const getMaterialOpenUrl = (url: string) => {
    const name = getMaterialName(url);
    const ext = getMaterialExtension(name);

    if (ext === "pdf") {
      return url;
    }

    if (ext === "doc" || ext === "docx") {
      return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
        url
      )}`;
    }

    return url;
  };

  return (
    <div className="flex flex-col gap-2">
      {item.content && <div>{item.content}</div>}
      {hasImages && (
        <div className="grid grid-cols-2 gap-2">
          {item.images?.map((url, index) => (
            <img
              key={`${url}-${index}`}
              src={url}
              alt="Shared"
              className="w-full max-w-[220px] rounded-lg object-cover"
            />
          ))}
        </div>
      )}
      {hasVideos && (
        <div className="grid grid-cols-2 gap-2">
          {item.videos?.map((url, index) => (
            <video
              key={`${url}-${index}`}
              src={url}
              controls
              className="w-full max-w-[220px] rounded-lg object-cover"
            />
          ))}
        </div>
      )}
      {hasMaterials && (
        <div className="flex flex-col gap-2">
          {item.materials?.map((url, index) => {
            const name = getMaterialName(url);
            const openUrl = getMaterialOpenUrl(url);

            return (
              <div key={`${url}-${index}`} className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-700">{name}</span>
                <a
                  href={openUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600"
                  aria-label="Open material"
                >
                  <EyeOutlined />
                </a>
              </div>
            );
          })}
        </div>
      )}
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
