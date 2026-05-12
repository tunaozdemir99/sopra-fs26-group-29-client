"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useApi } from "@/hooks/useApi";
import { App, Button, Card, DatePicker, Empty, Form, Input, Modal, Popconfirm, Select, Typography } from "antd";
import { CalendarOutlined, DeleteOutlined, EnvironmentOutlined, PushpinOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import LocationSearch, { SelectedLocation } from "@/components/LocationSearch";
import { Trip } from "@/types/trip";
import type { MapMarker } from "@/components/TripMap";

const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });

const { Title, Text } = Typography;

const TIME_OPTIONS = Array.from({ length: 96 }, (_, i) => {
  const h = String(Math.floor(i / 4)).padStart(2, "0");
  const m = String((i % 4) * 15).padStart(2, "0");
  return `${h}:${m}`;
});

interface Pin {
  pinId: number;
  name: string;
  latitude: number;
  longitude: number;
}

const MapPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const { message } = App.useApp();
  const [pins, setPins] = useState<Pin[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);
  const [pinning, setPinning] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [tripStartDate, setTripStartDate] = useState<string | null>(null);
  const [tripEndDate, setTripEndDate] = useState<string | null>(null);
  const [scheduleForm] = Form.useForm();
  const scheduleStartTime = Form.useWatch("startTime", scheduleForm);

  useEffect(() => {
    apiService.get<Trip>(`/trips/${tripId}`).then((data) => {
      setTripStartDate(data.startDate);
      setTripEndDate(data.endDate);
    }).catch(() => {});
  }, [apiService, tripId]);

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

  const handleScheduleFromMap = async (values: { name: string; date: Dayjs; startTime: string; endTime: string }) => {
    if (!selectedLocation) return;
    setScheduling(true);
    try {
      await apiService.post(`/trips/${tripId}/timeline`, {
        name: values.name,
        date: values.date.format("YYYY-MM-DD"),
        startTime: values.startTime + ":00",
        endTime: values.endTime + ":00",
        locationName: selectedLocation.label.split(",")[0].trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });
      message.success("Activity added to timeline!");
      setScheduleModalOpen(false);
      scheduleForm.resetFields();
    } catch (e) {
      message.error((e as Error).message ?? "Failed to add activity");
    } finally {
      setScheduling(false);
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

  const markers: MapMarker[] = [
    ...pins.map((p) => ({ lat: p.latitude, lng: p.longitude, label: p.name })),
    ...(selectedLocation ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng, label: selectedLocation.label.split(",")[0].trim() }] : []),
  ];

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
          <Button
            icon={<CalendarOutlined />}
            onClick={() => {
              if (!selectedLocation) return;
              scheduleForm.setFieldsValue({ name: selectedLocation.label.split(",")[0].trim() });
              setScheduleModalOpen(true);
            }}
            disabled={!selectedLocation}
          >
            Add to Timeline
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            {pins.map((pin) => (
              <div
                key={pin.pinId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <div>
                  <Text>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    {pin.name}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    ({pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)})
                  </Text>
                </div>
                <Popconfirm
                  title="Remove this pin?"
                  onConfirm={() => handleDelete(pin.pinId)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    Remove
                  </Button>
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title="Add to Timeline"
        open={scheduleModalOpen}
        onCancel={() => { setScheduleModalOpen(false); scheduleForm.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <Form form={scheduleForm} layout="vertical" onFinish={handleScheduleFromMap} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Activity Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Visit the lake" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
            <DatePicker
              style={{ width: "100%" }}
              defaultPickerValue={tripStartDate ? dayjs(tripStartDate) : undefined}
              disabledDate={(d) =>
                (tripStartDate ? d.isBefore(dayjs(tripStartDate), "day") : false) ||
                (tripEndDate ? d.isAfter(dayjs(tripEndDate), "day") : false)
              }
            />
          </Form.Item>
          <Form.Item name="startTime" label="Start Time" rules={[{ required: true, message: "Start time is required" }]}>
            <Select
              options={TIME_OPTIONS.map(t => ({ label: t, value: t }))}
              placeholder="Select start time"
              style={{ width: "100%" }}
              onChange={(val) => {
                const end = scheduleForm.getFieldValue("endTime");
                if (end && end <= val) scheduleForm.setFieldValue("endTime", undefined);
              }}
            />
          </Form.Item>
          <Form.Item name="endTime" label="End Time" rules={[{ required: true, message: "End time is required" }]}>
            <Select
              options={TIME_OPTIONS.filter(t => !scheduleStartTime || t > scheduleStartTime).map(t => ({ label: t, value: t }))}
              placeholder="Select end time"
              disabled={!scheduleStartTime}
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={scheduling} block>
              Add to Timeline
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MapPage;