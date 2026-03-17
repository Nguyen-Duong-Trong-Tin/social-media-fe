import { createBrowserRouter } from "react-router-dom";

import App from "../App";
import Home from "../pages/Home";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Register from "../pages/Register";
import LayoutDefault from "../layouts/default";
import Profile from "../pages/Profile";
import GroupsPage from "@/pages/Groups";
import MyGroupsPage from "@/pages/MyGroups";
import GroupProfilePage from "@/pages/GroupProfile";
import GroupProfileViewInvitation from "@/pages/GroupProfile/GroupProfileViewInvitation";
import GroupProfileTasksScoringDetail from "@/pages/GroupProfile/GroupProfileTasksScoringDetail";
import FriendsPage from "@/pages/Friends";
import SearchPage from "@/pages/Search";
import RoomChat from "@/pages/RoomChat";
import MessagesPage from "@/pages/Messages";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        element: <LayoutDefault />,
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: "profile/:slug",
            element: <Profile />,
          },
          {
            path: "groups/:groupTopicSlug",
            element: <GroupsPage />,
          },
          {
            path: "my-groups",
            element: <MyGroupsPage />,
          },
          {
            path: "group-profile/:slug",
            element: <GroupProfilePage />,
          },
          {
            path: "group-profile/view-invitation/:slug",
            element: <GroupProfileViewInvitation />,
          },
          {
            path: "group-profile/scoring/:taskGroupSubmissionSlug",
            element: <GroupProfileTasksScoringDetail />,
          },
          {
            path: "friends",
            element: <FriendsPage />,
          },
          {
            path: "messages",
            element: <MessagesPage />,
          },
          {
            path: "room-chat/:roomChatId",
            element: <RoomChat />,
          },
          {
            path: "search",
            element: <SearchPage />,
          },
        ],
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

export default router;

