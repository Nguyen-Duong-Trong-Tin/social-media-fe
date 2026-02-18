import { Col, Divider, Row } from "antd";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type IUser from "@/interfaces/user.interface";

interface FriendRequestsListProps {
  friendRequests: IUser[];
  onAccept: (userRequestId: string) => void;
  onReject: (userRequestId: string) => void;
}

function FriendRequestsList({
  friendRequests,
  onAccept,
  onReject,
}: FriendRequestsListProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold">List of friend requests</h2>

      <Row gutter={[16, 16]}>
        {friendRequests.map((friendRequest) => (
          <Col key={friendRequest._id} span={6}>
            <Card className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 pt-0">
              <Link
                to={`/profile/${friendRequest.slug}`}
                className="block h-50 w-full overflow-hidden relative group"
              >
                <img
                  src={friendRequest.avatar}
                  alt={friendRequest.fullName}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <Divider />

              <CardContent className="p-4 flex flex-col gap-3">
                <Link to={`/profile/${friendRequest.slug}`}>
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {friendRequest.fullName}
                  </h3>
                </Link>

                <div className="flex flex-col gap-2 w-full">
                  <Button
                    onClick={() => onAccept(friendRequest._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Confirm
                  </Button>

                  <Button
                    onClick={() => onReject(friendRequest._id)}
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
  );
}

export default FriendRequestsList;
