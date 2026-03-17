import { Col, Divider, Row } from "antd";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="p-6">
      <h2 className="text-2xl font-bold">List of friends</h2>

      <Row gutter={[16, 16]}>
        {friends.map((friend) => (
          <Col key={friend.user._id} span={6}>
            <Card className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 pt-0">
              <Link
                to={`/profile/${friend.user.slug}`}
                className="block h-50 w-full overflow-hidden relative group"
              >
                <img
                  src={friend.user.avatar}
                  alt={friend.user.fullName}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </Link>
              <Divider />

              <CardContent className="p-4 flex flex-col gap-3">
                <Link to={`/profile/${friend.user.slug}`}>
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {friend.user.fullName}
                  </h3>
                </Link>
                <Link
                  to={`/room-chat/${friend.roomChatId}`}
                  state={{ friend: friend.user }}
                >
                  <Button className="w-full">Chat</Button>
                </Link>
              </CardContent>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

export default FriendsList;

