import { Empty } from "antd";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { IGroup } from "@/interfaces/group.interface";
import type { IUser } from "@/interfaces/user.interface";

interface GroupsSectionProps {
  user?: IUser;
  groups: IGroup[];
  loading: boolean;
}

function GroupsSection({ user, groups, loading }: GroupsSectionProps) {
  const navigate = useNavigate();

  return (
    <Card className="profile-card">
      <CardHeader>
        <CardTitle>Groups</CardTitle>
        <CardDescription>
          Groups {user?.fullName ? `of ${user.fullName}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-gray-500">Loading groups...</div>
        ) : groups.length === 0 ? (
          <Empty description="No groups found" />
        ) : (
          <div className="profile-group-grid">
            {groups.map((group) => (
              <article
                key={group._id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  navigate(`/group-profile/${group.slug}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    navigate(`/group-profile/${group.slug}`);
                  }
                }}
                className="profile-group-item"
              >
                <div className="profile-group-cover">
                  <img
                    src={group.coverPhoto ?? "/placeholder-banner.png"}
                    alt={group.title}
                  />
                </div>
                <div className="profile-group-content">
                  <h3>{group.title}</h3>
                  <p>
                    {group.users.length} {group.users.length !== 1 ? "members" : "member"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GroupsSection;

