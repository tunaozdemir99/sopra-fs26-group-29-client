"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Card, Typography } from "antd";
import { BulbOutlined, ScheduleOutlined } from "@ant-design/icons";
import { BucketItem } from "@/types/bucketItem";
import { Activity } from "@/types/activity";

const { Title, Text } = Typography;

const OverviewPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [items, acts] = await Promise.all([
        apiService.get<BucketItem[]>(`/trips/${tripId}/bucketItems`),
        apiService.get<Activity[]>(`/trips/${tripId}/timeline`),
      ]);
      setBucketItems(items);
      setActivities(acts);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ textAlign: "center", background: "#f8faff", border: "1px solid #dbeafe" }}>
          <BulbOutlined style={{ fontSize: 28, color: "#2563eb", marginBottom: 8 }} />
          <Title level={4} style={{ margin: "8px 0 4px", color: "#111" }}>Idea Bucket</Title>
          <Text type="secondary">{bucketItems.length} idea{bucketItems.length !== 1 ? "s" : ""}</Text>
        </Card>
        <Card style={{ textAlign: "center", background: "#f8faff", border: "1px solid #dbeafe" }}>
          <ScheduleOutlined style={{ fontSize: 28, color: "#2563eb", marginBottom: 8 }} />
          <Title level={4} style={{ margin: "8px 0 4px", color: "#111" }}>Activities</Title>
          <Text type="secondary">{activities.length} scheduled</Text>
        </Card>
      </div>
    </div>
  );
};

export default OverviewPage;
