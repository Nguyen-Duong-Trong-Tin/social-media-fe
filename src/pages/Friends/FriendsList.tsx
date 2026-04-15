import { Col, Row } from "antd";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IUser } from "@/interfaces/user.interface";

interface FriendsListItem {
  user: IUser;
  roomChatId: string;
}

interface FriendsListProps {
  friends: FriendsListItem[];
}

function FriendsList({ friends }: FriendsListProps) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold">List of friends</h2>

      <Row gutter={[16, 16]}>
        {friends.map((friend) => (
          <Col key={friend.user._id} xs={24} md={12}>
            <Card className="w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${friend.user.slug}`}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-full"
                >
                  <img
                    src={friend.user.avatar}
                    alt={friend.user.fullName}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${friend.user.slug}`}>
                    <h3 className="font-semibold text-base leading-tight text-gray-900 wrap-break-word">
                      {friend.user.fullName}
                    </h3>
                  </Link>
                </div>

                <Link
                  to={`/room-chat/${friend.roomChatId}`}
                  state={{ friend: friend.user }}
                  className="shrink-0"
                >
                  <Button className="h-9 px-4 text-sm">Chat</Button>
                </Link>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export default FriendsList;
