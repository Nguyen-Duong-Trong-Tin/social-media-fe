import { toast } from "react-toastify";
import { useEffect, useState } from "react";

import { socket } from "@/services/socket";
import { getCookie } from "@/helpers/cookies";
import { findUserById, findUsers } from "@/services/user";
import SocketEvent from "@/enums/socketEvent.enum";
import type { IUser } from "@/interfaces/user.interface";
import { useNotifications } from "@/contexts/NotificationContext";
import type {
  ServerResponseRejectFriendRequest,
  ServerResponseAcceptFriendRequest,
  ServerResponseDeleteFriendAccept,
  ServerResponseDeleteFriend,
  ServerResponseSendFriendRequest,
} from "@/dtos/dtos/user.dto";
import FriendRequestsList from "@/pages/Friends/FriendRequestsList";
import FriendAcceptsList from "@/pages/Friends/FriendAcceptsList";
import FriendsList from "@/pages/Friends/FriendsList";
import PeopleYouMayKnowList from "@/pages/Friends/PeopleYouMayKnowList";

function FriendsPage() {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");
  const { markFriendRequestsRead } = useNotifications();

  const [reload, setReload] = useState(false);
  const [friendRequests, setFriendRequests] = useState<IUser[]>([]);
  const [friendAccepts, setFriendAccepts] = useState<IUser[]>([]);
  const [friends, setFriends] = useState<
    { user: IUser; roomChatId: string }[]
  >([]);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState<IUser[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const responseUser = await findUserById({ accessToken, id: userId });

        const friendRequestIds = responseUser.data.data.friendRequests ?? [];
        const friendRequests: IUser[] = [];
        for (const friendRequestId of friendRequestIds) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friendRequestId });
          friendRequests.push(data);
        }

        const friendAcceptIds = responseUser.data.data.friendAccepts ?? [];
        const friendAccepts: IUser[] = [];
        for (const friendAcceptId of friendAcceptIds) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friendAcceptId });
          friendAccepts.push(data);
        }

        const friendItems = responseUser.data.data.friends ?? [];
        const friends: { user: IUser; roomChatId: string }[] = [];
        for (const friend of friendItems) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friend.userId });
          friends.push({ user: data, roomChatId: friend.roomChatId });
        }

        setPeopleLoading(true);
        const excludedIds = [
          userId,
          ...friendRequestIds,
          ...friendAcceptIds,
          ...friendItems.map((friend: { userId: string }) => friend.userId),
        ].filter(Boolean);

        const {
          data: {
            data: { users },
          },
        } = await findUsers({
          accessToken,
          page: 1,
          limit: 12,
          filter: {
            notInIds: JSON.stringify(excludedIds),
          },
        });

        setFriendRequests(friendRequests);
        setFriendAccepts(friendAccepts);
        setFriends(friends);
        setPeopleYouMayKnow(users.items);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setPeopleLoading(false);
      }
    };
    fetchApi();
  }, [accessToken, userId, reload]);

  useEffect(() => {
    markFriendRequestsRead();
  }, [markFriendRequestsRead]);

  useEffect(() => {
    const handler = (data: ServerResponseRejectFriendRequest) => {
      console.log("reject");
      console.log(userId);
      console.log(data);
      if (!(userId === data.userId || userId === data.userRequestId)) {
        return;
      }

      setReload((prev) => !prev);
    };

    socket.on(SocketEvent.SERVER_RESPONSE_REJECT_FRIEND_REQUEST, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_REJECT_FRIEND_REQUEST, handler);
    };
  }, [userId]);

  useEffect(() => {
    const handler = (data: ServerResponseAcceptFriendRequest) => {
      if (!(userId === data.userId || userId === data.userRequestId)) {
        return;
      }

      setReload((prev) => !prev);
    };

    socket.on(SocketEvent.SERVER_RESPONSE_ACCEPT_FRIEND_REQUEST, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_ACCEPT_FRIEND_REQUEST, handler);
    };
  }, [userId]);

  useEffect(() => {
    const handler = (data: ServerResponseSendFriendRequest) => {
      if (!(userId === data.userId || userId === data.userRequestId)) {
        return;
      }

      setReload((prev) => !prev);
    };

    socket.on(SocketEvent.SERVER_RESPONSE_SEND_FRIEND_REQUEST, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_SEND_FRIEND_REQUEST, handler);
    };
  }, [userId]);

  useEffect(() => {
    const handler = (data: ServerResponseDeleteFriendAccept) => {
      if (!(userId === data.userId || userId === data.userRequestId)) {
        return;
      }

      setReload((prev) => !prev);
    };

    socket.on(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND_ACCEPT, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND_ACCEPT, handler);
    };
  }, [userId]);

  useEffect(() => {
    const handler = (data: ServerResponseDeleteFriend) => {
      if (!(userId === data.userId || userId === data.userRequestId)) {
        return;
      }

      setReload((prev) => !prev);
    };

    socket.on(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_DELETE_FRIEND, handler);
    };
  }, [userId]);

  const handleRejectFriendRequest = (userRequestId: string) => {
    socket.emit(SocketEvent.CLIENT_REJECT_FRIEND_REQUEST, {
      userId,
      userRequestId: userRequestId,
    });

    toast.success("Rejected friend request successfully");
  };

  const handleAcceptFriendRequest = (userRequestId: string) => {
    socket.emit(SocketEvent.CLIENT_ACCEPT_FRIEND_REQUEST, {
      userId,
      userRequestId: userRequestId,
    });

    toast.success("Accepted friend request successfully");
  };

  const handleDeleteFriendAccept = (userRequestId: string) => {
    socket.emit(SocketEvent.CLIENT_DELETE_FRIEND_ACCEPT, {
      userId,
      userRequestId: userRequestId,
    });

    toast.success("Deleted friend accept successfully");
  };

  const handleSendFriendRequest = (userRequestId: string) => {
    socket.emit(SocketEvent.CLIENT_SEND_FRIEND_REQUEST, {
      userId,
      userRequestId: userRequestId,
    });

    toast.success("Sent invitation successfully");
  };

  return (
    <>
      <FriendRequestsList
        friendRequests={friendRequests}
        onAccept={handleAcceptFriendRequest}
        onReject={handleRejectFriendRequest}
      />

      <FriendAcceptsList
        friendAccepts={friendAccepts}
        onDelete={handleDeleteFriendAccept}
      />

      <FriendsList friends={friends} />

      <PeopleYouMayKnowList
        people={peopleYouMayKnow}
        loading={peopleLoading}
        onSendInvitation={handleSendFriendRequest}
      />
    </>
  );
}

export default FriendsPage;

