import { Empty } from "antd";
import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type IUser from "@/interfaces/user.interface";

interface FriendsSectionProps {
  user?: IUser;
  friends: IUser[];
  loading: boolean;
}

function FriendsSection({ user, friends, loading }: FriendsSectionProps) {
  return (
    <Card className="profile-card">
      <CardHeader>
        <CardTitle>Friends</CardTitle>
        <CardDescription>
          Friends {user?.fullName ? `of ${user.fullName}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-gray-500">Loading friends...</div>
        ) : friends.length === 0 ? (
          <Empty description="No friends found" />
        ) : (
          <div className="profile-friend-grid">
            {friends.map((friend) => (
              <Link
                to={`/profile/${friend.slug}`}
                key={friend._id}
                className="profile-friend-item"
              >
                <img
                  src={
                    friend.avatar
                      ? friend.avatar
                      : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
                  }
                  alt={friend.fullName}
                />
                <div>
                  <div className="name">{friend.fullName}</div>
                  <div className="meta">{friend.email}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FriendsSection;
