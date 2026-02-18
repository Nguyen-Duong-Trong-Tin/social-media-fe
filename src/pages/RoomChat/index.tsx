import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Avatar, Flex } from "antd";
import { toast } from "react-toastify";
import { UserOutlined } from "@ant-design/icons";

import { Card } from "@/components/ui/card";
import { socket } from "@/services/socket";
import { getCookie } from "@/helpers/cookies";
import { findMessages, uploadMessageImages } from "@/services/message";
import SocketEvent from "@/enums/socketEvent.enum";
import type IMessage from "@/interfaces/message.interface";
import type IUser from "@/interfaces/user.interface";
import type {
  ServerResponseMessageToRoomChatDto,
  ServerResponseTypingToRoomChatDto,
} from "@/dtos/dtos/message.dto";
import type ChatMessage from "@/interfaces/chatMessage.interface";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import ImagePreviewList from "./ImagePreviewList";
import ChatInput from "./ChatInput";

function RoomChat() {
  const { roomChatId } = useParams();
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");
  const location = useLocation();
  const friend = (location.state as { friend?: IUser } | null)?.friend;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const imagePreviewsRef = useRef<string[]>([]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchApi = async () => {
      if (!roomChatId) {
        return;
      }

      try {
        const responseMessages = await findMessages({
          accessToken,
          filter: { roomChatId },
          sort: { sortKey: "createdAt", sortValue: "asc" },
        });

        setMessages(
          responseMessages.data.data.messages.items.map((item: IMessage) => ({
            content: item.content,
            images: item.images,
            userId: item.userId,
          }))
        );
      } catch {
        toast.error("Unable to load messages.");
      }
    };

    fetchApi();
  }, [accessToken, roomChatId]);

  useEffect(() => {
    const handler = (data: ServerResponseMessageToRoomChatDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      setMessages((prev) => {
        if (data.userId === userId) {
          const index = prev.findIndex(
            (item) =>
              item.status === "sending" &&
              item.content === data.content &&
              JSON.stringify(item.images || []) ===
                JSON.stringify(data.images || [])
          );
          if (index !== -1) {
            const next = [...prev];
            next[index] = {
              content: data.content,
              images: data.images,
              userId: data.userId,
              createdAt: data.createdAt,
            };
            return next;
          }
        }

        return [
          ...prev,
          {
            content: data.content,
            images: data.images,
            userId: data.userId,
            createdAt: data.createdAt,
          },
        ];
      });
    };

    socket.on(SocketEvent.SERVER_RESPONSE_MESSAGE_TO_ROOM_CHAT, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_MESSAGE_TO_ROOM_CHAT, handler);
    };
  }, [roomChatId, userId]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    const handler = (data: ServerResponseTypingToRoomChatDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      if (data.userId === userId) {
        return;
      }

      setIsFriendTyping(data.isTyping);

      if (data.isTyping) {
        if (typingClearTimeoutRef.current) {
          clearTimeout(typingClearTimeoutRef.current);
        }

        typingClearTimeoutRef.current = setTimeout(() => {
          setIsFriendTyping(false);
        }, 2000);
      }
    };

    socket.on(SocketEvent.SERVER_RESPONSE_TYPING_TO_ROOM_CHAT, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_TYPING_TO_ROOM_CHAT, handler);
    };
  }, [roomChatId, userId]);

  const emitTyping = (isTyping: boolean) => {
    if (!roomChatId || !userId) {
      return;
    }

    socket.emit(SocketEvent.CLIENT_TYPING_TO_ROOM_CHAT, {
      roomChatId,
      userId,
      isTyping,
    });
  };

  const handleMessageChange = (nextValue: string) => {
    setMessage(nextValue);

    if (!roomChatId || !userId) {
      return;
    }

    if (nextValue.trim().length === 0) {
      emitTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    emitTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(false);
      typingTimeoutRef.current = null;
    }, 1200);
  };

  const sendMessage = ({
    content,
    images,
    clearInput = false,
  }: {
    content?: string;
    images?: string[];
    clearInput?: boolean;
  }) => {
    if (!roomChatId) {
      return;
    }

    const trimmedContent = content?.trim() ?? "";
    const nextImages = images || [];

    if (!trimmedContent && nextImages.length === 0) {
      return;
    }

    setIsSending(true);
    if (clearInput) {
      setMessage("");
    }
    setMessages((prev) => [
      ...prev,
      { content: trimmedContent, images: nextImages, userId, status: "sending" },
    ]);

    emitTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    socket.emit(SocketEvent.CLIENT_SEND_MESSAGE_TO_ROOM_CHAT, {
      roomChatId,
      userId,
      content: trimmedContent,
      images: nextImages,
    });

    setIsSending(false);
  };

  const handleSendMessage = () => {
    if (selectedImages.length === 0) {
      sendMessage({ content: message, clearInput: true });
      return;
    }

    const uploadAndSend = async () => {
      try {
        setIsUploadingImage(true);

        const response = await uploadMessageImages({
          accessToken,
          files: selectedImages,
        });

        const images = response.data?.data?.images || [];
        sendMessage({ content: message, images, clearInput: true });

        setSelectedImages([]);
        setImagePreviews([]);
      } catch {
        toast.error("Unable to upload images.");
      } finally {
        setIsUploadingImage(false);
      }
    };

    uploadAndSend();
  };

  const handleImagesSelected = (files: File[]) => {
    if (!files.length) {
      return;
    }

    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedImages((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...nextPreviews]);
  };

  const handleRemovePreview = (index: number) => {
    setSelectedImages((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
    setImagePreviews((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed);
      }
      return next;
    });
  };

  const handleMessageKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="p-6">
      <ChatHeader friend={friend} />
      <MessageList
        messages={messages}
        userId={userId}
        messagesEndRef={messagesEndRef}
      />

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
            Say hello to start the chat
          </h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Messages will appear here in real-time.
          </p>
        </Flex>
      )}

      <TypingIndicator isVisible={isFriendTyping} />
      <ImagePreviewList
        imagePreviews={imagePreviews}
        onRemove={handleRemovePreview}
      />
      <ChatInput
        message={message}
        onMessageChange={handleMessageChange}
        onMessageBlur={() => emitTyping(false)}
        onMessageKeyDown={handleMessageKeyDown}
        onImagesSelected={handleImagesSelected}
        onSend={handleSendMessage}
        isSending={isSending}
        isUploadingImage={isUploadingImage}
      />
    </Card>
  );
}

export default RoomChat;