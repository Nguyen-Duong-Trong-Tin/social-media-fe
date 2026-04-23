import { Col, Row } from "antd";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IUser } from "@/interfaces/user.interface";

interface FriendAcceptsListProps {
  friendAccepts: IUser[];
  onDelete: (userRequestId: string) => void;
  showViewMore: boolean;
  onViewMore: () => void;
}

function FriendAcceptsList({
  friendAccepts,
  onDelete,
  showViewMore,
  onViewMore,
}: FriendAcceptsListProps) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold">List of friend accepts</h2>

      <Row gutter={[16, 16]}>
        {friendAccepts.map((friendAccept) => (
          <Col key={friendAccept._id} xs={24} md={12}>
            <Card className="w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md">
              <div className="flex items-center gap-3">
                <Link
                  to={`/profile/${friendAccept.slug}`}
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-full"
                >
                  <img
                    src={friendAccept.avatar}
                    alt={friendAccept.fullName}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${friendAccept.slug}`}>
                    <h3 className="font-semibold text-base leading-tight text-gray-900 wrap-break-word">
                      {friendAccept.fullName}
                    </h3>
                  </Link>
                </div>

                <Button
                  onClick={() => onDelete(friendAccept._id)}
                  variant="secondary"
                  className="h-9 shrink-0 bg-gray-200 px-4 text-sm font-medium text-gray-800 hover:bg-gray-300"
                >
                  Delete
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {showViewMore && (
        <div className="mt-4 flex justify-end">
          <Button className="cursor-pointer" onClick={onViewMore}>
            View more...
          </Button>
        </div>
      )}
    </Card>
  );
}

export default FriendAcceptsList;
