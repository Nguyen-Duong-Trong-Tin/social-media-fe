import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Typography, Card } from "antd";

import { MailOutlined, LockOutlined } from "@ant-design/icons";

import "./Login.css";
import { authLogin } from "../../services/auth";
import { getCookie, setCookie } from "../../helpers/cookies";

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const backendV1 = import.meta.env.VITE_BACKEND_V1;

  useEffect(() => {
    const checkAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const userId = params.get("userId");
      const userSlug = params.get("userSlug");
      const error = params.get("error");

      if (error) {
        if (error === "account_exists_local") {
          toast.error("Email already registered. Please login with email.");
        } else {
          toast.error("Google login failed. Please try again.");
        }
        window.history.replaceState({}, document.title, "/login");
        return;
      }

      if (accessToken && refreshToken && userId && userSlug) {
        setCookie("userId", userId, 3);
        setCookie("userSlug", userSlug, 3);
        setCookie("accessToken", accessToken, 3);
        setCookie("refreshToken", refreshToken, 90);
        navigate("/");
        return;
      }

      const accessTokenCookie = getCookie("accessToken");
      const refreshTokenCookie = getCookie("refreshToken");

      if (accessTokenCookie || refreshTokenCookie) {
        navigate("/");
      }
    };
    checkAuth();
  }, [navigate]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);

    try {
      const {
        data: { data },
      } = await authLogin(values);

      setCookie("userId", data.userId, 3);
      setCookie("userSlug", data.userSlug, 3);
      setCookie("accessToken", data.accessToken, 3);
      setCookie("refreshToken", data.refreshToken, 90);

      navigate("/");
    } catch {
      toast.error("Login failed. Please check your credentials.");
    }

    setLoading(false);
  };

  const onGoogleLogin = () => {
    window.location.href = `${backendV1}/auth/google`;
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <Card className="login-card">
          <div className="login-header">
            <Title level={2}>Sign In</Title>
            <Text type="secondary">
              Welcome back — please login to your account
            </Text>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please input your email!" },
                { type: "email", message: "Invalid email format!" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Enter your email"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please input your password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-btn"
                loading={loading}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="login-divider">or</div>

          <Button
            type="default"
            className="login-btn login-btn-google"
            onClick={onGoogleLogin}
          >
            Continue with Google
          </Button>

          <div className="login-footer">
            <Text>
              Don't have an account?{" "}
              <Link to="/register" className="login-register-link">
                Create account
              </Link>
            </Text>
          </div>
        </Card>
      </div>

      <div className="login-right">
        <img
          src="https://tse2.mm.bing.net/th/id/OIP.72scEC-MnZHG0HmET3ASVQHaEo?w=474&h=474&c=7&p=0"
          alt="Scenery"
          className="login-image"
        />
      </div>
    </div>
  );
};

export default Login;
