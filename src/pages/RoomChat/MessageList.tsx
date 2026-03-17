import type { ReactNode, RefObject } from "react";
import { Avatar, Flex, Popover } from "antd";
import { Bubble } from "@ant-design/x";
import {
  EyeOutlined,
  PushpinFilled,
  PushpinOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import type ChatMessage from "@/interfaces/chatMessage.interface";

type MessageListProps = {
  messages: ChatMessage[];
  userId?: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  userById?: Record<
    string,
    { fullName?: string; avatar?: string; slug?: string }
  >;
  mentionUsers?: { fullName?: string; avatar?: string; slug?: string }[];
  showSenderName?: boolean;
  onTogglePin?: (messageId: string, pinned: boolean) => void;
  registerMessageRef?: (messageId: string, node: HTMLDivElement | null) => void;
};

type MentionUser = {
  fullName?: string;
  avatar?: string;
  slug?: string;
};

function renderWithMentions(
  content: string,
  mentionUsers: MentionUser[],
  onViewProfile: (slug?: string) => void
): ReactNode {
  if (!content) {
    return content;
  }

  const mentionCandidates = mentionUsers
    .map((user) => ({
      name: user.fullName || "",
      avatar: user.avatar,
      slug: user.slug,
    }))
    .filter((user) => user.name)
    .sort((a, b) => b.name.length - a.name.length);

  const regexFallback = /@[\w.-]{1,32}/y;
  const nodes: ReactNode[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const atIndex = content.indexOf("@", cursor);
    if (atIndex === -1) {
      nodes.push(content.slice(cursor));
      break;
    }

    const charBefore = atIndex > 0 ? content[atIndex - 1] : "";
    if (atIndex > 0 && /[\w]/.test(charBefore)) {
      nodes.push(content.slice(cursor, atIndex + 1));
      cursor = atIndex + 1;
      continue;
    }

    if (atIndex > cursor) {
      nodes.push(content.slice(cursor, atIndex));
    }

    const lower = content.slice(atIndex + 1).toLowerCase();
    const matched = mentionCandidates.find((candidate) =>
      lower.startsWith(candidate.name.toLowerCase())
    );

    if (matched) {
      const mentionText = `@${matched.name}`;
      nodes.push(
        <Popover
          key={`${atIndex}-${mentionText}`}
          trigger="click"
          content={
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="shrink-0"
                onClick={() => onViewProfile(matched.slug)}
              >
                <Avatar src={matched.avatar}>
                  {matched.name[0]}
                </Avatar>
              </button>
              <div className="flex flex-col">
                <div className="font-semibold text-slate-800">
                  {matched.name}
                </div>
                {matched.slug && (
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => onViewProfile(matched.slug)}
                  >
                    View profile
                  </button>
                )}
              </div>
            </div>
          }
        >
          <button
            type="button"
            className="rounded bg-amber-100 px-1 text-amber-900"
          >
            {mentionText}
          </button>
        </Popover>
      );
      cursor = atIndex + mentionText.length;
      continue;
    }

    regexFallback.lastIndex = atIndex;
    const fallbackMatch = regexFallback.exec(content);
    if (fallbackMatch) {
      nodes.push(
        <span
          key={`${atIndex}-${fallbackMatch[0]}`}
          className="rounded bg-amber-100 px-1 text-amber-900"
        >
          {fallbackMatch[0]}
        </span>
      );
      cursor = atIndex + fallbackMatch[0].length;
      continue;
    }

    nodes.push(content.slice(atIndex, atIndex + 1));
    cursor = atIndex + 1;
  }

  return nodes.length ? nodes : content;
}

function renderMessageContent(
  item: ChatMessage,
  mentionUsers: MentionUser[],
  onViewProfile: (slug?: string) => void
) {
  const hasImages = (item.images?.length || 0) > 0;
  const hasVideos = (item.videos?.length || 0) > 0;
  const hasMaterials = (item.materials?.length || 0) > 0;

  if (!hasImages && !hasVideos && !hasMaterials) {
    return renderWithMentions(item.content, mentionUsers, onViewProfile);
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
      {item.content && (
        <div>{renderWithMentions(item.content, mentionUsers, onViewProfile)}</div>
      )}
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

function MessageList({
  messages,
  userId,
  messagesEndRef,
  userById,
  mentionUsers = [],
  showSenderName = false,
  onTogglePin,
  registerMessageRef,
}: MessageListProps) {
  const navigate = useNavigate();
  const handleViewProfile = (slug?: string) => {
    if (!slug) {
      return;
    }

    navigate(`/profile/${slug}`);
  };

  return (
    <Flex
      vertical
      gap="small"
      className="overflow-y-auto pr-2"
      style={{ height: 420 }}
    >
      {messages.map((item, index) => {
        const sender = userById?.[item.userId];
        const displayName =
          item.userId === userId ? "You" : sender?.fullName || "Unknown";
        const showName = Boolean(userById) && showSenderName;
        const isPinned = Boolean(item.pinned);
        const canTogglePin = Boolean(onTogglePin && item._id);
        const bubbleContent = showName ? (
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-500 text-left">
              {displayName}
            </div>
            {isPinned && (
              <div className="flex items-center gap-1 text-[11px] text-amber-600">
                <PushpinFilled className="text-xs" />
                <span>Pinned</span>
              </div>
            )}
            {renderMessageContent(item, mentionUsers, handleViewProfile)}
          </div>
        ) : (
          renderMessageContent(item, mentionUsers, handleViewProfile)
        );

        const isSender = item.userId === userId;

        return (
          <Flex key={`${item.userId}-${index}`} gap="small" wrap>
            <div
              style={{ width: "100%" }}
              ref={(node) => {
                if (item._id && registerMessageRef) {
                  registerMessageRef(item._id, node);
                }
              }}
            >
              <div
                className={`flex items-start gap-2 ${
                  isSender ? "justify-end" : "justify-start"
                }`}
              >
                <Bubble
                  content={bubbleContent}
                  placement={isSender ? "end" : "start"}
                  avatar={
                    <Avatar
                      src={sender?.avatar}
                      icon={!sender?.avatar ? <UserOutlined /> : undefined}
                    />
                  }
                />
                {canTogglePin && (
                  <button
                    type="button"
                    className="mt-2 text-gray-400 hover:text-amber-500 transition"
                    onClick={() => item._id && onTogglePin?.(item._id, !isPinned)}
                    aria-label={isPinned ? "Unpin message" : "Pin message"}
                  >
                    {isPinned ? <PushpinFilled /> : <PushpinOutlined />}
                  </button>
                )}
              </div>
            </div>
          </Flex>
        );
      })}

      <div ref={messagesEndRef} />
    </Flex>
  );
}

export default MessageList;
