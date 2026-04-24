"use client";

import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import React, { useState } from "react";

const { Title, Text } = Typography;

interface FormFieldProps {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [error, setError] = useState<string | null>(null);
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const handleLogin = async (values: FormFieldProps) => {
    try {
      const response = await apiService.post<User>("/users/login", values);
      if (response.token) {
        setToken(response.token);
      }
      setUserId(String(response.id));
      router.push(`/users/${response.id}/trips`);
      } catch {
        setError("Invalid username or password.");
      form.resetFields();
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)", padding: 16 }}>
      <Card style={{ width: "100%", maxWidth: 448, background: "#fff" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, background: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 36 }}>✈️</span>
          </div>
          <Title level={2} style={{ margin: 0, color: "#000" }}>JointJourney</Title>
          <Title level={4} style={{ margin: "4px 0 0", color: "#111" }}>Welcome back!</Title>
          <Text style={{ color: "#666" }}>Sign in to your JointJourney account</Text>
        </div>

        {error && (
          <Alert
            title="Error"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          size="large"
          variant="outlined"
          onFinish={handleLogin}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label={<span style={{ color: "#000" }}>Username</span>}
            rules={[{ required: true, message: "Please input your username!" }]}
          >
            <Input placeholder="yourusername" style={{ background: "#fff", color: "#000" }} />
          </Form.Item>
          <Form.Item
            name="password"
            label={<span style={{ color: "#000" }}>Password</span>}
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password placeholder="Enter password" style={{ background: "#fff", color: "#000" }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 8 }}>
            <Button type="primary" htmlType="submit" style={{ width: "100%", background: "#000", borderColor: "#000" }}>
              Sign In
            </Button>
          </Form.Item>
          <div style={{ textAlign: "center", fontSize: 14, color: "#000" }}>
            Don&apos;t have an account?{" "}
            <a onClick={() => router.push("/register")} style={{ color: "#2563eb", cursor: "pointer" }}>
              Sign up
            </a>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
