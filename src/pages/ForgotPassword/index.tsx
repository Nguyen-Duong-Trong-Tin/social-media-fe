import { MailOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography } from "antd";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import { authForgotPassword } from "@/services/auth";

import "./ForgotPassword.css";

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const onFinish = async (values: { email: string }) => {
    try {
      const response = await authForgotPassword(values);
      const message = response?.data?.message;

      if (
        message === "This email uses Google login, please continue with Google"
      ) {
        toast.info(message);
        return;
      }

      toast.success(
        message || "If the email exists, a reset link has been sent.",
      );
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-left">
        <Card className="forgot-password-card">
          <div className="forgot-password-header">
            <Title level={2}>Forgot Password</Title>
            <Text type="secondary">
              Enter your email and we will send you a password reset link.
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
              <Input prefix={<MailOutlined />} placeholder="Enter your email" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="forgot-password-btn"
              >
                Send Reset Link
              </Button>
            </Form.Item>
          </Form>

          <div className="forgot-password-footer">
            <Text>
              Back to{" "}
              <Link to="/login" className="forgot-password-login-link">
                Sign In
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
