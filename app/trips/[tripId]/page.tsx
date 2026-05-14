"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Avatar, Card, Tag, Typography } from "antd";
import {
  BulbOutlined,
  LineChartOutlined,
  TeamOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { BucketItem } from "@/types/bucketItem";
import { Activity } from "@/types/activity";
import { Task } from "@/types/task";
import { Member } from "@/types/member";
import { Trip } from "@/types/trip";
import useLocalStorage from "@/hooks/useLocalStorage";

const { Text } = Typography;

const OverviewPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const [adminUsername, setAdminUsername] = useState<string>("");
  const { value: userId } = useLocalStorage<string>("userId", "");

  const fetchData = useCallback(async () => {
    try {
      const [m, acts, items, t, trip] = await Promise.all([
        apiService.get<Member[]>(`/trips/${tripId}/members`),
        apiService.get<Activity[]>(`/trips/${tripId}/timeline`),
        apiService.get<BucketItem[]>(`/trips/${tripId}/bucketItems`),
        apiService.get<Task[]>(`/trips/${tripId}/tasks`),
        apiService.get<Trip>(`/trips/${tripId}`),
      ]);
      setMembers(m);
      setActivities(acts);
      setBucketItems(items);
      setTasks(t);
      setAdminUsername(trip.adminUsername ?? "");
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toDo = tasks.filter((t) => t.status === "TO_DO").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = tasks.filter((t) => t.status === "DONE").length;

  const cardStyle = {
    borderRadius: 12,
    border: "1px solid #dbeafe",
    background: "#fff",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  };

  const countBadge = (n: number) => (
    <div
      style={{
        background: "#111",
        color: "#fff",
        borderRadius: 20,
        width: 24,
        height: 24,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
      }}
    >
      {n}
    </div>
  );

  return (
    <div
      style={{
        padding: "16px 0",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
      }}
    >
      {/* Trip Members */}
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <Text strong>
            <TeamOutlined style={{ marginRight: 6 }} />Trip Members
          </Text>
          {countBadge(members.length)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Avatar size={28} style={{ background: "#2563eb", fontSize: 12 }}>
                {m.username[0].toUpperCase()}
              </Avatar>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  lineHeight: 1.2,
                }}
              >
                <Text>{m.username}</Text>
                {m.username === adminUsername && (
                  <Text style={{ fontSize: 11, color: "#6b7280" }}>Admin</Text>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Activities */}
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <Text strong>
            <LineChartOutlined style={{ marginRight: 6 }} />Activities
          </Text>
          {countBadge(activities.length)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {activities.map((a) => (
            <div
              key={a.activityId}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#2563eb",
                  flexShrink: 0,
                }}
              />
              <Text>{a.name}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Idea Bucket */}
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <Text strong>
            <BulbOutlined style={{ marginRight: 6 }} />Idea Bucket
          </Text>
          {countBadge(bucketItems.length)}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {bucketItems.map((item) => (
            <div
              key={item.bucketItemId}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <Tag style={{ minWidth: 28, textAlign: "center", margin: 0 }}>
                {item.voteScore > 0 ? `+${item.voteScore}` : item.voteScore}
              </Tag>
              <Text>{item.name}</Text>
            </div>
          ))}
        </div>
      </Card>

      {/* Trip Tasks */}
      <Card style={cardStyle}>
        <div style={headerStyle}>
          <Text strong>
            <UnorderedListOutlined style={{ marginRight: 6 }} />Trip Tasks
          </Text>
          {countBadge(tasks.length)}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {[
            {
              label: "To Do",
              count: toDo,
              bg: "#f9fafb",
              border: "#e5e7eb",
              color: "#374151",
            },
            {
              label: "In Progress",
              count: inProgress,
              bg: "#eff6ff",
              border: "#bfdbfe",
              color: "#1d4ed8",
            },
            {
              label: "Done",
              count: done,
              bg: "#f0fdf4",
              border: "#bbf7d0",
              color: "#15803d",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "8px 4px",
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>
                {s.count}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {(() => {
          const assignedToMe =
            tasks.filter((t) => String(t.assignee.id) === String(userId))
              .length;
          return assignedToMe > 0
            ? (
              <div
                style={{
                  background: "#eff6ff",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                <Text style={{ fontSize: 12, color: "#2563eb" }}>
                  {assignedToMe} task{assignedToMe !== 1 ? "s" : ""}{" "}
                  assigned to you
                </Text>
              </div>
            )
            : null;
        })()}
      </Card>
    </div>
  );
};

export default OverviewPage;
