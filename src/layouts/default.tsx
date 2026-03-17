import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Badge } from "antd";
import { MessageOutlined } from "@ant-design/icons";

import Footer from "@/partials/Footer";

import Header from "../partials/Header";
import { deleteCookie, getCookie, setCookie } from "../helpers/cookies";
import { authRefreshToken, authVerifyAccessToken } from "../services/auth";
import { useNotifications } from "@/contexts/NotificationContext";

import "./layoutDefault.css";

function LayoutDefault() {
  const navigate = useNavigate();
  const { counts } = useNotifications();

  useEffect(() => {
    const checkAuth = async () => {
      // Check access token
      try {
        const accessToken = getCookie("accessToken");

        await authVerifyAccessToken({
          accessToken,
        });
      } catch (e) {
        const { status } = e as { status: number };

        // Refresh token
        if (status !== 500) {
          try {
            const refreshToken = getCookie("refreshToken");
            const {
              data: { data },
            } = await authRefreshToken({ refreshToken });

            setCookie("accessToken", data.accessToken, 3);
          } catch {
            deleteCookie("accessToken");
            deleteCookie("refreshToken");

            navigate("/login");
          }
        }
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <>
      <div className="layout-wrapper">
        <Header />

        <main className="layout-content">
          <div className="container">
            <Outlet />
          </div>
        </main>

        <footer className="layout-footer">
          <Footer />
        </footer>
      </div>

      <button
        type="button"
        className="floating-message-button"
        onClick={() => navigate("/messages")}
        aria-label="Open messages"
      >
        <Badge count={counts.messages} size="small" offset={[6, -4]}>
          <MessageOutlined />
        </Badge>
      </button>
    </>
  );
}

export default LayoutDefault;

