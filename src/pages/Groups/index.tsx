import { Input } from "antd";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { findGroups } from "@/services/group";
import { getCookie } from "@/helpers/cookies";
import { Button } from "@/components/ui/button";
import type IGroup from "@/interfaces/group.interface";
import { findBySlugGroupTopic } from "@/services/groupTopic";
import type IGroupTopic from "@/interfaces/groupTopic.interface";
import ButtonAddGroup from "./ButtonAddGroup";

const { Search } = Input;

function GroupsPage() {
  const navigate = useNavigate();

  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");
  const { groupTopicSlug } = useParams();

  const [reload, setReload] = useState(false);
  const [searchGroupsByTitle, setSearchGroupsByTitle] = useState<string>("");
  const [groupTopic, setGroupTopic] = useState<IGroupTopic>();
  const [groups, setGroups] = useState<IGroup[]>([]);
  const [groupsTotal, setGroupsTotal] = useState(0);
  const [groupsLimit, setGroupsLimit] = useState(20);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const {
          data: { data },
        } = await findBySlugGroupTopic({
          accessToken,
          slug: groupTopicSlug as string,
        });

        setGroupTopic(data);
      } catch {
        toast.error("Something went wrong.");
      }
    };
    fetchApi();
  }, [accessToken, groupTopicSlug]);

  useEffect(() => {
    const fetchApi = async () => {
      const {
        data: {
          data: { groups },
        },
      } = await findGroups({
        accessToken,
        filter: { groupTopicId: groupTopic?._id, title: searchGroupsByTitle },
        page: 1,
        limit: groupsLimit,
      });

      setGroups(groups.items);
      setGroupsTotal(groups.total);
    };

    if (groupTopic) {
      fetchApi();
    }
  }, [accessToken, groupTopic, groupsLimit, searchGroupsByTitle, reload]);

  const handleViewMore = () => {
    setGroupsLimit(groupsLimit + 20);
  };

  const navigateToGroupProfile = ({ slug }: { slug: string }) => {
    navigate(`/group-profile/${slug}`);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">List Of Groups</h2>
        <div className="w-1/3">
          <Search
            placeholder={"Search groups..."}
            value={searchGroupsByTitle}
            onChange={(e) => {
              setSearchGroupsByTitle(e.target.value);
            }}
            allowClear
            enterButton={false}
            size="large"
            style={{ borderRadius: 9999 }}
          />
        </div>
      </div>

      {groupTopic && (
        <div className="flex justify-end">
          <ButtonAddGroup reload={reload} setReload={setReload} groupTopic={groupTopic} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <article
            key={group._id}
            role="button"
            tabIndex={0}
            onClick={() => {
              navigateToGroupProfile({ slug: group.slug });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                console.log("key down");
              }
            }}
            className="group bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition cursor-pointer"
          >
            <div className="relative w-full h-48 bg-gray-100">
              <img
                src={group.coverPhoto ?? "/placeholder-banner.png"}
                alt={group.title}
                className="w-full h-full object-cover border-b-2"
              />
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 leading-snug mb-2">
                {group.title}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{groupTopic?.title}</p>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {group.users.length}{" "}
                  {group.users.length !== 1 ? "members" : "member"}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {group.users.find((user) => user.userId === userId)
                      ? "View"
                      : "Join"}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-medium">
                    ➤
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}

        {groups.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No groups found.
          </div>
        )}
      </div>

      {groupsLimit < groupsTotal && (
        <div className="flex justify-end">
          <Button className="cursor-pointer" onClick={handleViewMore}>
            View more...
          </Button>
        </div>
      )}
    </Card>
  );
}

export default GroupsPage;
