import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Avatar, Flex } from "antd";
import { toast } from "react-toastify";
import {
  CaretDownOutlined,
  CaretRightOutlined,
  PushpinFilled,
  UserOutlined,
} from "@ant-design/icons";

import { Card } from "@/components/ui/card";
import { socket } from "@/services/socket";
import { getCookie } from "@/helpers/cookies";
import { useNotifications } from "@/contexts/NotificationContext";
import {
  findMessages,
  uploadMessageImages,
  uploadMessageMaterials,
  uploadMessageVideos,
} from "@/services/message";
import { findRoomChatsByUserId } from "@/services/roomChat";
import { findUserById, userFindUserByIds } from "@/services/user";
import SocketEvent from "@/enums/socketEvent.enum";
import type IMessage from "@/interfaces/message.interface";
import type IUser from "@/interfaces/user.interface";
import type {
  ServerResponseMessageToRoomChatDto,
  ServerResponseDeleteMessageDto,
  ServerResponsePinMessageDto,
  ServerResponseTypingToRoomChatDto,
} from "@/dtos/dtos/message.dto";
import type ChatMessage from "@/interfaces/chatMessage.interface";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import ImagePreviewList from "./ImagePreviewList";
import VideoPreviewList from "./VideoPreviewList";
import MaterialPreviewList from "./MaterialPreviewList";
import ChatInput from "./ChatInput";

type RoomChatUser = {
  userId: string;
  role: string;
};

type RoomChatItem = {
  _id: string;
  users: RoomChatUser[];
};

function RoomChat() {
  const { roomChatId } = useParams();
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");
  const location = useLocation();
  const friend = (location.state as { friend?: IUser } | null)?.friend;
  const { markMessagesRead, setActiveRoomChatId } = useNotifications();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const imagePreviewsRef = useRef<string[]>([]);
  const videoPreviewsRef = useRef<string[]>([]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userById, setUserById] = useState<Record<string, IUser>>({});
  const [roomChatUserIds, setRoomChatUserIds] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<File[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [materialPreviews, setMaterialPreviews] = useState<string[]>([]);
  const [isPinnedOpen, setIsPinnedOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setActiveRoomChatId(roomChatId || null);
    if (roomChatId) {
      markMessagesRead(roomChatId);
    }

    return () => {
      setActiveRoomChatId(null);
    };
  }, [markMessagesRead, roomChatId, setActiveRoomChatId]);

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
            _id: item._id,
            content: item.content || "",
            images: item.images,
            videos: item.videos,
            materials: item.materials,
            userId: item.userId || "",
            pinned: item.pinned,
            pinnedBy: item.pinnedBy,
            pinnedAt: item.pinnedAt || null,
            createdAt: item.createdAt,
            deleted: item.deleted,
          }))
        );
      } catch {
        toast.error("Unable to load messages.");
      }
    };

    fetchApi();
  }, [accessToken, roomChatId]);

  const pinnedMessages = messages.filter((item) => item.pinned && !item.deleted);
  const hasPinned = pinnedMessages.length > 0;

  const describePinnedMessage = (item: ChatMessage) => {
    const trimmed = item.content?.trim();
    if (trimmed) {
      return trimmed;
    }

    const imageCount = item.images?.length || 0;
    const videoCount = item.videos?.length || 0;
    const materialCount = item.materials?.length || 0;
    const parts: string[] = [];

    if (imageCount) parts.push(`${imageCount} image${imageCount > 1 ? "s" : ""}`);
    if (videoCount) parts.push(`${videoCount} video${videoCount > 1 ? "s" : ""}`);
    if (materialCount) parts.push(`${materialCount} file${materialCount > 1 ? "s" : ""}`);

    return parts.length ? `Attachment: ${parts.join(", ")}` : "Pinned message";
  };

  const registerMessageRef = (messageId: string, node: HTMLDivElement | null) => {
    messageRefs.current[messageId] = node;
  };

  const handleJumpToMessage = (messageId: string) => {
    const target = messageRefs.current[messageId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  useEffect(() => {
    const fetchMissingUsers = async () => {
      if (!accessToken || messages.length === 0) {
        return;
      }

      const missingIds = Array.from(
        new Set(messages.map((item) => item.userId))
      ).filter((id) => id && !userById[id]);

      if (!missingIds.length) {
        return;
      }

      try {
        const responseUsers = await userFindUserByIds({
          accessToken,
          ids: missingIds,
        });
        const users = responseUsers?.data?.data || [];
        const nextMap: Record<string, IUser> = { ...userById };
        users.forEach((user: IUser) => {
          const key = user._id || (user as { id?: string }).id;
          if (key) {
            nextMap[key] = user;
          }
        });
        setUserById(nextMap);
      } catch {
        // ignore - fallback to unknown
      }
    };

    fetchMissingUsers();
  }, [accessToken, messages, userById]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken || !userId) {
        return;
      }

      const nextMap: Record<string, IUser> = {};

      try {
        const responseMe = await findUserById({ accessToken, id: userId });
        if (responseMe?.data?.data?._id) {
          nextMap[responseMe.data.data._id] = responseMe.data.data as IUser;
        }
      } catch {
        // ignore, fallback to unknown user
      }

      if (friend?._id) {
        nextMap[friend._id] = friend;
      }

      if (Object.keys(nextMap).length > 0) {
        setUserById(nextMap);
      }
    };

    fetchUsers();
  }, [accessToken, friend, userId]);

  useEffect(() => {
    const fetchRoomChatUsers = async () => {
      if (!accessToken || !userId || !roomChatId) {
        return;
      }

      try {
        const response = await findRoomChatsByUserId({ accessToken, userId });
        const roomChats: RoomChatItem[] = response.data?.data?.roomChats || [];
        const room = roomChats.find((item) => item._id === roomChatId);
        const ids = room?.users
          ?.map((user) => user.userId)
          .filter((id): id is string => Boolean(id)) || [];
        setRoomChatUserIds(ids);
      } catch {
        setRoomChatUserIds([]);
      }
    };

    fetchRoomChatUsers();
  }, [accessToken, roomChatId, userId]);

  useEffect(() => {
    const fetchRoomChatUserProfiles = async () => {
      if (!accessToken || roomChatUserIds.length === 0) {
        return;
      }

      const missingIds = roomChatUserIds.filter(
        (id) => id && !userById[id]
      );

      if (!missingIds.length) {
        return;
      }

      try {
        const responseUsers = await userFindUserByIds({
          accessToken,
          ids: missingIds,
        });
        const users = responseUsers?.data?.data || [];
        const nextMap: Record<string, IUser> = { ...userById };
        users.forEach((user: IUser) => {
          const key = user._id || (user as { id?: string }).id;
          if (key) {
            nextMap[key] = user;
          }
        });
        setUserById(nextMap);
      } catch {
        // ignore - fallback to unknown
      }
    };

    fetchRoomChatUserProfiles();
  }, [accessToken, roomChatUserIds, userById]);

  const mentionCandidates = useMemo(() => {
    return roomChatUserIds
      .filter((id) => id && id !== userId)
      .map((id) => userById[id])
      .filter(Boolean)
      .map((user) => ({
        id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
      }));
  }, [roomChatUserIds, userById, userId]);

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
                JSON.stringify(data.images || []) &&
              JSON.stringify(item.videos || []) ===
                JSON.stringify(data.videos || []) &&
              JSON.stringify(item.materials || []) ===
                JSON.stringify(data.materials || [])
          );
          if (index !== -1) {
            const next = [...prev];
            next[index] = {
              _id: data._id,
              content: data.content,
              images: data.images,
              videos: data.videos,
              materials: data.materials,
              userId: data.userId,
              pinned: data.pinned,
              pinnedBy: data.pinnedBy,
              pinnedAt: data.pinnedAt,
              createdAt: data.createdAt,
              deleted: data.deleted,
            };
            return next;
          }
        }

        return [
          ...prev,
          {
            _id: data._id,
            content: data.content,
            images: data.images,
            videos: data.videos,
            materials: data.materials,
            userId: data.userId,
            pinned: data.pinned,
            pinnedBy: data.pinnedBy,
            pinnedAt: data.pinnedAt,
            createdAt: data.createdAt,
            deleted: data.deleted,
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
    const handler = (data: ServerResponseDeleteMessageDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item._id === data.messageId
            ? {
                ...item,
                deleted: data.deleted,
                pinned: false,
                pinnedBy: "",
                pinnedAt: null,
              }
            : item
        )
      );
    };

    socket.on(SocketEvent.SERVER_RESPONSE_DELETE_MESSAGE, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_DELETE_MESSAGE, handler);
    };
  }, [roomChatId]);

  useEffect(() => {
    const handler = (data: ServerResponsePinMessageDto) => {
      if (!roomChatId || data.roomChatId !== roomChatId) {
        return;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item._id === data.messageId
            ? {
                ...item,
                pinned: data.pinned,
                pinnedBy: data.pinnedBy,
                pinnedAt: data.pinnedAt,
              }
            : item
        )
      );
    };

    socket.on(SocketEvent.SERVER_RESPONSE_PIN_MESSAGE, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_PIN_MESSAGE, handler);
    };
  }, [roomChatId]);

  useEffect(() => {
    imagePreviewsRef.current = imagePreviews;
  }, [imagePreviews]);

  useEffect(() => {
    videoPreviewsRef.current = videoPreviews;
  }, [videoPreviews]);

  useEffect(() => {
    return () => {
      imagePreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
      videoPreviewsRef.current.forEach((url) => URL.revokeObjectURL(url));
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

  const handleTogglePin = (messageId: string, pinned: boolean) => {
    if (!roomChatId || !userId) {
      return;
    }

    socket.emit(SocketEvent.CLIENT_TOGGLE_PIN_MESSAGE, {
      roomChatId,
      userId,
      messageId,
      pinned,
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!roomChatId || !userId) {
      return;
    }

    socket.emit(SocketEvent.CLIENT_DELETE_MESSAGE, {
      roomChatId,
      userId,
      messageId,
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
    videos,
    materials,
    clearInput = false,
  }: {
    content?: string;
    images?: string[];
    videos?: string[];
    materials?: string[];
    clearInput?: boolean;
  }) => {
    if (!roomChatId) {
      return;
    }

    const trimmedContent = content?.trim() ?? "";
    const nextImages = images || [];
    const nextVideos = videos || [];
    const nextMaterials = materials || [];

    if (
      !trimmedContent &&
      nextImages.length === 0 &&
      nextVideos.length === 0 &&
      nextMaterials.length === 0
    ) {
      return;
    }

    setIsSending(true);
    if (clearInput) {
      setMessage("");
    }
    setMessages((prev) => [
      ...prev,
      {
        content: trimmedContent,
        images: nextImages,
        videos: nextVideos,
        materials: nextMaterials,
        userId,
        status: "sending",
      },
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
      videos: nextVideos,
      materials: nextMaterials,
    });

    setIsSending(false);
  };

  const handleSendMessage = () => {
    if (
      isSending ||
      isUploadingImage ||
      isUploadingVideo ||
      isUploadingMaterial
    ) {
      return;
    }

    if (
      selectedImages.length === 0 &&
      selectedVideos.length === 0 &&
      selectedMaterials.length === 0
    ) {
      sendMessage({ content: message, clearInput: true });
      return;
    }

    const uploadAndSend = async () => {
      try {
        setIsSending(true);
        setIsUploadingImage(selectedImages.length > 0);
        setIsUploadingVideo(selectedVideos.length > 0);
        setIsUploadingMaterial(selectedMaterials.length > 0);

        const [imagesResponse, videosResponse, materialsResponse] = await Promise.all([
          selectedImages.length > 0
            ? uploadMessageImages({ accessToken, files: selectedImages })
            : Promise.resolve(null),
          selectedVideos.length > 0
            ? uploadMessageVideos({ accessToken, files: selectedVideos })
            : Promise.resolve(null),
          selectedMaterials.length > 0
            ? uploadMessageMaterials({ accessToken, files: selectedMaterials })
            : Promise.resolve(null),
        ]);

        const images = imagesResponse?.data?.data?.images || [];
        const videos = videosResponse?.data?.data?.videos || [];
        const materials = materialsResponse?.data?.data?.materials || [];
        sendMessage({ content: message, images, videos, materials, clearInput: true });

        setSelectedImages([]);
        setSelectedVideos([]);
        setSelectedMaterials([]);
        setImagePreviews([]);
        setVideoPreviews([]);
        setMaterialPreviews([]);
      } catch {
        toast.error("Unable to upload media.");
      } finally {
        setIsSending(false);
        setIsUploadingImage(false);
        setIsUploadingVideo(false);
        setIsUploadingMaterial(false);
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

  const handleVideosSelected = (files: File[]) => {
    if (!files.length) {
      return;
    }

    const nextPreviews = files.map((file) => URL.createObjectURL(file));
    setSelectedVideos((prev) => [...prev, ...files]);
    setVideoPreviews((prev) => [...prev, ...nextPreviews]);
  };

  const handleMaterialsSelected = (files: File[]) => {
    if (!files.length) {
      return;
    }

    setSelectedMaterials((prev) => [...prev, ...files]);
    setMaterialPreviews((prev) => [...prev, ...files.map((file) => file.name)]);
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

  const handleRemoveVideoPreview = (index: number) => {
    setSelectedVideos((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
    setVideoPreviews((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed);
      }
      return next;
    });
  };

  const handleRemoveMaterialPreview = (index: number) => {
    setSelectedMaterials((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
    setMaterialPreviews((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index)
    );
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
      {hasPinned && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/90 to-amber-100/60 p-3">
          <button
            type="button"
            onClick={() => setIsPinnedOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-3"
            aria-expanded={isPinnedOpen}
            aria-controls="pinned-messages-panel"
          >
            <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold">
              <PushpinFilled />
              <span>Pinned messages</span>
              <span className="text-amber-700/80 font-medium">
                ({pinnedMessages.length})
              </span>
            </div>
            <span className="text-amber-700">
              {isPinnedOpen ? <CaretDownOutlined /> : <CaretRightOutlined />}
            </span>
          </button>

          {isPinnedOpen && (
            <div
              id="pinned-messages-panel"
              className="mt-3 max-h-56 overflow-y-auto rounded-lg bg-white/80 p-2"
            >
              <div className="flex flex-col gap-2 text-sm text-gray-700">
                {pinnedMessages.map((item, index) => (
                  <button
                    key={item._id || `${item.userId}-${index}`}
                    type="button"
                    className="text-left rounded-md px-2 py-1 hover:bg-amber-100/60 hover:text-amber-900 transition"
                    onClick={() => item._id && handleJumpToMessage(item._id)}
                  >
                    {describePinnedMessage(item)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <MessageList
        messages={messages}
        userId={userId}
        messagesEndRef={messagesEndRef}
        userById={userById}
        mentionUsers={Object.values(userById)}
        showSenderName
        onTogglePin={handleTogglePin}
        onDeleteMessage={handleDeleteMessage}
        registerMessageRef={registerMessageRef}
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
      <VideoPreviewList
        videoPreviews={videoPreviews}
        onRemove={handleRemoveVideoPreview}
      />
      <MaterialPreviewList
        materials={materialPreviews}
        onRemove={handleRemoveMaterialPreview}
      />
      <ChatInput
        message={message}
        onMessageChange={handleMessageChange}
        onMessageBlur={() => emitTyping(false)}
        onMessageKeyDown={handleMessageKeyDown}
        onImagesSelected={handleImagesSelected}
        onVideosSelected={handleVideosSelected}
        onMaterialsSelected={handleMaterialsSelected}
        onSend={handleSendMessage}
        isSending={isSending}
        isUploadingImage={isUploadingImage}
        isUploadingVideo={isUploadingVideo}
        isUploadingMaterial={isUploadingMaterial}
        mentionCandidates={mentionCandidates}
        enableMentions
      />
    </Card>
  );
}

export default RoomChat;