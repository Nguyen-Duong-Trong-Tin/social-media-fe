import { LockOutlined, MailOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";

import { authResetPassword } from "@/services/auth";

import "./ResetPassword.css";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialEmail = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const onFinish = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (!token) {
      toast.error("Reset token is missing.");
      return;
    }

    try {
      await authResetPassword({
        email: values.email,
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      toast.success("Password reset successfully.");
      navigate("/login");
    } catch {
      toast.error("Reset link is invalid or expired.");
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-left">
        <Card className="reset-password-card">
          <div className="reset-password-header">
            <Title level={2}>Reset Password</Title>
            <Text type="secondary">
              Create a new password for your account.
            </Text>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ email: initialEmail }}
          >
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

            <Form.Item
              name="password"
              label="New Password"
              rules={[
                { required: true, message: "Please input your new password!" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter your new password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm your new password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="reset-password-btn"
              >
                Update Password
              </Button>
            </Form.Item>
          </Form>

          <div className="reset-password-footer">
            <Text>
              Back to{" "}
              <Link to="/login" className="reset-password-login-link">
                Sign In
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
