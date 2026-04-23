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
import FriendAround from "@/pages/Friends/FriendAround";

const SECTION_LIMIT_STEP = 12;

function FriendsPage() {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");
  const { markFriendRequestsRead } = useNotifications();

  const [reload, setReload] = useState(false);
  const [friendRequests, setFriendRequests] = useState<IUser[]>([]);
  const [friendAccepts, setFriendAccepts] = useState<IUser[]>([]);
  const [friends, setFriends] = useState<{ user: IUser; roomChatId: string }[]>(
    [],
  );
  const [friendRequestsTotal, setFriendRequestsTotal] = useState(0);
  const [friendAcceptsTotal, setFriendAcceptsTotal] = useState(0);
  const [friendsTotal, setFriendsTotal] = useState(0);
  const [peopleTotal, setPeopleTotal] = useState(0);
  const [friendRequestsLimit, setFriendRequestsLimit] =
    useState(SECTION_LIMIT_STEP);
  const [friendAcceptsLimit, setFriendAcceptsLimit] =
    useState(SECTION_LIMIT_STEP);
  const [friendsLimit, setFriendsLimit] = useState(SECTION_LIMIT_STEP);
  const [peopleLimit, setPeopleLimit] = useState(SECTION_LIMIT_STEP);
  const [peopleYouMayKnow, setPeopleYouMayKnow] = useState<IUser[]>([]);
  const [peopleLoading, setPeopleLoading] = useState(false);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const responseUser = await findUserById({ accessToken, id: userId });

        const friendRequestIdsAll = responseUser.data.data.friendRequests ?? [];
        const friendRequestIds = friendRequestIdsAll.slice(
          0,
          friendRequestsLimit,
        );
        const friendRequests: IUser[] = [];
        for (const friendRequestId of friendRequestIds) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friendRequestId });
          friendRequests.push(data);
        }

        const friendAcceptIdsAll = responseUser.data.data.friendAccepts ?? [];
        const friendAcceptIds = friendAcceptIdsAll.slice(0, friendAcceptsLimit);
        const friendAccepts: IUser[] = [];
        for (const friendAcceptId of friendAcceptIds) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friendAcceptId });
          friendAccepts.push(data);
        }

        const friendItemsAll = responseUser.data.data.friends ?? [];
        const friendItems = friendItemsAll.slice(0, friendsLimit);
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
          ...friendRequestIdsAll,
          ...friendAcceptIdsAll,
          ...friendItemsAll.map((friend: { userId: string }) => friend.userId),
        ].filter(Boolean);

        const {
          data: {
            data: { users },
          },
        } = await findUsers({
          accessToken,
          page: 1,
          limit: peopleLimit,
          filter: {
            notInIds: JSON.stringify(excludedIds),
          },
        });

        setFriendRequests(friendRequests);
        setFriendAccepts(friendAccepts);
        setFriends(friends);
        setFriendRequestsTotal(friendRequestIdsAll.length);
        setFriendAcceptsTotal(friendAcceptIdsAll.length);
        setFriendsTotal(friendItemsAll.length);
        setPeopleTotal(users.total ?? 0);
        setPeopleYouMayKnow(users.items);
      } catch {
        toast.error("Something went wrong");
      } finally {
        setPeopleLoading(false);
      }
    };
    fetchApi();
  }, [
    accessToken,
    userId,
    reload,
    friendRequestsLimit,
    friendAcceptsLimit,
    friendsLimit,
    peopleLimit,
  ]);

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

  const handleViewMoreFriendRequests = () => {
    setFriendRequestsLimit((prev) => prev + SECTION_LIMIT_STEP);
  };

  const handleViewMoreFriendAccepts = () => {
    setFriendAcceptsLimit((prev) => prev + SECTION_LIMIT_STEP);
  };

  const handleViewMoreFriends = () => {
    setFriendsLimit((prev) => prev + SECTION_LIMIT_STEP);
  };

  const handleViewMorePeople = () => {
    setPeopleLimit((prev) => prev + SECTION_LIMIT_STEP);
  };

  return (
    <>
      <FriendRequestsList
        friendRequests={friendRequests}
        onAccept={handleAcceptFriendRequest}
        onReject={handleRejectFriendRequest}
        showViewMore={friendRequestsLimit < friendRequestsTotal}
        onViewMore={handleViewMoreFriendRequests}
      />

      <FriendAcceptsList
        friendAccepts={friendAccepts}
        onDelete={handleDeleteFriendAccept}
        showViewMore={friendAcceptsLimit < friendAcceptsTotal}
        onViewMore={handleViewMoreFriendAccepts}
      />

      <FriendsList
        friends={friends}
        showViewMore={friendsLimit < friendsTotal}
        onViewMore={handleViewMoreFriends}
      />

      <PeopleYouMayKnowList
        people={peopleYouMayKnow}
        loading={peopleLoading}
        onSendInvitation={handleSendFriendRequest}
        showViewMore={peopleLimit < peopleTotal}
        onViewMore={handleViewMorePeople}
      />

      <FriendAround />
    </>
  );
}

export default FriendsPage;
