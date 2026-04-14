"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Card, Typography, Button, Empty, Spin, message } from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ScheduleOutlined,
  BulbOutlined,
  CheckSquareOutlined,
  CompassOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// matches backend TripGetDTO
interface Trip {
  tripId: number;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  inviteUrl: string;
  adminUsername: string;
}

const TripDashboardPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const fetchTrip = useCallback(async () => {
    try {
      const data = await apiService.get<Trip>(`/trips/${tripId}`);
      setTrip(data);
    } catch (error) {
      const e = error as Error & { status?: number };
      if (e.status === 403) {
        message.error("You are not a member of this trip.");
        router.push("/trips");
      } else if (e.status === 404) {
        message.error("Trip not found.");
        router.push("/trips");
      } else {
        message.error(e.message ?? "Failed to load trip");
      }
    } finally {
      setLoading(false);
    }
  }, [apiService, tripId, router]);

  useEffect(() => {
    fetchTrip();
    const interval = setInterval(fetchTrip, 5000);
    return () => clearInterval(interval);
  }, [fetchTrip]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!trip) {
    return <Empty description="Trip not found" />;
  }

  const tabs = [
    { key: "members", label: "Members", icon: <TeamOutlined />, path: "members" },
    { key: "activities", label: "Activities", icon: <ScheduleOutlined />, path: "activities" },
    { key: "ideaBucket", label: "Idea Bucket", icon: <BulbOutlined />, path: "ideaBucket" },
    { key: "tasks", label: "Tasks", icon: <CheckSquareOutlined />, path: "tasks" },
    { key: "map", label: "Map", icon: <CompassOutlined />, path: "map" },
  ];

  return (
    <div className="card-container" style={{ padding: 24 }}>
      {/* Trip header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>{trip.title}</Title>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Text type="secondary">
            <EnvironmentOutlined /> {trip.location}
          </Text>
          <Text type="secondary">
            <CalendarOutlined /> {trip.startDate} – {trip.endDate}
          </Text>
          <Text type="secondary">
            Admin: @{trip.adminUsername}
          </Text>
        </div>
      </div>

      {/* Overview cards grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Card title={<><TeamOutlined /> Members</>}>
          <Text type="secondary">Member list will appear here</Text>
          {/* TODO: wire up once Member entity exists (depends on S5) */}
        </Card>

        <Card title={<><ScheduleOutlined /> Activities</>}>
          <Title level={3} style={{ margin: 0 }}>0</Title>
          <Text type="secondary">scheduled</Text>
          {/* TODO: wire up once Activity endpoints exist (S6) */}
        </Card>

        <Card title={<><BulbOutlined /> Ideas</>}>
          <Title level={3} style={{ margin: 0 }}>0</Title>
          <Text type="secondary">in bucket</Text>
          {/* TODO: wire up to /trips/{tripId}/bucketItems */}
        </Card>

        <Card title={<><CheckSquareOutlined /> Tasks</>}>
          <Title level={3} style={{ margin: 0 }}>0</Title>
          <Text type="secondary">pending</Text>
          {/* TODO: wire up once Task endpoints exist (S13) */}
        </Card>

        <Card title={<><CompassOutlined /> Map</>}>
          <Text type="secondary">Map preview will appear here</Text>
          {/* TODO: wire up once Pin endpoints exist (S7) */}
        </Card>
      </div>

      {/* Navigation tabs to individual pages */}
      <Card title="Explore">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              icon={tab.icon}
              onClick={() => router.push(`/trips/${tripId}/${tab.path}`)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TripDashboardPage;