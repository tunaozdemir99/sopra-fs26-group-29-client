// your code here for S2 to display a single user profile after having clicked on it
// each user has their own slug /[id] (/1, /2, /3, ...) and is displayed using this file
// try to leverage the component library from antd by utilizing "Card" to display the individual user
// import { Card } from "antd"; // similar to /app/users/page.tsx

"use client";
// For components that need React hooks and browser APIs,
// SSR (server side rendering) has to be disabled.
// Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Card } from "antd";

const Profile: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { value: token, clear: clearToken } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");

  // client#6 issue redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  // client#4 issue for logout: invalidate session and redirect to landing page
  const handleLogout = async () => {
    try {
      await apiService.post(`/users/${userId}/logout`, {});
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearToken();
      clearUserId();
      router.push("/login");
    }
  };

  return (
    <div className="card-container">
      <Card title="Profile">
        <p>
          <strong>SampleUser</strong>
        </p>
        <Button type="primary" danger onClick={handleLogout}>
          Logout
        </Button>
      </Card>
    </div>
  );
};

export default Profile;