import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { getCookie } from "@/helpers/cookies";
import { findByIdGroup, findSuggestGroup } from "@/services/group";
import type IGroup from "@/interfaces/group.interface";
import { useNavigate } from "react-router-dom";
import type IGroupTopic from "@/interfaces/groupTopic.interface";
import { findByIdGroupTopic } from "@/services/groupTopic";

function ListOfSuggestedGroups() {
  const userId = getCookie("userId");
  const accessToken = getCookie("accessToken");

  const navigate = useNavigate();

  const [groups, setGroups] = useState<IGroup[]>([]);
  const [groupTopics, setGroupTopics] = useState<IGroupTopic[]>([]);

  useEffect(() => {
    const fetchApi = async () => {
      const { data } = await findSuggestGroup({ accessToken, userId });

      const groups: IGroup[] = [];
      for (const suggesstion of data.suggestions) {
        const {
          data: { data },
        } = await findByIdGroup({ accessToken, id: suggesstion.groupId });
        groups.push(data);
      }

      const groupTopics: IGroupTopic[] = [];
      for (const group of groups) {
        const {
          data: { data },
        } = await findByIdGroupTopic({ accessToken, id: group.groupTopicId });
        groupTopics.push(data);
      }

      setGroups(groups);
      setGroupTopics(groupTopics);
    };
    fetchApi();
  }, [accessToken, userId]);

  const navigateToGroupProfile = ({ slug }: { slug: string }) => {
    navigate(`/group-profile/${slug}`);
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-2xl font-bold">List Of Suggested Groups</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group, index) => (
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
                <p className="text-sm text-gray-500 mb-4">
                  {groupTopics[index].title}
                </p>

                <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {group.users.length}{" "}
                    {group.users.length !== 1 ? "members" : "member"}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Join</span>
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
      </Card>
    </>
  );
}

export default ListOfSuggestedGroups;
