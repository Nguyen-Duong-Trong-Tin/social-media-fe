import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Typography, Card } from "antd";

import {
  userCheckUserExistsEmail,
  userCheckUserExistsPhone,
} from "../../services/user";
import { authRegister } from "../../services/auth";

import "./Register.css";

const { Title, Text } = Typography;

function Register() {
  const navigate = useNavigate();

  const onBlurEmail = async (
    e: React.FocusEvent<HTMLInputElement, Element>
  ) => {
    try {
      const email = e.target.value;

      await userCheckUserExistsEmail({ email });
      toast.error("This email is exists.");
    } catch (error) {
      const { status } = error as unknown as { status: number };

      if (status !== 404) {
        toast.error("Something went wrong.");
      }
    }
  };

  const onBlurPhone = async (
    e: React.FocusEvent<HTMLInputElement, Element>
  ) => {
    try {
      const phone = e.target.value;

      await userCheckUserExistsPhone({ phone });
      toast.error("This phone is exists");
    } catch (error) {
      const { status } = error as unknown as { status: number };

      if (status !== 404) {
        toast.error("Something went wrong");
      }
    }
  };

  const onFinish = async (values: any) => {
    try {
      await authRegister(values);

      toast.success("Register successfully.");
      navigate("/login");
    } catch {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="register-container">
      {/* Cột trái */}
      <div className="register-left">
        <Card className="register-card">
          <div className="register-header">
            <Title level={2}>Create an account</Title>
            <Text type="secondary">Sign up to get started</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="fullName"
              label="Full Name"
              rules={[
                { required: true, message: "Please input your full name!" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter your full name"
              />
            </Form.Item>

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
                onBlur={onBlurEmail}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: "Please input your phone number!" },
                {
                  pattern: /^[0-9]{9,11}$/,
                  message: "Phone number must be 9–11 digits!",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Enter your phone number"
                onBlur={onBlurPhone}
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
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password!" },
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
                placeholder="Confirm your password"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="register-btn">
                Sign Up
              </Button>
            </Form.Item>
          </Form>

          <div className="register-footer">
            <Text>
              Already have an account?{" "}
              <a href="/login" className="register-login-link">
                Log In
              </a>
            </Text>
          </div>
        </Card>
      </div>

      {/* Cột phải */}
      <div className="register-right">
        <img
          src="https://tse2.mm.bing.net/th/id/OIP.72scEC-MnZHG0HmET3ASVQHaEo?w=474&h=474&c=7&p=0"
          alt="Scenery"
          className="register-image"
        />
      </div>
    </div>
  );
}

export default Register;
