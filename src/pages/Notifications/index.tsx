import { useEffect, useState } from "react";
import { List, Tag } from "antd";

import { getCookie } from "@/helpers/cookies";
import NotificationType from "@/enums/notification.enum";
import { findNotifications, markNotificationsRead } from "@/services/notification";
import { useNotifications } from "@/contexts/NotificationContext";

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
};

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const { refreshCounts } = useNotifications();

  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!accessToken || !userId) return;

      const response = await findNotifications({
        accessToken,
        userId,
        limit: 50,
      });

      setItems(response.data?.data?.items || []);
    };

    fetchNotifications();
  }, [accessToken, userId]);

  useEffect(() => {
    const markAllRead = async () => {
      if (!accessToken || !userId) return;

      await markNotificationsRead({ accessToken, userId });
      await refreshCounts();
    };

    markAllRead();
  }, [accessToken, userId, refreshCounts]);

  const renderTypeTag = (type: NotificationType) => {
    if (type === NotificationType.message) return <Tag color="blue">Message</Tag>;
    if (type === NotificationType.friend_request)
      return <Tag color="green">Friend request</Tag>;
    if (type === NotificationType.friend_accept)
      return <Tag color="cyan">Accepted</Tag>;
    if (type === NotificationType.friend_reject)
      return <Tag color="red">Rejected</Tag>;
    return <Tag>Notification</Tag>;
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <List
        itemLayout="vertical"
        dataSource={items}
        locale={{ emptyText: "No notifications yet." }}
        renderItem={(item) => (
          <List.Item key={item._id}>
            <div className="flex items-start gap-3">
              {renderTypeTag(item.type)}
              <div>
                <div className="font-semibold">{item.title}</div>
                <div className="text-gray-600">{item.message}</div>
              </div>
              {!item.isRead && (
                <span className="ml-auto text-xs text-blue-600">Unread</span>
              )}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
}

export default NotificationsPage;
