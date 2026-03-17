import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  groupsCount: number;
  friendsCount: number;
}

function StatsCard({ groupsCount, friendsCount }: StatsCardProps) {
  return (
    <Card className="profile-card profile-card-stats">
      <CardHeader>
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="value">{groupsCount}</div>
            <div className="label">Groups</div>
          </div>
          <div className="profile-stat">
            <div className="value">{friendsCount}</div>
            <div className="label">Friends</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatsCard;

