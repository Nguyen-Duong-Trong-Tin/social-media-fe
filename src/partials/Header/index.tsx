import { Input, Button } from "antd";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";
import { SearchOutlined } from "@ant-design/icons";
import { deleteCookie, getCookie } from "@/helpers/cookies";

function Header() {
  const navigate = useNavigate();
  const userSlug = getCookie("userSlug");

  const navigateToHome = async () => {
    navigate("/");
  };

  const navigateToMyProfile = async () => {
    navigate(`/profile/${userSlug}`);
  };

  const navigateToMyGroups = async () => {
    navigate(`/my-groups`);
  };

  const handleLogout = () => {
    deleteCookie("slug");
    deleteCookie("accessToken");
    deleteCookie("refreshToken");

    navigate("/login");
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between px-4 py-2 bg-[#1877f2] text-white shadow-md"
      )}
    >
      {/* Logo */}
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={navigateToHome}
      >
        <div className="w-6 h-6 rounded-full bg-white" />
        <span className="text-lg font-semibold">EduS</span>
      </div>

      {/* Search */}
      <div className="flex-1 mx-4 max-w-xl">
        <Input
          size="large"
          placeholder="Search"
          prefix={<SearchOutlined />}
          className="rounded-full"
          style={{
            borderRadius: "9999px",
          }}
        />
      </div>

      {/* Menu */}
      <nav className="flex items-center space-x-4 text-sm font-medium">
        <a className="hover:underline cursor-pointer" onClick={navigateToHome}>
          Home
        </a>
        <a
          className="hover:underline cursor-pointer"
          onClick={navigateToMyProfile}
        >
          Me
        </a>
        <a href="#" className="hover:underline" onClick={navigateToMyGroups}>
          Groups
        </a>
        <a href="#" className="hover:underline">
          Friends
        </a>
      </nav>

      {/* Logout */}
      <Button
        type="primary"
        danger
        className="ml-4 rounded-full font-semibold"
        onClick={handleLogout}
      >
        Logout
      </Button>
    </header>
  );
}

export default Header;
