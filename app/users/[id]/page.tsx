"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, Typography } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const cardStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  marginBottom: 16,
  border: "1px solid #e5e7eb",
};

const Profile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const params = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUser = await apiService.get<User>(`/users/${params.id}`);
        setUser(fetchedUser);
      } catch (error) {
        if (error instanceof Error) alert(`Failed to load profile:\n${error.message}`);
      }
    };
    if (params.id) fetchUser();
  }, [apiService, params.id]);

  const handleLogout = async () => {
    try {
      await apiService.post(`/users/${userId}/logout`, {});
    } catch {
      // ignore
    } finally {
      clearToken();
      clearUserId();
      router.push("/login");
    }
  };

  const handleSaveProfile = async (values: { bio: string }) => {
    try {
      await apiService.patch(`/users/${params.id}`, { bio: values.bio, profilePicture });
      setUser({ ...user!, bio: values.bio, profilePicture });
      setIsEditingProfile(false);
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  };

  const handleChangePassword = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      await apiService.patch(`/users/${params.id}`, { password: values.password });
      passwordForm.resetFields();
      setIsChangingPassword(false);
    } catch (error) {
      if (error instanceof Error) alert(error.message);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePicture(reader.result as string);
    reader.readAsDataURL(file);
  };

  const isOwnProfile = String(params.id) === String(userId);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", padding: 32 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>My Profile</Title>
          {isOwnProfile && (
            <Button danger onClick={handleLogout}>Logout</Button>
          )}
        </div>

        {user && (
          <>
            {/* Avatar section */}
            <div style={cardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                    👤
                  </div>
                )}
                <div>
                  <Text strong style={{ fontSize: 18, display: "block" }}>{user.username}</Text>
                  <Text type="secondary">@{user.username}</Text>
                </div>
              </div>
            </div>

            {/* Profile Information section */}
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <Text strong style={{ fontSize: 16, display: "block" }}>Profile Information</Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>Update your personal details and bio</Text>
                </div>
                {isOwnProfile && !isEditingProfile && (
                  <Button
                    onClick={() => {
                      profileForm.setFieldsValue({ bio: user.bio });
                      setProfilePicture(user.profilePicture);
                      setIsEditingProfile(true);
                    }}
                    style={{ background: "#111", color: "#fff", borderColor: "#111" }}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              {isEditingProfile ? (
                <Form form={profileForm} layout="vertical" onFinish={handleSaveProfile}>
                  <Form.Item name="bio" label="Bio">
                    <Input.TextArea rows={3} placeholder="Tell others about yourself" />
                  </Form.Item>
                  <Form.Item label="Profile Picture">
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    {profilePicture && (
                      <img
                        src={profilePicture}
                        alt="Preview"
                        style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", marginTop: 8, display: "block" }}
                      />
                    )}
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ marginRight: 8, background: "#111", borderColor: "#111" }}>Save</Button>
                    <Button onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                  </Form.Item>
                </Form>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <UserOutlined style={{ color: "#999" }} />
                    <Text>@{user.username}</Text>
                  </div>
                  {user.bio && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">Bio: </Text>
                      <Text>{user.bio}</Text>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Change Password section */}
            {isOwnProfile && (
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <Text strong style={{ fontSize: 16, display: "block" }}>Change Password</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Update your account password</Text>
                  </div>
                  {!isChangingPassword && (
                    <Button
                      onClick={() => setIsChangingPassword(true)}
                      style={{ background: "#111", color: "#fff", borderColor: "#111" }}
                    >
                      Change Password
                    </Button>
                  )}
                </div>

                {isChangingPassword ? (
                  <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                    <Form.Item name="password" label="New Password" rules={[{ required: true, message: "Please enter a new password" }]}>
                      <Input.Password placeholder="Enter new password" />
                    </Form.Item>
                    <Form.Item name="confirmPassword" label="Confirm Password" rules={[{ required: true, message: "Please confirm your password" }]}>
                      <Input.Password placeholder="Confirm new password" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" style={{ marginRight: 8, background: "#111", borderColor: "#111" }}>Save</Button>
                      <Button onClick={() => { setIsChangingPassword(false); passwordForm.resetFields(); }}>Cancel</Button>
                    </Form.Item>
                  </Form>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <LockOutlined style={{ color: "#999" }} />
                    <Text>••••••••</Text>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
