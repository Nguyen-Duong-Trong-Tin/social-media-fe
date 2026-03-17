import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findGroups } from "@/services/group";
import { getCookie } from "@/helpers/cookies";
import type { IGroup } from "@/interfaces/group.interface";

interface GroupsSearchProps {
  query: string;
}

function GroupsSearch({ query }: GroupsSearchProps) {
  const navigate = useNavigate();
  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");

  const [groups, setGroups] = useState<IGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApi = async () => {
      if (!query.trim()) {
        setGroups([]);
        return;
      }

      try {
        setLoading(true);
        const {
          data: {
            data: { groups },
          },
        } = await findGroups({
          accessToken,
          filter: { title: query },
          page: 1,
          limit: 20,
        });

        setGroups(groups.items);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApi();
  }, [accessToken, query]);

  const navigateToGroupProfile = (slug: string) => {
    navigate(`/group-profile/${slug}`);
  };

  return (
    <Card className="search-card">
      <CardHeader>
        <CardTitle>Groups</CardTitle>
        <CardDescription>Search results for groups</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-gray-500">Loading groups...</div>}

        {!loading && groups.length === 0 && (
          <div className="text-gray-500">No groups found.</div>
        )}

        <div className="search-grid">
          {groups.map((group) => (
            <article
              key={group._id}
              role="button"
              tabIndex={0}
              onClick={() => navigateToGroupProfile(group.slug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigateToGroupProfile(group.slug);
                }
              }}
              className="search-card-item"
            >
              <div className="search-card-media">
                <img
                  src={group.coverPhoto ?? "/placeholder-banner.png"}
                  alt={group.title}
                />
              </div>
              <div className="search-card-content">
                <h3>{group.title}</h3>
                <p>
                  {group.users.length} {group.users.length !== 1 ? "members" : "member"}
                </p>
                <span className="search-card-action">
                  {group.users.find((user) => user.userId === userId) ? "View" : "Join"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default GroupsSearch;

