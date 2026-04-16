"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import useLocalStorage from "@/hooks/useLocalStorage";
import { useApi } from "@/hooks/useApi";
import {
  Button, Card, Tabs, Typography, Spin, Modal, Form, Input,
  Empty, message, Popconfirm, DatePicker, TimePicker, Select,
} from "antd";
import {
  ArrowLeftOutlined, CalendarOutlined, TeamOutlined,
  BulbOutlined, ScheduleOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Trip } from "@/types/trip";
import { BucketItem } from "@/types/bucketItem";
import { Activity } from "@/types/activity";
import type { Dayjs } from "dayjs";
import type { MapMarker } from "@/components/TripMap";
import type { SelectedLocation } from "@/components/LocationSearch";

const { Title, Text } = Typography;

// Leaflet must not render on the server
const TripMap = dynamic(() => import("@/components/TripMap"), { ssr: false });
const LocationSearch = dynamic(() => import("@/components/LocationSearch"), { ssr: false });

const TripOverviewPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { value: currentUsername } = useLocalStorage<string>("username", "");

  // Trip
  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripLoading, setTripLoading] = useState(true);

  // Idea Bucket
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [bucketModalOpen, setBucketModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [bucketSubmitting, setBucketSubmitting] = useState(false);
  const [bucketForm] = Form.useForm();
  const [editForm] = Form.useForm();
  // Location for new idea (geocoded on client, stored in backend once it supports lat/lng)
  const ideaLocationRef = useRef<SelectedLocation | null>(null);

  // Activities / Timeline
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activitySubmitting, setActivitySubmitting] = useState(false);
  const [activityForm] = Form.useForm();
  const activityLocationRef = useRef<SelectedLocation | null>(null);

  useEffect(() => {
    if (!token) router.push("/login");
  }, [token, router]);

  // ── Fetch trip ──────────────────────────────────────────────────
  const fetchTrip = useCallback(async () => {
    try {
      const data = await apiService.get<Trip>(`/trips/${tripId}`);
      setTrip(data);
    } catch { /* ignore */ } finally { setTripLoading(false); }
  }, [apiService, tripId]);

  // ── Fetch bucket items ──────────────────────────────────────────
  const fetchBucketItems = useCallback(async () => {
    try {
      const data = await apiService.get<BucketItem[]>(`/trips/${tripId}/bucketItems`);
      setBucketItems(data);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  // ── Fetch activities ────────────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    try {
      const data = await apiService.get<Activity[]>(`/trips/${tripId}/timeline`);
      setActivities(data);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchTrip();
    fetchBucketItems();
    fetchActivities();
    const interval = setInterval(() => {
      fetchBucketItems();
      fetchActivities();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTrip, fetchBucketItems, fetchActivities]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── Idea Bucket handlers ────────────────────────────────────────
  const handleAddIdea = async (values: { name: string; location?: string; description?: string }) => {
    setBucketSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...values };
      // Include coordinates if the user picked a location
      // (backend will start persisting these once it adds the fields)
      if (ideaLocationRef.current) {
        payload.latitude = ideaLocationRef.current.lat;
        payload.longitude = ideaLocationRef.current.lng;
        if (!payload.location) payload.location = ideaLocationRef.current.label.split(",")[0];
      }
      const newItem = await apiService.post<BucketItem>(`/trips/${tripId}/bucketItems`, payload);
      setBucketItems((prev) => [...prev, newItem]);
      bucketForm.resetFields();
      ideaLocationRef.current = null;
      setBucketModalOpen(false);
      message.success("Idea added!");
    } catch (e) { message.error((e as Error).message ?? "Failed to add idea"); }
    finally { setBucketSubmitting(false); }
  };

  const handleEditIdea = async (values: { name: string; location?: string; description?: string }) => {
    if (!editingItem) return;
    try {
      const updated = await apiService.patch<BucketItem>(
        `/trips/${tripId}/bucketItems/${editingItem.bucketItemId}`, values
      );
      setBucketItems((prev) => prev.map((i) => i.bucketItemId === updated.bucketItemId ? updated : i));
      setEditingItem(null);
      editForm.resetFields();
      message.success("Idea updated!");
    } catch (e) { message.error((e as Error).message ?? "Failed to update idea"); }
  };

  const handleDeleteIdea = async (itemId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/bucketItems/${itemId}`);
      setBucketItems((prev) => prev.filter((i) => i.bucketItemId !== itemId));
      message.success("Idea deleted!");
    } catch (e) { message.error((e as Error).message ?? "Failed to delete idea"); }
  };

  // ── Activity handlers ───────────────────────────────────────────
  const handleAddActivity = async (values: {
    bucketItemId: number;
    date: Dayjs;
    startTime: Dayjs;
    endTime: Dayjs;
  }) => {
    setActivitySubmitting(true);
    try {
      const loc = activityLocationRef.current;
      await apiService.post<Activity>(`/trips/${tripId}/timeline`, {
        bucketItemId: values.bucketItemId,
        date: values.date.format("YYYY-MM-DD"),
        startTime: values.startTime.format("HH:mm:ss"),
        endTime: values.endTime.format("HH:mm:ss"),
        locationName: loc?.label.split(",")[0] ?? null,
        latitude: loc?.lat ?? null,
        longitude: loc?.lng ?? null,
      });
      activityForm.resetFields();
      activityLocationRef.current = null;
      setActivityModalOpen(false);
      message.success("Activity scheduled!");
      fetchActivities();
    } catch (e) { message.error((e as Error).message ?? "Failed to schedule activity"); }
    finally { setActivitySubmitting(false); }
  };

  const handleDeleteActivity = async (activityId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/timeline/${activityId}`);
      message.success("Activity removed.");
      fetchActivities();
    } catch (e) { message.error((e as Error).message ?? "Failed to remove activity"); }
  };

  // ── Map markers from activities ─────────────────────────────────
  const mapMarkers: MapMarker[] = activities
    .filter((a) => a.latitude !== null && a.longitude !== null)
    .map((a) => ({
      lat: a.latitude!,
      lng: a.longitude!,
      label: `${a.name} · ${a.date} ${a.startTime.slice(0, 5)}–${a.endTime.slice(0, 5)}`,
    }));

  // ── Tab content ─────────────────────────────────────────────────
  const overviewContent = (
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

  const ideaBucketContent = (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setBucketModalOpen(true)}>
          Add Idea
        </Button>
      </div>
      {bucketItems.length === 0 ? (
        <Empty description="No ideas yet. Be the first to add one!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {bucketItems.map((item) => (
            <Card key={item.bucketItemId} style={{ borderLeft: "4px solid #2563eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Title level={5} style={{ margin: "0 0 4px", color: "#111" }}>{item.name}</Title>
                  {item.location && (
                    <Text type="secondary" style={{ display: "block" }}>
                      <EnvironmentOutlined /> {item.location}
                    </Text>
                  )}
                  {item.description && <Text style={{ display: "block", color: "#555", marginTop: 4 }}>{item.description}</Text>}
                  <Text type="secondary" style={{ fontSize: 12 }}>Added by {item.addedBy}</Text>
                </div>
                {item.addedBy === currentUsername && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button size="small" icon={<EditOutlined />}
                      onClick={() => { setEditingItem(item); editForm.setFieldsValue(item); }} />
                    <Popconfirm title="Delete this idea?" onConfirm={() => handleDeleteIdea(item.bucketItemId)} okText="Yes" cancelText="No">
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const activitiesContent = (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { fetchBucketItems(); setActivityModalOpen(true); }}>
          Add Activity
        </Button>
      </div>
      {activities.length === 0 ? (
        <Empty description="No activities yet. Schedule one from your idea bucket!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.activityId}>
              <Card
                style={{ borderLeft: "4px solid #2563eb" }}
                extra={
                  <Button danger size="small" icon={<DeleteOutlined />}
                    onClick={() => handleDeleteActivity(activity.activityId)}>
                    Remove
                  </Button>
                }
              >
                <Title level={5} style={{ margin: "0 0 4px", color: "#111" }}>{activity.name}</Title>
                <Text type="secondary">
                  {activity.date} &nbsp;·&nbsp; {activity.startTime.slice(0, 5)}–{activity.endTime.slice(0, 5)}
                </Text>
                {activity.locationName && (
                  <div>
                    <Text type="secondary">
                      <EnvironmentOutlined /> {activity.locationName}
                    </Text>
                  </div>
                )}
              </Card>
              {index < activities.length - 1 && activity.travelTimeToNextActivity !== null && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", fontSize: 13, margin: "2px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                  <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                    🚗 ~{activity.travelTimeToNextActivity} min drive
                  </Text>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );

  const mapContent = (
    <div style={{ padding: "16px 0" }}>
      {mapMarkers.length === 0 ? (
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
            <EnvironmentOutlined /> {mapMarkers.length} location{mapMarkers.length !== 1 ? "s" : ""} pinned · Click a marker for details
          </Text>
          <TripMap markers={mapMarkers} height={450} />
        </div>
      )}
    </div>
  );

  const tabItems = [
    { key: "overview", label: "Overview", children: overviewContent },
    { key: "ideaBucket", label: "Idea Bucket", children: ideaBucketContent },
    { key: "activities", label: "Activities", children: activitiesContent },
    { key: "map", label: "Map", children: mapContent },
  ];

  if (tripLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Back button */}
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => router.push(`/users/${userId}/trips`)}
          style={{ marginBottom: 16, padding: "4px 0", color: "#2563eb" }}
        >
          Back to Trips
        </Button>

        {/* Trip header */}
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
            {trip?.adminUsername && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", padding: "4px 12px", borderRadius: 20, border: "1px solid #bfdbfe" }}>
                <TeamOutlined style={{ color: "#2563eb", fontSize: 13 }} />
                <Text style={{ fontSize: 12, color: "#2563eb" }}>Admin: {trip.adminUsername}</Text>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Card style={{ borderRadius: 12, background: "#fff", border: "1px solid #dbeafe" }}>
          <Tabs defaultActiveKey="overview" items={tabItems} />
        </Card>
      </div>

      {/* ── Add Idea Modal ── */}
      <Modal
        title="Add New Idea"
        open={bucketModalOpen}
        onCancel={() => { setBucketModalOpen(false); bucketForm.resetFields(); ideaLocationRef.current = null; }}
        footer={null}
        destroyOnHidden
      >
        <Form form={bucketForm} layout="vertical" onFinish={handleAddIdea} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Title" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Visit the Eiffel Tower" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Any details..." />
          </Form.Item>
          <Form.Item label="Location">
            <LocationSearch
              placeholder="Search for a location..."
              onSelect={(loc) => {
                ideaLocationRef.current = loc;
                bucketForm.setFieldValue("location", loc.label.split(",")[0]);
              }}
            />
            {/* Hidden field to carry the resolved location name */}
            <Form.Item name="location" noStyle><Input type="hidden" /></Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={bucketSubmitting} block>Add to Bucket</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit Idea Modal ── */}
      <Modal
        title="Edit Idea"
        open={editingItem !== null}
        onCancel={() => { setEditingItem(null); editForm.resetFields(); }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditIdea} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Title" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Location"><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Save Changes</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Add Activity Modal ── */}
      <Modal
        title="Schedule Activity"
        open={activityModalOpen}
        onCancel={() => { setActivityModalOpen(false); activityForm.resetFields(); activityLocationRef.current = null; }}
        footer={null}
        destroyOnHidden
      >
        <Form form={activityForm} layout="vertical" onFinish={handleAddActivity} style={{ marginTop: 16 }}>
          <Form.Item name="bucketItemId" label="Idea from bucket" rules={[{ required: true, message: "Please select an idea" }]}>
            <Select
              placeholder="Select from your idea bucket"
              options={bucketItems.map((b) => ({ label: b.name, value: b.bucketItemId }))}
            />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="startTime" label="Start Time" rules={[{ required: true, message: "Start time is required" }]}>
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endTime" label="End Time" rules={[{ required: true, message: "End time is required" }]}>
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Location (for map)">
            <LocationSearch
              placeholder="Search for the activity location..."
              onSelect={(loc) => { activityLocationRef.current = loc; }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={activitySubmitting} block>Schedule</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TripOverviewPage;
