import { Input } from "antd";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCookie } from "@/helpers/cookies";
import { findGroups } from "@/services/group";
import { Button } from "@/components/ui/button";
import { FolderOutlined } from "@ant-design/icons";
import { findGroupTopics } from "@/services/groupTopic";
import type IGroupTopic from "@/interfaces/groupTopic.interface";

const { Search } = Input;

function Home() {
  const navigate = useNavigate();
  const accessToken = getCookie("accessToken");

  const [searchGroupTopicsByTitle, setSearchGroupTopicsByTitle] = useState("");
  const [groupTopicsTotal, setGroupTopicsTotal] = useState(0);
  const [groupTopicsLimit, setGroupTopicsLimit] = useState(20);
  const [groupTopics, setGroupTopics] = useState<IGroupTopic[]>([]);
  const [groupsTotalInGroupTopics, setGroupsTotalInGroupTopics] = useState<
    number[]
  >([]);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const {
          data: {
            data: { groupTopics },
          },
        } = await findGroupTopics({
          accessToken,
          page: 1,
          limit: groupTopicsLimit,
          filter: { title: searchGroupTopicsByTitle },
        });
        const groupTopicsItems = groupTopics.items as IGroupTopic[];
        const groupTopicsTotal = groupTopics.total as number;

        const groupsTotalInGroupTopics: number[] = [];
        const groupsResponse = await Promise.all(
          groupTopicsItems.map((groupTopicsItem) =>
            findGroups({
              accessToken,
              filter: { groupTopicId: groupTopicsItem._id },
              page: 1,
              limit: 99,
            })
          )
        );
        for (const groupResponse of groupsResponse) {
          const {
            data: {
              data: {
                groups: { total },
              },
            },
          } = groupResponse;
          groupsTotalInGroupTopics.push(total);
        }

        setGroupTopics(groupTopicsItems);
        setGroupTopicsTotal(groupTopicsTotal);
        setGroupsTotalInGroupTopics(groupsTotalInGroupTopics);
      } catch {
        toast.error("Something went wrong.");
      }
    };
    fetchApi();
  }, [accessToken, searchGroupTopicsByTitle, groupTopicsLimit]);

  const handleNavigateToGroup = (groupTopicSlug: string) => {
    navigate(`/groups/${groupTopicSlug}`);
  };

  const handleViewMore = () => {
    setGroupTopicsLimit(groupTopicsLimit + 20);
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">List Of Group Topics</h2>
          <div className="w-1/3">
            <Search
              placeholder={"Search group topics..."}
              value={searchGroupTopicsByTitle}
              onChange={(e) => {
                setSearchGroupTopicsByTitle(e.target.value);
              }}
              allowClear
              enterButton={false}
              size="large"
              style={{ borderRadius: 9999 }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {groupTopics.map((groupTopic, index) => (
            <div
              key={groupTopic._id}
              onClick={() => handleNavigateToGroup(groupTopic.slug)}
              className={cn(
                "flex items-center justify-between px-4 py-3 rounded-md border hover:bg-gray-50 transition cursor-pointer"
              )}
            >
              <div className="flex items-center space-x-3">
                <FolderOutlined className="text-xl text-gray-700" />
                <span className="text-[16px] font-medium">
                  {groupTopic.title}
                </span>
              </div>
              <Badge
                variant="secondary"
                className="text-sm bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md"
              >
                {groupsTotalInGroupTopics[index]}
              </Badge>
            </div>
          ))}

          {groupTopics.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No group topics found.
            </div>
          )}
        </div>

        {groupTopicsLimit < groupTopicsTotal && (
          <div className="flex justify-end">
            <Button className="cursor-pointer" onClick={handleViewMore}>
              View more...
            </Button>
          </div>
        )}
      </Card>
    </>
  );
}

export default Home;
