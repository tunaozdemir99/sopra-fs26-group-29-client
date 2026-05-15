"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { App, Button, Card, Input, Modal, Spin, Tabs, Typography } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CopyOutlined,
  ReloadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Trip } from "@/types/trip";

const { Title, Text } = Typography;

function TripLayoutInner({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const apiService = useApi();
  const { message } = App.useApp();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const isAdmin = trip ? String(userId) === String(trip.adminId) : false;

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  const fetchTrip = useCallback(async () => {
    try {
      const data = await apiService.get<Trip>(`/trips/${tripId}`);
      setTrip(data);
      localStorage.setItem(
        `trip-${tripId}-admin`,
        JSON.stringify(data.adminUsername ?? ""),
      );
      setLoading(false);
    } catch {
      message.error("Trip not found or you don't have access.");
      router.push(`/users/${userId}/trips`);
    }
  }, [apiService, tripId, router, userId, message]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleCopyInvite = () => {
    if (trip?.inviteUrl) {
      const url = `${window.location.origin}/invite/${trip.inviteUrl}`;
      navigator.clipboard.writeText(url).then(() => message.success("Invite link copied!"));
    }
  };

  const handleRegenerateLink = async () => {
    setRegenerating(true);
    try {
      const res = await apiService.put<{ inviteUrl: string }>(`/trips/${tripId}/invite`, {});
      if (trip?.inviteActive === false) {
        await apiService.patch(`/trips/${tripId}/invite`, { active: true });
      }
      setTrip((prev) => prev ? { ...prev, inviteUrl: res.inviteUrl, inviteActive: true } : prev);
      message.success("Invite link regenerated!");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to regenerate link");
    } finally {
      setRegenerating(false);
    }
  };

  const handleDeactivateLink = async () => {
    setDeactivating(true);
    try {
      await apiService.patch(`/trips/${tripId}/invite`, { active: false });
      setTrip((prev) => prev ? { ...prev, inviteActive: false } : prev);
      message.success("Invite link deactivated");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to deactivate link");
    } finally {
      setDeactivating(false);
    }
  };

  const handleAddMember = async () => {
    if (!inviteUsername.trim()) return;
    setAddingMember(true);
    try {
      await apiService.post(`/trips/${tripId}/members`, { username: inviteUsername.trim() });
      setInviteUsername("");
      message.success("Member added!");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const activeKey = pathname.endsWith("/members")
    ? "members"
    : pathname.endsWith("/settings")
    ? "settings"
    : pathname.endsWith("/ideaBucket")
    ? "ideaBucket"
    : pathname.endsWith("/activities")
    ? "activities"
    : pathname.endsWith("/map")
    ? "map"
    : pathname.endsWith("/tasks")
    ? "tasks"
    : "overview";

  const handleTabChange = (key: string) => {
    if (key === "overview") router.push(`/trips/${tripId}`);
    else if (key === "activities") router.push(`/trips/${tripId}/activities`);
    else router.push(`/trips/${tripId}/${key}`);
  };

  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: activeKey === "overview" ? children : <></>,
    },
    {
      key: "ideaBucket",
      label: "Idea Bucket",
      children: activeKey === "ideaBucket" ? children : <></>,
    },
    {
      key: "activities",
      label: "Activities",
      children: activeKey === "activities" ? children : <></>,
    },
    {
      key: "map",
      label: "Map",
      children: activeKey === "map" ? children : <></>,
    },
    {
      key: "tasks",
      label: "Tasks",
      children: activeKey === "tasks" ? children : <></>,
    },
    {
      key: "members",
      label: "Members",
      children: activeKey === "members" ? children : <></>,
    },
    {
      key: "settings",
      label: "Settings",
      children: activeKey === "settings" ? children : <></>,
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eff6ff, #e0e7ff)",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eff6ff, #e0e7ff)",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => router.push(`/users/${userId}/trips`)}
          style={{ marginBottom: 16, padding: "4px 0", color: "#2563eb" }}
        >
          Back to Trips
        </Button>

        <Card
          style={{
            marginBottom: 16,
            borderRadius: 12,
            background: "#fff",
            border: "1px solid #dbeafe",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div>
              <Title level={2} style={{ margin: "0 0 6px", color: "#111" }}>
                {trip?.title ?? `Trip ${tripId}`}
              </Title>
              {trip && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarOutlined
                    style={{ color: "#2563eb", fontSize: 13 }}
                  />
                  <Text style={{ fontSize: 13, color: "#555" }}>
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                  </Text>
                </div>
              )}
              {trip?.location && (
                <div style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 13, color: "#555" }}>
                    📍 {trip.location}
                  </Text>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              {isAdmin && (
                <Button
                  icon={<UserAddOutlined />}
                  onClick={() => setInviteModalOpen(true)}
                  style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8 }}
                >
                  Invite Members
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card
          style={{
            borderRadius: 12,
            background: "#fff",
            border: "1px solid #dbeafe",
          }}
        >
          <Tabs
            activeKey={activeKey}
            items={tabItems}
            onChange={handleTabChange}
          />
        </Card>
      </div>

      <Modal
        title={
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Invite Members</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: "#666" }}>
              Add trip members by entering their username or share the invite link
            </div>
          </div>
        }
        open={inviteModalOpen}
        onCancel={() => { setInviteModalOpen(false); setInviteUsername(""); }}
        footer={null}
        width={480}
      >
        <div style={{ marginBottom: 8, fontWeight: 600 }}>Username</div>
        <Input
          placeholder="Enter username"
          value={inviteUsername}
          onChange={(e) => setInviteUsername(e.target.value)}
          onPressEnter={handleAddMember}
          style={{ marginBottom: 4 }}
        />
        <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
          Enter the unique username of the person you want to add
        </div>
        <Button
          type="primary"
          block
          loading={addingMember}
          disabled={!inviteUsername.trim()}
          onClick={handleAddMember}
          style={{ background: "#111", color: "#fff", border: "none", borderRadius: 8, marginBottom: 20, height: 40 }}
        >
          Add Member
        </Button>

        <div style={{ textAlign: "center", color: "#aaa", fontSize: 12, marginBottom: 16, letterSpacing: 1 }}>
          OR SHARE LINK
        </div>

        <div style={{ fontWeight: 600, marginBottom: 8 }}>Invite Link</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Input
            value={trip?.inviteUrl ? `${window.location.origin}/invite/${trip.inviteUrl}` : ""}
            readOnly
            disabled={trip?.inviteActive === false}
            style={{ flex: 1 }}
          />
          <Button icon={<CopyOutlined />} onClick={handleCopyInvite} disabled={trip?.inviteActive === false} />
          <Button icon={<ReloadOutlined />} loading={regenerating} onClick={handleRegenerateLink} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#888" }}>
            {trip?.inviteActive !== false
              ? "Anyone with this link can join the trip if they have an account."
              : "Link is deactivated. Regenerate to create a new active link."}
          </div>
          {trip?.inviteActive !== false && (
            <Button danger size="small" loading={deactivating} onClick={handleDeactivateLink}>
              Deactivate
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function TripLayout(
  { children }: { children: React.ReactNode },
) {
  return (
    <App>
      <TripLayoutInner>{children}</TripLayoutInner>
    </App>
  );
}
