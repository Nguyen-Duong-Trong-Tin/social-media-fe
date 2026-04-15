import { Col, Row } from "antd";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IUser } from "@/interfaces/user.interface";

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
    <Card className="p-5">
      <h2 className="text-xl font-bold">List of friend requests</h2>

      <Row gutter={[16, 16]}>
        {friendRequests.map((friendRequest) => (
          <Col key={friendRequest._id} xs={24} md={12}>
            <Card className="w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${friendRequest.slug}`}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-full"
                >
                  <img
                    src={friendRequest.avatar}
                    alt={friendRequest.fullName}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${friendRequest.slug}`}>
                    <h3 className="font-semibold text-base leading-tight text-gray-900 wrap-break-word">
                      {friendRequest.fullName}
                    </h3>
                  </Link>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    onClick={() => onAccept(friendRequest._id)}
                    className="h-9 bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Confirm
                  </Button>

                  <Button
                    onClick={() => onReject(friendRequest._id)}
                    variant="secondary"
                    className="h-9 bg-gray-200 px-4 text-sm font-medium text-gray-800 hover:bg-gray-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export default FriendRequestsList;
