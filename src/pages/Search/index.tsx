import { useSearchParams } from "react-router-dom";

import { Card } from "@/components/ui/card";
import GroupsSearch from "./GroupsSearch";
import FriendsSearch from "./FriendsSearch";

import "./Search.css";

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  return (
    <div className="search-page">
      <Card className="search-hero">
        <h2>Search results</h2>
        <p>
          {query.trim()
            ? `Showing results for "${query}"`
            : "Type a keyword to start searching"}
        </p>
      </Card>

      <div className="search-sections">
        <GroupsSearch query={query} />
        <FriendsSearch query={query} />
      </div>
    </div>
  );
}

export default SearchPage;

