import { useEffect, useMemo, useState } from "react";
import { Avatar, List } from "antd";
import { MessageOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { getCookie } from "@/helpers/cookies";
import { findRoomChatsByUserId } from "@/services/roomChat";
import { findUserById } from "@/services/user";
import type IUser from "@/interfaces/user.interface";

const formatUpdatedAt = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

type RoomChatUser = {
  userId: string;
  role: string;
};

type RoomChatItem = {
  _id: string;
  title: string;
  type: "friend" | "group";
  avatar: string;
  users: RoomChatUser[];
  updatedAt?: string;
};

function MessagesPage() {
  const navigate = useNavigate();
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");

  const [roomChats, setRoomChats] = useState<RoomChatItem[]>([]);
  const [friendByRoomId, setFriendByRoomId] = useState<Record<string, IUser>>(
    {}
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRoomChats = async () => {
      if (!accessToken || !userId) return;

      try {
        setLoading(true);
        const response = await findRoomChatsByUserId({ accessToken, userId });
        setRoomChats(response.data?.data?.roomChats || []);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomChats();
  }, [accessToken, userId]);

  useEffect(() => {
    const fetchFriendProfiles = async () => {
      if (!accessToken || !userId || roomChats.length === 0) return;

      const entries = await Promise.all(
        roomChats.map(async (room) => {
          if (room.type !== "friend") return null;

          const otherUserId = room.users.find((user) => user.userId !== userId)
            ?.userId;

          if (!otherUserId) return null;

          try {
            const response = await findUserById({
              accessToken,
              id: otherUserId,
            });
            return { roomId: room._id, user: response.data?.data as IUser };
          } catch {
            return null;
          }
        })
      );

      const nextMap: Record<string, IUser> = {};
      entries.forEach((entry) => {
        if (entry?.roomId && entry.user) {
          nextMap[entry.roomId] = entry.user;
        }
      });
      setFriendByRoomId(nextMap);
    };

    fetchFriendProfiles();
  }, [accessToken, roomChats, userId]);

  const conversationItems = useMemo(() => {
    return roomChats.map((room) => {
      const friend = friendByRoomId[room._id];
      const title =
        room.type === "group"
          ? room.title || "Group chat"
          : friend?.fullName || "Direct message";
      const subtitle =
        room.type === "group"
          ? `${room.users.length} members`
          : friend
          ? "Direct message"
          : "Assistant";

      return {
        room,
        friend,
        title,
        subtitle,
        updatedAt: formatUpdatedAt(room.updatedAt),
      };
    });
  }, [friendByRoomId, roomChats]);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Messages</h2>
      <List
        loading={loading}
        dataSource={conversationItems}
        locale={{ emptyText: "No conversations yet." }}
        renderItem={({ room, friend, title, subtitle, updatedAt }) => (
          <List.Item
            key={room._id}
            className="cursor-pointer"
            onClick={() =>
              navigate(`/room-chat/${room._id}`, {
                state: friend ? { friend } : undefined,
              })
            }
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  src={friend?.avatar || room.avatar}
                  icon={
                    room.type === "group" ? (
                      <TeamOutlined />
                    ) : friend?.avatar ? undefined : (
                      <UserOutlined />
                    )
                  }
                />
              }
              title={
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{title}</span>
                  {room.type === "group" && (
                    <TeamOutlined className="text-gray-400" />
                  )}
                  {room.type === "friend" && (
                    <MessageOutlined className="text-gray-400" />
                  )}
                </div>
              }
              description={
                <div className="text-gray-500 text-sm flex flex-col">
                  <span>{subtitle}</span>
                  {updatedAt && <span>{updatedAt}</span>}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}

export default MessagesPage;
