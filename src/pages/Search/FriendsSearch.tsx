import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { findUsers } from "@/services/user";
import { getCookie } from "@/helpers/cookies";
import type IUser from "@/interfaces/user.interface";

interface FriendsSearchProps {
  query: string;
}

function FriendsSearch({ query }: FriendsSearchProps) {
  const accessToken = getCookie("accessToken");
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApi = async () => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      try {
        setLoading(true);
        const {
          data: {
            data: { users },
          },
        } = await findUsers({
          accessToken,
          filter: { fullName: query },
          page: 1,
          limit: 20,
        });

        setUsers(users.items);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApi();
  }, [accessToken, query]);

  return (
    <Card className="search-card">
      <CardHeader>
        <CardTitle>Friends</CardTitle>
        <CardDescription>Search results for profiles</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-gray-500">Loading profiles...</div>}

        {!loading && users.length === 0 && (
          <div className="text-gray-500">No profiles found.</div>
        )}

        <div className="search-user-grid">
          {users.map((user) => (
            <Link
              key={user._id}
              to={`/profile/${user.slug}`}
              className="search-user-card"
            >
              <img
                src={
                  user.avatar
                    ? user.avatar
                    : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
                }
                alt={user.fullName}
              />
              <div>
                <div className="name">{user.fullName}</div>
                <div className="meta">{user.email}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default FriendsSearch;
