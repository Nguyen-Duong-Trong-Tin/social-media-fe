import { Col, Divider, Row } from "antd";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type IUser from "@/interfaces/user.interface";

interface FriendAcceptsListProps {
  friendAccepts: IUser[];
  onDelete: (userRequestId: string) => void;
}

function FriendAcceptsList({
  friendAccepts,
  onDelete,
}: FriendAcceptsListProps) {
  return (
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
                  onClick={() => onDelete(friendAccept._id)}
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
  );
}

export default FriendAcceptsList;
