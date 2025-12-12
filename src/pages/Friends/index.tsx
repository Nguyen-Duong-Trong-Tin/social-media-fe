import { toast } from "react-toastify";
import { Col, Divider, Row } from "antd";
import { useEffect, useState } from "react";

import { socket } from "@/services/socket";
import { getCookie } from "@/helpers/cookies";
import { findUserById } from "@/services/user";
import { Button } from "@/components/ui/button";
import SocketEvent from "@/enums/socketEvent.enum";
import type IUser from "@/interfaces/user.interface";
import { Card, CardContent } from "@/components/ui/card";
import type { ServerResponseRejectFriendRequest } from "@/dtos/dtos/user.dto";

function FriendsPage() {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const [reload, setReload] = useState(false);
  const [friendRequests, setFriendRequests] = useState<IUser[]>([]);
  const [friendAccepts, setFriendAccepts] = useState<IUser[]>([]);

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

        setFriendRequests(friendRequests);
        setFriendAccepts(friendAccepts);
      } catch {
        toast.error("Something went wrong");
      }
    };
    fetchApi();
  }, [accessToken, userId, reload]);

  useEffect(() => {
    const handler = (data: ServerResponseRejectFriendRequest) => {
      if (userId !== data.userRequestId) {
        return;
      }

      setReload((prev) => !prev);
    };

    socket.on(SocketEvent.SERVER_RESPONSE_REJECT_FRIEND_REQUEST, handler);

    return () => {
      socket.off(SocketEvent.SERVER_RESPONSE_REJECT_FRIEND_REQUEST, handler);
    };
  }, [userId]);

  const handleRejectFriendRequest = (userRequestId: string) => {
    socket.emit(SocketEvent.CLIENT_REJECT_FRIEND_REQUEST, {
      userId,
      userRequestId: userRequestId,
    });

    setReload((prev) => !prev);
    toast.success("Rejected friend request successfully");
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-2xl font-bold">List Of Friend Requests</h2>

        <Row gutter={[16, 16]}>
          {friendRequests.map((friendRequest) => (
            <Col key={friendRequest._id} span={6}>
              <Card className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 pt-0">
                <div className="h-50 w-full overflow-hidden relative group">
                  <img
                    src={friendRequest.avatar}
                    alt={friendRequest.fullName}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <Divider />

                <CardContent className="p-4 flex flex-col gap-3">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {friendRequest.fullName}
                  </h3>

                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      onClick={() => {}}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    >
                      Confirm
                    </Button>

                    <Button
                      onClick={() =>
                        handleRejectFriendRequest(friendRequest._id)
                      }
                      variant="secondary"
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold">List Of Friend Accepts</h2>

        <Row gutter={[16, 16]}>
          {friendAccepts.map((friendAccept) => (
            <Col key={friendAccept._id} span={6}>
              <Card className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 pt-0">
                <div className="h-50 w-full overflow-hidden relative group">
                  <img
                    src={friendAccept.avatar}
                    alt={friendAccept.fullName}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <Divider />

                <CardContent className="p-4 flex flex-col gap-3">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {friendAccept.fullName}
                  </h3>

                  <Button
                    onClick={() => handleRejectFriendRequest(friendAccept._id)}
                    variant="secondary"
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </>
  );
}

export default FriendsPage;
