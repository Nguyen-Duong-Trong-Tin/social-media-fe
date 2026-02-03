import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type IUser from "@/interfaces/user.interface";

interface IntroCardProps {
  user?: IUser;
  bio: string;
  isMyProfile: boolean;
  onEdit: () => void;
}

function IntroCard({ user, bio, isMyProfile, onEdit }: IntroCardProps) {
  return (
    <Card className="profile-card">
      <CardHeader>
        <CardTitle>Intro</CardTitle>
        {bio ? (
          <CardDescription dangerouslySetInnerHTML={{ __html: bio }} />
        ) : (
          <CardDescription className="text-gray-400">
            No bio yet.
          </CardDescription>
        )}
        {isMyProfile && (
          <CardAction>
            <Button variant="outline" onClick={onEdit}>
              Edit
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <div className="profile-info">
          <div className="profile-info-item">
            <span className="label">Email</span>
            <span className="value">{user?.email ?? "-"}</span>
          </div>
          <div className="profile-info-item">
            <span className="label">Phone</span>
            <span className="value">{user?.phone ?? "-"}</span>
          </div>
          <div className="profile-info-item">
            <span className="label">Status</span>
            <span className="value">{user?.status ?? "-"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default IntroCard;
