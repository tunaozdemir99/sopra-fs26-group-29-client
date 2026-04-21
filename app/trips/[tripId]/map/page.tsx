"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useApi } from "@/hooks/useApi";
import { Button, Card, Empty, Typography, List, Popconfirm, message } from "antd";
import { EnvironmentOutlined, DeleteOutlined, PushpinOutlined } from "@ant-design/icons";
import LocationSearch, { SelectedLocation } from "@/components/LocationSearch";
import type { MapMarker } from "@/components/TripMap";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

const { Title, Text } = Typography;

interface Pin {
  pinId: number;
  name: string;
  latitude: number;
  longitude: number;
}

const MapPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [pinning, setPinning] = useState(false);

  const fetchPins = useCallback(async () => {
    try {
      const data = await apiService.get<Pin[]>(`/trips/${tripId}/pins`);
      setPins(data);
    } catch { /* ignore poll errors */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchPins();
    const interval = setInterval(fetchPins, 5000);
    return () => clearInterval(interval);
  }, [fetchPins]);

  const handlePinToTrip = async () => {
    if (!selectedLocation) return;
    setPinning(true);
    try {
      const newPin = await apiService.post<Pin>(`/trips/${tripId}/pins`, {
        name: selectedLocation.label.split(",")[0],
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
      setPins((prev) => [...prev, newPin]);
      setSelectedLocation(null);
      message.success("Location pinned!");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to pin location");
    } finally {
      setPinning(false);
    }
  };

  const handleDelete = async (pinId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/pins/${pinId}`);
      setPins((prev) => prev.filter((p) => p.pinId !== pinId));
      message.success("Pin removed!");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to delete pin");
    }
  };

  const markers: MapMarker[] = pins.map((p) => ({
    lat: p.latitude,
    lng: p.longitude,
    label: p.name,
  }));

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Search + Pin to Trip */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          <EnvironmentOutlined /> Search & Pin a Location
        </Title>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <LocationSearch
              onSelect={(loc) => setSelectedLocation(loc)}
              placeholder="Search for a place..."
            />
          </div>
          <Button
            type="primary"
            icon={<PushpinOutlined />}
            onClick={handlePinToTrip}
            loading={pinning}
            disabled={!selectedLocation}
          >
            Pin to Trip
          </Button>
        </div>
      </Card>

      {/* Map */}
      <TripMap markers={markers} height={450} />

      {/* Pin list */}
      <Card style={{ marginTop: 16 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          <PushpinOutlined /> Pinned Locations ({pins.length})
        </Title>
        {pins.length === 0 ? (
          <Empty description="No pinned locations yet. Search and pin places above!" />
        ) : (
          <List
            size="small"
            dataSource={pins}
            renderItem={(pin) => (
              <List.Item
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Remove this pin?"
                    onConfirm={() => handleDelete(pin.pinId)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Remove
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Text>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  {pin.name}
                </Text>
                <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                  ({pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)})
                </Text>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default MapPage;