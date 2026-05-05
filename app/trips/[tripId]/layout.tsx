"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import { Button, Card, Tabs, Typography, Spin, message, Tooltip } from "antd";
import { ArrowLeftOutlined, CalendarOutlined, TeamOutlined, ShareAltOutlined } from "@ant-design/icons";
import { Trip } from "@/types/trip";

const { Title, Text } = Typography;

export default function TripLayout({ children }: { children: React.ReactNode }) {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  const fetchTrip = useCallback(async () => {
    try {
      const data = await apiService.get<Trip>(`/trips/${tripId}`);
      setTrip(data);
      localStorage.setItem(`trip-${tripId}-admin`, JSON.stringify(data.adminUsername ?? ""));
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [apiService, tripId]);

  useEffect(() => { fetchTrip(); }, [fetchTrip]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleCopyInvite = () => {
    if (trip?.inviteUrl) {
      const url = `${window.location.origin}/invite/${trip.inviteUrl}`;
      navigator.clipboard.writeText(url).then(() => message.success("Invite link copied!"));
    }
  };

  const activeKey = pathname.endsWith("/ideaBucket") ? "ideaBucket"
    : pathname.endsWith("/activities") ? "activities"
    : pathname.endsWith("/map") ? "map"
    : pathname.endsWith("/tasks") ? "tasks"
    : "overview";

  const handleTabChange = (key: string) => {
    if (key === "overview") router.push(`/trips/${tripId}`);
    else if (key === "activities") router.push(`/trips/${tripId}/activities`);
    else router.push(`/trips/${tripId}/${key}`);
  };

  const tabItems = [
    { key: "overview",   label: "Overview",     children: activeKey === "overview"   ? children : <></> },
    { key: "ideaBucket", label: "Idea Bucket",   children: activeKey === "ideaBucket" ? children : <></> },
    { key: "activities", label: "Activities",    children: activeKey === "activities" ? children : <></> },
    { key: "map",        label: "Map",           children: activeKey === "map"        ? children : <></> },
    { key: "tasks",      label: "Tasks",         children: activeKey === "tasks"      ? children : <></> },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)" }}>
      <Spin size="large" />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Button icon={<ArrowLeftOutlined />} type="text"
          onClick={() => router.push(`/users/${userId}/trips`)}
          style={{ marginBottom: 16, padding: "4px 0", color: "#2563eb" }}>
          Back to Trips
        </Button>

        <Card style={{ marginBottom: 16, borderRadius: 12, background: "#fff", border: "1px solid #dbeafe" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <Title level={2} style={{ margin: "0 0 6px", color: "#111" }}>
                {trip?.title ?? `Trip ${tripId}`}
              </Title>
              {trip && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CalendarOutlined style={{ color: "#2563eb", fontSize: 13 }} />
                  <Text style={{ fontSize: 13, color: "#555" }}>
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                  </Text>
                </div>
              )}
              {trip?.location && (
                <div style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 13, color: "#555" }}>📍 {trip.location}</Text>
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              {trip?.adminUsername && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", padding: "4px 12px", borderRadius: 20, border: "1px solid #bfdbfe" }}>
                  <TeamOutlined style={{ color: "#2563eb", fontSize: 13 }} />
                  <Text style={{ fontSize: 12, color: "#2563eb" }}>Admin: {trip.adminUsername}</Text>
                </div>
              )}
              {trip?.inviteUrl && (
                <Tooltip title="Copy invite link to share with others">
                  <Button icon={<ShareAltOutlined />} size="small" onClick={handleCopyInvite}>
                    Share Trip
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        </Card>

        <Card style={{ borderRadius: 12, background: "#fff", border: "1px solid #dbeafe" }}>
          <Tabs activeKey={activeKey} items={tabItems} onChange={handleTabChange} />
        </Card>
      </div>
    </div>
  );
}
