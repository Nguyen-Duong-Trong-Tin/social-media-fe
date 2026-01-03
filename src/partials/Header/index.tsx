import { Input, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import { deleteCookie, getCookie } from "@/helpers/cookies";

import "./Header.css";

function Header() {
  const navigate = useNavigate();
  const userSlug = getCookie("userSlug");

  const navigateToHome = () => {
    navigate("/");
  };

  const navigateToMyProfile = () => {
    navigate(`/profile/${userSlug}`);
  };

  const navigateToMyGroups = () => {
    navigate(`/my-groups`);
  };

  const navigateToFriends = () => {
    navigate(`/friends`);
  };

  const handleLogout = () => {
    deleteCookie("userId");
    deleteCookie("userSlug");
    deleteCookie("accessToken");
    deleteCookie("refreshToken");

    navigate("/login");
  };

  return (
    <header className="header-container">
      {/* Logo */}
      <div className="header-logo" onClick={navigateToHome}>
        <div className="header-logo-icon" />
        <span className="header-logo-text">EduS</span>
      </div>

      {/* Search */}
      <div className="header-search">
        <Input
          placeholder="Search people, groups..."
          prefix={<SearchOutlined />}
          allowClear
        />
      </div>

      {/* Menu */}
      <nav className="header-nav">
        <a className="header-nav-link" onClick={navigateToHome}>
          Home
        </a>
        <a className="header-nav-link" onClick={navigateToMyProfile}>
          Me
        </a>
        <a className="header-nav-link" onClick={navigateToMyGroups}>
          Groups
        </a>
        <a className="header-nav-link" onClick={navigateToFriends}>
          Friends
        </a>
      </nav>

      {/* Logout */}
      <Button className="header-logout-btn" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}

export default Header;
