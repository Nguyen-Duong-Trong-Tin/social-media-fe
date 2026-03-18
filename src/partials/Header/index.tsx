import { Badge, Button, Input } from "antd";
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { BellOutlined, SearchOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { deleteCookie, getCookie } from "@/helpers/cookies";
import { useNotifications } from "@/contexts/NotificationContext";
import NotificationType from "@/enums/notification.enum";
import {
  findNotifications,
  markNotificationsRead,
} from "@/services/notification";
import {
  approveJoinRequestGroup,
  rejectJoinRequestGroup,
} from "@/services/group";
import { userFindUserByIds } from "@/services/user";
import type { IUser } from "@/interfaces/user.interface";

import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const userSlug = getCookie("userSlug");
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");
  const [searchText, setSearchText] = useState("");
  const { counts, refreshCounts } = useNotifications();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    {
      _id: string;
      title: string;
      message: string;
      type: NotificationType;
      isRead: boolean;
      createdAt: string;
      data?: {
        roomChatId?: string;
        fromUserId?: string;
        groupId?: string;
        groupSlug?: string;
        requesterId?: string;
      };
    }[]
  >([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [senderById, setSenderById] = useState<Record<string, IUser>>({});

  const navigateToHome = () => {
    navigate("/");
  };

  const navigateToMyProfile = () => {
    navigate(`/profile/${userSlug}`);
  };

  const navigateToMyGroups = () => {
    navigate(`/my-groups`);
  };

  const navigateToFriends = () => {
    navigate(`/friends`);
  };

  const handleLogout = () => {
    deleteCookie("userId");
    deleteCookie("userSlug");
    deleteCookie("accessToken");
    deleteCookie("refreshToken");

    navigate("/login");
  };

  const handleSearch = () => {
    const query = searchText.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const fetchNotifications = async () => {
    if (!accessToken || !userId) return;

    try {
      setNotificationsLoading(true);
      const response = await findNotifications({
        accessToken,
        userId,
        limit: 8,
      });
      setNotifications(response.data?.data?.items || []);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleNotificationsOpen = async (open: boolean) => {
    setIsNotificationsOpen(open);
    if (!open || !accessToken || !userId) return;

    await fetchNotifications();
    try {
      await markNotificationsRead({ accessToken, userId });
      await refreshCounts();
    } catch {
      return;
    }
  };

  const handleNotificationClick = (item: {
    type: NotificationType;
    data?: {
      roomChatId?: string;
      fromUserId?: string;
      groupId?: string;
      groupSlug?: string;
      requesterId?: string;
    };
  }) => {
    if (item.type === NotificationType.group_request && item.data?.groupSlug) {
      setIsNotificationsOpen(false);
      navigate(`/group-profile/${item.data.groupSlug}`);
      return;
    }

    if (item.type !== NotificationType.message) {
      return;
    }

    const roomChatId = item.data?.roomChatId;
    if (!roomChatId) {
      return;
    }

    const sender = item.data?.fromUserId
      ? senderById[item.data.fromUserId]
      : undefined;

    setIsNotificationsOpen(false);
    navigate(`/room-chat/${roomChatId}`, {
      state: sender ? { friend: sender } : undefined,
    });
  };

  const handleGroupRequestAction = async ({
    notificationId,
    action,
    groupId,
    requesterId,
  }: {
    notificationId: string;
    action: "approve" | "reject";
    groupId?: string;
    requesterId?: string;
  }) => {
    if (!accessToken || !userId || !groupId || !requesterId) return;

    try {
      if (action === "approve") {
        await approveJoinRequestGroup({
          accessToken,
          id: groupId,
          adminId: userId,
          userId: requesterId,
        });
        toast.success("Request approved.");
      } else {
        await rejectJoinRequestGroup({
          accessToken,
          id: groupId,
          adminId: userId,
          userId: requesterId,
        });
        toast.success("Request rejected.");
      }

      setNotifications((prev) =>
        prev.filter((notification) => notification._id !== notificationId)
      );
      await refreshCounts();
    } catch {
      toast.error("Failed to update request.");
    }
  };

  const senderNameById = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(senderById).forEach(([id, user]) => {
      map[id] = user.fullName || "";
    });
    return map;
  }, [senderById]);

  const notificationItems = useMemo(() => {
    return notifications.map((item) => ({
      ...item,
      time: new Date(item.createdAt).toLocaleString(),
    }));
  }, [notifications]);

  useEffect(() => {
    const fetchSenders = async () => {
      if (!accessToken || notifications.length === 0) {
        return;
      }

      const senderIds = Array.from(
        new Set(
          notifications
            .filter(
              (item) =>
                item.type === NotificationType.message ||
                item.type === NotificationType.group_request
            )
            .map((item) =>
              item.type === NotificationType.group_request
                ? item.data?.requesterId
                : item.data?.fromUserId
            )
            .filter((id): id is string => Boolean(id))
        )
      ).filter((id) => !senderById[id]);

      if (!senderIds.length) {
        return;
      }

      try {
        const responseUsers = await userFindUserByIds({
          accessToken,
          ids: senderIds,
        });
        const users = responseUsers?.data?.data || [];
        const nextMap: Record<string, IUser> = { ...senderById };
        users.forEach((user: IUser) => {
          const key = user._id || (user as { id?: string }).id;
          if (key) {
            nextMap[key] = user;
          }
        });
        setSenderById(nextMap);
      } catch {
        return;
      }
    };

    fetchSenders();
  }, [accessToken, notifications, senderById]);

  return (
    <header className="header-container">
      {/* Logo */}
      <div className="header-logo" onClick={navigateToHome}>
        <div className="header-logo-icon" />
        <span className="header-logo-text">EduS</span>
      </div>

      {/* Search */}
      <div className="header-search">
        <Input
          placeholder="Search people, groups..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={handleSearch}
        />
      </div>

      {/* Menu */}
      <nav className="header-nav">
        <a className="header-nav-link" onClick={navigateToHome}>
          Home
        </a>
        <a className="header-nav-link" onClick={navigateToMyProfile}>
          Me
        </a>
        <a className="header-nav-link" onClick={navigateToMyGroups}>
          Groups
        </a>
        <a className="header-nav-link" onClick={navigateToFriends}>
          Friends
        </a>
      </nav>

      <div className="header-actions">
        <div className="header-notifications">
          <Badge count={counts.total} size="small" offset={[-2, 2]}>
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => handleNotificationsOpen(!isNotificationsOpen)}
              aria-label="Notifications"
            >
              <BellOutlined />
            </button>
          </Badge>
          {isNotificationsOpen && (
            <div className="header-notifications-popover">
              <div className="header-notifications-header">
                <span>Notifications</span>
                <button
                  type="button"
                  className="header-notifications-close"
                  onClick={() => handleNotificationsOpen(false)}
                  aria-label="Close notifications"
                >
                  x
                </button>
              </div>
              <div className="header-notifications-body">
                {notificationsLoading && (
                  <div className="header-notifications-empty">
                    Loading...
                  </div>
                )}
                {!notificationsLoading && notificationItems.length === 0 && (
                  <div className="header-notifications-empty">
                    No notifications yet.
                  </div>
                )}
                {!notificationsLoading &&
                  notificationItems.map((item) => (
                    <div
                      key={item._id}
                      className={
                        item.isRead
                          ? item.type === NotificationType.message
                            ? "header-notifications-item clickable"
                            : "header-notifications-item"
                          : item.type === NotificationType.message
                          ? "header-notifications-item unread clickable"
                          : "header-notifications-item unread"
                      }
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="header-notifications-title">
                        {item.title}
                      </div>
                      <div className="header-notifications-message">
                        {item.type === NotificationType.message &&
                        item.data?.fromUserId ? (
                          <>
                            <span className="header-notifications-sender">
                              {senderNameById[item.data.fromUserId] ||
                                "Someone"}
                            </span>
                            {` ${item.message}`}
                          </>
                        ) : item.type === NotificationType.group_request &&
                          item.data?.requesterId ? (
                          (() => {
                            const requester =
                              senderById[item.data?.requesterId ?? ""];
                            const requesterName =
                              requester?.fullName || "Someone";
                            const requesterSlug = requester?.slug;
                            const remainder = item.message.startsWith(
                              requesterName
                            )
                              ? item.message.slice(requesterName.length)
                              : ` requested to join your group.`;

                            return (
                              <>
                                <button
                                  type="button"
                                  className="header-notifications-sender"
                                  style={{
                                    cursor: requesterSlug ? "pointer" : "default",
                                    textDecoration: requesterSlug ? "underline" : "none",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (!requesterSlug) return;
                                    setIsNotificationsOpen(false);
                                    navigate(`/profile/${requesterSlug}`);
                                  }}
                                >
                                  {requesterName}
                                </button>
                                {remainder}
                              </>
                            );
                          })()
                        ) : (
                          item.message
                        )}
                      </div>
                      <div className="header-notifications-time">
                        {item.time}
                      </div>
                      {item.type === NotificationType.group_request && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="small"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleGroupRequestAction({
                                notificationId: item._id,
                                action: "reject",
                                groupId: item.data?.groupId,
                                requesterId: item.data?.requesterId,
                              });
                            }}
                          >
                            Reject
                          </Button>
                          <Button
                            size="small"
                            type="primary"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleGroupRequestAction({
                                notificationId: item._id,
                                action: "approve",
                                groupId: item.data?.groupId,
                                requesterId: item.data?.requesterId,
                              });
                            }}
                          >
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <Button className="header-logout-btn" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}

export default Header;

