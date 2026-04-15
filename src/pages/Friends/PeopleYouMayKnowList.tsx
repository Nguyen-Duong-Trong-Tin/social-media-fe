import { Col, Empty, Row } from "antd";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IUser } from "@/interfaces/user.interface";

interface PeopleYouMayKnowListProps {
  people: IUser[];
  loading: boolean;
  onSendInvitation: (userRequestId: string) => void;
}

function PeopleYouMayKnowList({
  people,
  loading,
  onSendInvitation,
}: PeopleYouMayKnowListProps) {
  return (
    <Card className="p-5">
      <h2 className="text-xl font-bold">People you may know</h2>

      {loading ? (
        <div className="text-gray-500 mt-4">Loading suggestions...</div>
      ) : people.length === 0 ? (
        <div className="mt-4">
          <Empty description="No suggestions available" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {people.map((person) => (
            <Col key={person._id} xs={24} md={12}>
              <Card className="w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-300 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Link
                    to={`/profile/${person.slug}`}
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-full"
                  >
                    <img
                      src={
                        person.avatar
                          ? person.avatar
                          : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
                      }
                      alt={person.fullName}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <Link to={`/profile/${person.slug}`} className="block">
                      <h3 className="font-semibold text-base leading-tight text-gray-900 wrap-break-word">
                        {person.fullName}
                      </h3>
                    </Link>
                  </div>

                  <Button
                    onClick={() => onSendInvitation(person._id)}
                    className="h-9 shrink-0 bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Send invitation
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
}

export default PeopleYouMayKnowList;
