"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { App, Button, Form, Input, Card, Typography, notification } from "antd";
// Optionally, you can import a CSS module or file for additional styling:
// import styles from "@/styles/page.module.css";

interface FormFieldProps {
  username: string;
  password: string;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const { notification } = App.useApp();

  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  const {
    // value: token, // is commented out because we do not need the token value
    set: setToken, // we need this method to set the value of the token to the one we receive from the POST request to the backend server API
    // clear: clearToken, // is commented out because we do not need to clear the token when logging in
  } = useLocalStorage<string>("token", ""); // note that the key we are selecting is "token" and the default value we are setting is an empty string
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  const { set: setUserId } = useLocalStorage<string>("userId", "");   // saving the logged in user's id to localstorage --> later used for password update

  const handleRegister = async (values: FormFieldProps) => {
    try {
      // Call the API service and let it handle JSON serialization and error handling
      const response = await apiService.post<User>("/users", values);

      // Use the useLocalStorage hook that returned a setter function (setToken in line 41) to store the token if available
      if (response.token) {
        setToken(response.token);
      }

      setUserId(String(response.id));   // saving the logged in user's id to localstorage
      
      // Navigate to the user overview
      notification.success({
        title: "Account created successfully!",
        placement: "bottomRight",
        className: "custom-notification",
      });
      setTimeout(() => router.push(`/users/${response.id}/trips`), 1500); // --> dashboard

    } catch (error) {
      if (error instanceof Error) {
        const appError = error as { status?: number };
        if (appError.status === 409) {
          notification.error({
            title: "Username is already taken. Please choose a different one.",
            placement: "bottomRight",
            className: "custom-notification",
          });
        } else {
            notification.error({
              title: "Registration failed. Please try again.",
              placement: "bottomRight",
              className: "custom-notification",
            });
        }
      } else {
        console.error("An unknown error occurred during registration.");
      }
    }
  };

  const { Title, Text } = Typography;
  
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)", padding: 16 }}>
    <Card style={{ width: "100%", maxWidth: 448, background: "#fff"}}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
        <div style={{ width: 80, height: 80, background: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>✈️</span>
        </div>
        <Title level={2} style={{ margin: 0, color: "#000" }}>JointJourney</Title>
        <Text type="secondary" style={{ color: "#666" }}>Create an account</Text>
        <Text type="secondary" style={{ color: "#666" }}>Sign up to start planning your trips</Text>
      </div>
        <Form
          form={form}
          name="register"
          size="large"
          variant="outlined"
          onFinish={handleRegister}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label={<span style={{ color: "#000" }}>Username</span>}
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="Enter username" style={{ background: "#fff", color: "#000" }} />
          </Form.Item>
          <Form.Item
            name="password"
            label={<span style={{ color: "#000" }}>Password</span>}
            rules={[{ required: true, message: "Please input a password!" }]}
          >
            <Input.Password placeholder="Enter password" style={{ background: "#fff", color: "#000" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: "100%", background: "#000", borderColor: "#000" }}>
              Create Account
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "#000" }}>
            Already have an account?{" "}
            <a onClick={() => router.push("/login")} style={{ color: "#2563eb", cursor: "pointer" }}>
              Sign in
            </a>
          </div>
        </Form>
      </Card>
    </div>
  );
};
export default Register;