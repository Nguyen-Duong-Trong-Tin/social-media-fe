import { Col, Divider, Empty, Row } from "antd";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="p-6">
      <h2 className="text-2xl font-bold">People you may know</h2>

      {loading ? (
        <div className="text-gray-500 mt-4">Loading suggestions...</div>
      ) : people.length === 0 ? (
        <div className="mt-4">
          <Empty description="No suggestions available" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {people.map((person) => (
            <Col key={person._id} span={6}>
              <Card className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white hover:shadow-md transition-shadow duration-300 pt-0">
                <Link to={`/profile/${person.slug}`} className="block">
                  <div className="h-50 w-full overflow-hidden relative group">
                    <img
                      src={
                        person.avatar
                          ? person.avatar
                          : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
                      }
                      alt={person.fullName}
                      className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <Divider />
                </Link>

                <CardContent className="p-4 flex flex-col gap-3">
                  <Link to={`/profile/${person.slug}`} className="block">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                      {person.fullName}
                    </h3>
                  </Link>

                  <Button
                    onClick={() => onSendInvitation(person._id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  >
                    Send invitation
                  </Button>
                </CardContent>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
}

export default PeopleYouMayKnowList;

