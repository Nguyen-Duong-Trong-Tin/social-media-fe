import { toast } from "react-toastify";
import { useEffect, useState } from "react";

import { socket } from "@/services/socket";
import { getCookie } from "@/helpers/cookies";
import { findUserById } from "@/services/user";
import SocketEvent from "@/enums/socketEvent.enum";
import type IUser from "@/interfaces/user.interface";
import type {
  ServerResponseRejectFriendRequest,
  ServerResponseAcceptFriendRequest,
  ServerResponseDeleteFriendAccept,
} from "@/dtos/dtos/user.dto";
import FriendRequestsList from "@/pages/Friends/FriendRequestsList";
import FriendAcceptsList from "@/pages/Friends/FriendAcceptsList";
import FriendsList from "@/pages/Friends/FriendsList";

function FriendsPage() {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const [reload, setReload] = useState(false);
  const [friendRequests, setFriendRequests] = useState<IUser[]>([]);
  const [friendAccepts, setFriendAccepts] = useState<IUser[]>([]);
  const [friends, setFriends] = useState<
    { user: IUser; roomChatId: string }[]
  >([]);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const responseUser = await findUserById({ accessToken, id: userId });

        const friendRequests: IUser[] = [];
        for (const friendRequestId of responseUser.data.data.friendRequests) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friendRequestId });
          friendRequests.push(data);
        }

        const friendAccepts: IUser[] = [];
        for (const friendAcceptId of responseUser.data.data.friendAccepts) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friendAcceptId });
          friendAccepts.push(data);
        }

        const friends: { user: IUser; roomChatId: string }[] = [];
        for (const friend of responseUser.data.data.friends) {
          const {
            data: { data },
          } = await findUserById({ accessToken, id: friend.userId });
          friends.push({ user: data, roomChatId: friend.roomChatId });
        }

        setFriendRequests(friendRequests);
        setFriendAccepts(friendAccepts);
        setFriends(friends);
      } catch {
        toast.error("Something went wrong");
      }
    };
    fetchApi();
  }, [accessToken, userId, reload]);

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
    </>
  );
}

export default FriendsPage;
