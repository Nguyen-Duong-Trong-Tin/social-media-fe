import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { socket } from "@/services/socket";
import SocketEvent from "@/enums/socketEvent.enum";
import NotificationType from "@/enums/notification.enum";
import { getCookie } from "@/helpers/cookies";
import {
  getUnreadNotificationCounts,
  markNotificationsRead,
} from "@/services/notification";

type NotificationCounts = {
  total: number;
  messages: number;
  friendRequests: number;
};

type NotificationContextValue = {
  counts: NotificationCounts;
  refreshCounts: () => Promise<void>;
  setActiveRoomChatId: (roomChatId: string | null) => void;
  markMessagesRead: (roomChatId: string) => Promise<void>;
  markFriendRequestsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const defaultCounts: NotificationCounts = {
  total: 0,
  messages: 0,
  friendRequests: 0,
};

export function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [counts, setCounts] = useState<NotificationCounts>(defaultCounts);
  const [activeRoomChatId, setActiveRoomChatId] = useState<string | null>(null);

  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");

  const refreshCounts = useCallback(async () => {
    if (!accessToken || !userId) return;
    try {
      const response = await getUnreadNotificationCounts({
        accessToken,
        userId,
      });

      const data = response.data?.data;
      setCounts({
        total: data?.total ?? 0,
        messages: data?.byType?.message ?? 0,
        friendRequests: data?.byType?.friend_request ?? 0,
      });
    } catch {
      setCounts(defaultCounts);
    }
  }, [accessToken, userId]);

  const markMessagesRead = useCallback(
    async (roomChatId: string) => {
      if (!accessToken || !userId || !roomChatId) return;
      try {
        await markNotificationsRead({
          accessToken,
          userId,
          type: NotificationType.message,
          roomChatId,
        });
        await refreshCounts();
      } catch {
        return;
      }
    },
    [accessToken, userId, refreshCounts]
  );

  const markFriendRequestsRead = useCallback(async () => {
    if (!accessToken || !userId) return;
    try {
      await markNotificationsRead({
        accessToken,
        userId,
        type: NotificationType.friend_request,
      });
      await refreshCounts();
    } catch {
      return;
    }
  }, [accessToken, userId, refreshCounts]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    if (!userId) return;

    const handler = (payload: {
      userId: string;
      type: NotificationType;
      data?: { roomChatId?: string };
    }) => {
      if (payload.userId !== userId) return;

      if (
        payload.type === NotificationType.message &&
        payload.data?.roomChatId &&
        payload.data.roomChatId === activeRoomChatId
      ) {
        return;
      }

      setCounts((prev) => {
        const next = { ...prev };
        next.total += 1;

        if (payload.type === NotificationType.message) {
          next.messages += 1;
        }

        if (payload.type === NotificationType.friend_request) {
          next.friendRequests += 1;
        }

        return next;
      });
    };

    socket.on(SocketEvent.SERVER_PUSH_NOTIFICATION, handler);

    return () => {
      socket.off(SocketEvent.SERVER_PUSH_NOTIFICATION, handler);
    };
  }, [activeRoomChatId, userId]);

  const value = useMemo(
    () => ({
      counts,
      refreshCounts,
      setActiveRoomChatId,
      markMessagesRead,
      markFriendRequestsRead,
    }),
    [counts, refreshCounts, markFriendRequestsRead, markMessagesRead]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
