"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useApi } from "@/hooks/useApi";
import { Empty, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { Activity } from "@/types/activity";
import type { MapMarker } from "@/components/TripMap";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

const { Text } = Typography;

const MapPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchActivities = useCallback(async () => {
    try {
      const data = await apiService.get<Activity[]>(`/trips/${tripId}/timeline`);
      setActivities(data);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 5000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const markers: MapMarker[] = activities
    .filter((a) => a.latitude !== null && a.longitude !== null)
    .map((a) => ({
      lat: a.latitude!,
      lng: a.longitude!,
      label: `${a.name} · ${a.date} ${a.startTime.slice(0, 5)}–${a.endTime.slice(0, 5)}`,
    }));

  return (
    <div style={{ padding: "16px 0" }}>
      {markers.length === 0 ? (
        <div>
          <Empty
            description="No pinned locations yet. Add locations when scheduling activities."
            style={{ marginBottom: 16 }}
          />
          <TripMap markers={[]} height={350} />
        </div>
      ) : (
        <div>
          <Text type="secondary" style={{ display: "block", marginBottom: 12 }}>
            <EnvironmentOutlined /> {markers.length} location{markers.length !== 1 ? "s" : ""} pinned · Click a marker for details
          </Text>
          <TripMap markers={markers} height={450} />
        </div>
      )}
    </div>
  );
};

export default MapPage;
