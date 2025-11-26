import { Avatar, Button, Flex, Input } from "antd";
import { useEffect, useState, useRef } from "react";

import { Bubble } from "@ant-design/x";
import { socket } from "@/services/socket";
import { Card } from "@/components/ui/card";
import { getCookie } from "@/helpers/cookies";
import { UserOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import SocketEvent from "@/enums/socketEvent.enum";
import type { ServerResponseMessageToAIAssistantDto } from "@/dtos/dtos/message.dto";
import type IGroup from "@/interfaces/group.interface";
import { findBySlugGroup } from "@/services/group";
import TypingBubble from "@/components/TypingBubble";
import { toast } from "react-toastify";
import { findRoomChatByAiAssistantAndUserId } from "@/services/roomChat";
import { findMessages } from "@/services/message";
import type IMessage from "@/interfaces/message.interface";

const { TextArea } = Input;

function GroupProfileAIAssistant() {
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");

  const { slug } = useParams();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [group, setGroup] = useState<IGroup>();
  const [messages, setMessages] = useState<
    { content: string; userId: string; status?: string }[]
  >([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const responseGroup = await findBySlugGroup({
          accessToken,
          slug: slug as string,
        });
        setGroup(responseGroup.data.data);

        const responseRoomChat = await findRoomChatByAiAssistantAndUserId({
          accessToken,
          userId,
        });
        if (!responseRoomChat.data.data) {
          return;
        }

        const responseMessages = await findMessages({
          accessToken,
          filter: { roomChatId: responseRoomChat.data.data._id },
          sort: { sortKey: "createdAt", sortValue: "asc" },
        });
        responseMessages.data.data.messages.items.map((item: IMessage) => ({
          content: item.content,
          userId: item.userId,
        }));
        setMessages(
          responseMessages.data.data.messages.items.map((item: IMessage) => ({
            content: item.content,
            userId: item.userId,
          }))
        );
      } catch {
        toast.error("Something went wrong.");
      }
    };
    fetchApi();
  }, [accessToken, slug, userId]);

  useEffect(() => {
    const handler = (data: ServerResponseMessageToAIAssistantDto) => {
      if (!group || data.groupId !== group._id || data.userId !== userId) {
        return;
      }

      setIsButtonLoading(false);
      setMessages((prev) => {
        prev.pop();

        return [...prev, { content: data.message, userId: "" }];
      });
    };

    socket.on(SocketEvent.SERVER_RESPONSE_MESSAGE_TO_AI_ASSISTANT, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_MESSAGE_TO_AI_ASSISTANT, handler);
    };
  }, [group, userId]);

  const handleSendMessage = () => {
    if (!message || !group) {
      return;
    }

    setIsButtonLoading(true);
    setMessage("");
    setMessages((prev) => [
      ...prev,
      { content: message, userId },
      { content: "...", userId: "", status: "typing" },
    ]);

    socket.emit(SocketEvent.CLIENT_SEND_MESSAGE_TO_AI_ASSISTANT, {
      userId,
      groupId: group._id,
      message,
    });
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-3">AI Assistant</h2>

        <Flex
          vertical
          gap="small"
          className="overflow-y-auto pr-2"
          style={{ height: 400 }}
        >
          {messages.map((message, index) => (
            <Flex key={index} gap="small" wrap>
              <div style={{ width: "100%" }}>
                {message.status === "typing" ? (
                  <TypingBubble />
                ) : (
                  <Bubble
                    content={message.content}
                    placement={message.userId ? "end" : "start"}
                    avatar={<Avatar icon={<UserOutlined />} />}
                  />
                )}
              </div>
            </Flex>
          ))}

          <div ref={messagesEndRef} />
        </Flex>

        {!messages.length && (
          <Flex
            vertical
            align="center"
            justify="center"
            style={{ height: "100%", opacity: 0.7 }}
          >
            <Avatar
              size={64}
              icon={<UserOutlined />}
              className="mb-4 bg-blue-500"
            />
            <h3 className="text-xl font-semibold text-gray-700">
              Hi! How can I help you?
            </h3>
            <p className="text-gray-500 mb-6 text-center max-w-md">
              I am the AI ​​assistant of the {group?.title} team. Ask me
              anything related to the team.
            </p>
          </Flex>
        )}

        <div style={{ gap: "8px" }} className="flex items-center">
          <TextArea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            autoSize={{ minRows: 2, maxRows: 6 }}
            placeholder="Type your message..."
          />
          <Button
            type="primary"
            loading={isButtonLoading}
            onClick={handleSendMessage}
          >
            Submit
          </Button>
        </div>
      </Card>
    </>
  );
}

export default GroupProfileAIAssistant;
