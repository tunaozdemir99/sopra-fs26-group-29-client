"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import {
  Alert, App, Button, Card, DatePicker, Form, InputNumber, Modal, Empty,
  TimePicker, Typography, Input, Tag,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, EnvironmentOutlined, ClockCircleOutlined, BulbOutlined, WarningOutlined, CloseCircleOutlined, ArrowRightOutlined, CarOutlined} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { Activity } from "@/types/activity";
import { Trip } from "@/types/trip"; 
import LocationSearch, { SelectedLocation } from "@/components/LocationSearch";


const { Title, Text } = Typography;

const formatDuration = (minutes: number | null): string | null => {
  if (minutes === null) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

async function fetchOsrmTravelMinutes(
  fromLat: number, fromLon: number,
  toLat: number, toLon: number,
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const seconds: number | undefined = data?.routes?.[0]?.duration;
    return seconds != null ? Math.ceil(seconds / 60) : null;
  } catch {
    return null;
  }
}

const TimelinePage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [travelTimes, setTravelTimes] = useState<Record<number, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const { message } = App.useApp();
  const [tripStartDate, setTripStartDate] = useState<string | null>(null);

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

  useEffect(() => {
    apiService.get<Trip>(`/trips/${tripId}`).then((data) => {
      setTripStartDate(data.startDate);
    }).catch(() => {});
  }, [apiService, tripId]);

  // Compute travel times via OSRM for consecutive same-day pairs that have coordinates
  useEffect(() => {
    const sorted = [...activities].sort((a, b) =>
      a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)
    );

    const pairs: Array<{ id: number; fromLat: number; fromLon: number; toLat: number; toLon: number }> = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      if (
        cur.date === next.date &&
        cur.latitude != null && cur.longitude != null &&
        next.latitude != null && next.longitude != null
      ) {
        pairs.push({ id: cur.activityId, fromLat: cur.latitude, fromLon: cur.longitude, toLat: next.latitude, toLon: next.longitude });
      }
    }

    if (pairs.length === 0) return;

    let cancelled = false;
    Promise.all(
      pairs.map(async (p) => {
        const mins = await fetchOsrmTravelMinutes(p.fromLat, p.fromLon, p.toLat, p.toLon);
        return { id: p.id, mins };
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<number, number> = {};
      results.forEach(({ id, mins }) => { if (mins != null) map[id] = mins; });
      setTravelTimes(map);
    });

    return () => { cancelled = true; };
  }, [activities]);

  const handleSubmit = async (values: {
    name: string;
    date: Dayjs;
    startTime: Dayjs;
    endTime: Dayjs;
    locationName?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setSubmitting(true);
    try {
      await apiService.post<Activity>(`/trips/${tripId}/timeline`, {
        name: values.name,
        date: values.date.format("YYYY-MM-DD"),
        startTime: values.startTime.format("HH:mm:ss"),
        endTime: values.endTime.format("HH:mm:ss"),
        locationName: values.locationName ?? null,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
      });
      form.resetFields();
      setModalOpen(false);
      message.success("Activity scheduled!");
      fetchActivities();
    } catch (e) { message.error((e as Error).message ?? "Failed to schedule activity"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (activityId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/timeline/${activityId}`);
      message.success("Activity removed.");
      fetchActivities();
    } catch (e) { message.error((e as Error).message ?? "Failed to remove activity"); }
  };

  const handleOpenEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    editForm.resetFields();
    editForm.setFieldsValue({
      name: activity.name,
      date: dayjs(activity.date),
      startTime: dayjs(activity.startTime, "HH:mm:ss"),
      endTime: dayjs(activity.endTime, "HH:mm:ss"),
      locationName: activity.locationName ?? "",
      latitude: activity.latitude ?? null,
      longitude: activity.longitude ?? null,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: {
    name: string;
    date: Dayjs;
    startTime: Dayjs;
    endTime: Dayjs;
    locationName?: string;
    latitude?: number;
    longitude?: number;
  }) => {
    if (!editingActivity) return;
    setEditSubmitting(true);
    try {
      await apiService.put<Activity>(`/trips/${tripId}/timeline/${editingActivity.activityId}`, {
        name: values.name,
        date: values.date.format("YYYY-MM-DD"),
        startTime: values.startTime.format("HH:mm:ss"),
        endTime: values.endTime.format("HH:mm:ss"),
        locationName: values.locationName || null,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
      });
      message.success("Activity updated.");
      setEditModalOpen(false);
      setEditingActivity(null);
      editForm.resetFields();
      fetchActivities();
    } catch (e) { message.error((e as Error).message ?? "Failed to update activity"); }
    finally { setEditSubmitting(false); }
  };

  const toMinutes = (time: string) => {
    const [h, m, s] = time.split(":").map(Number);
    return h * 60 + m + (s >= 30 ? 1 : 0);
  };

  const sorted = [...activities].sort((a, b) =>
    a.date !== b.date ? a.date.localeCompare(b.date) : a.startTime.localeCompare(b.startTime)
  );

  const hasOverlapWith = (cur: Activity, next: Activity): boolean => {
    if (cur.hasOverlapConflict !== null && cur.hasOverlapConflict !== undefined) {
      return cur.hasOverlapConflict;
    }
    if (cur.gapToNextActivityMinutes !== null) return cur.gapToNextActivityMinutes < 0;
    return cur.date === next.date && toMinutes(cur.endTime) > toMinutes(next.startTime);
  };

  const handleLocationSelect = (loc: SelectedLocation, formInstance: ReturnType<typeof Form.useForm>[0]) => {
    formInstance.setFieldsValue({
      locationName: loc.label.split(",")[0].trim(),
      latitude: loc.lat,
      longitude: loc.lng,
    });
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}>
          Add Activity
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Empty description="No activities yet. Add one to get started!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {sorted.map((activity, index) => {
            const next = index < sorted.length - 1 ? sorted[index + 1] : null;
            const prev = index > 0 ? sorted[index - 1] : null;
            const isFirstOfDay = !prev || prev.date !== activity.date;
            const isSameDayAsNext = next !== null && next.date === activity.date;

            const overlapWithNext = next ? hasOverlapWith(activity, next) : false;
            const overlapWithPrev = prev ? hasOverlapWith(prev, activity) : false;
            const hasOverlap = overlapWithNext || overlapWithPrev;

            const gap = activity.gapToNextActivityMinutes;
            const travel = activity.travelTimeToNextActivity ?? travelTimes[activity.activityId] ?? null;
            const freeTime = gap !== null && travel !== null ? gap - travel : null;
            const hasTravelWarning = isSameDayAsNext
              && (activity.hasTravelTimeConflict || (freeTime !== null && freeTime < 0 && gap !== null));


            const duration = formatDuration(activity.durationMinutes);

            return (
              <React.Fragment key={activity.activityId}>
                {isFirstOfDay && (
                  <div style={{
                    padding: "10px 0 6px",
                    marginTop: index === 0 ? 0 : 8,
                    borderBottom: "1px solid #e5e7eb",
                    marginBottom: 8,
                  }}>
                    <Text strong style={{ color: "#2563eb", fontSize: 13, textTransform: "uppercase", letterSpacing: 1 }}>
                      {dayjs(activity.date).format("dddd, MMMM D, YYYY")}
                    </Text>
                  </div>
                )}

                <Card
                  style={{
                    borderLeft: hasOverlap ? "4px solid #ff4d4f" : "4px solid #2563eb",
                    marginBottom: isSameDayAsNext ? 0 : 12,
                    borderRadius: 8,
                  }}
                  extra={
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditModal(activity)}>Edit</Button>
                      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(activity.activityId)}>Remove</Button>
                    </div>
                  }
                >
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 12px" }}>
                    <Title level={5} style={{ margin: 0, color: "#111" }}>{activity.name}</Title>
                    {activity.fromBucketItem && (
                      <Tag icon={<BulbOutlined />} color="gold" style={{ margin: 0 }}>From Idea Bucket</Tag>
                    )}
                  </div>
                  <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                    <ClockCircleOutlined /> {activity.startTime.slice(0, 5)} – {activity.endTime.slice(0, 5)}{duration ? ` (${duration})` : ""}
                  </Text>
                  {activity.locationName && (
                    <div style={{ marginTop: 2 }}>
                      <Text type="secondary"><EnvironmentOutlined /> {activity.locationName}</Text>
                    </div>
                  )}
                  {hasOverlap && (
                    <Alert
                      type="error"
                      showIcon
                      icon={<CloseCircleOutlined />}
                      style={{ marginTop: 8 }}
                      title={<span style={{ color: "#dc2626" }}>Time overlap conflict with adjacent activity.</span>}
                    />
                  )}
                  {hasTravelWarning && next && travel !== null && freeTime !== null && (
                    <Alert
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                      style={{ marginTop: 8 }}
                      title={<span style={{ color: "#d97706" }}>{`Insufficient time to travel to "${next.name}". Need ${travel} min, have ${gap} min.`}</span>}
                    />
                  )}
                </Card>
                  {isSameDayAsNext && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, margin: "4px 0" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        border: "1px solid #d1d5db", borderRadius: 6,
                        padding: "2px 8px",
                      }}>
                        <CarOutlined style={{ color: "#9ca3af", fontSize: 11 }} />
                        <ArrowRightOutlined style={{ color: "#d1d5db", fontSize: 10 }} />
                        {travel !== null ? (
                          <span style={{ fontSize: 13, color: "#6b7280" }}><strong>{travel} min</strong> travel time</span>
                        ) : (
                          <span style={{ fontSize: 11, color: "#d1d5db" }}>add a location to see travel time</span>
                        )}
                      </span>
                    </div>
                  )}


              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Add Activity Modal */}
      <Modal title="Schedule Activity" open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Activity Name" rules={[{ required: true, message: "Please enter a name" }]}>
            <Input placeholder="e.g. Hiking at Uetliberg" />
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
            <DatePicker
              style={{ width: "100%" }}
              defaultPickerValue={tripStartDate ? dayjs(tripStartDate) : undefined}
            />
          </Form.Item>
          <Form.Item name="startTime" label="Start Time" rules={[{ required: true, message: "Start time is required" }]}>
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endTime" label="End Time" rules={[{ required: true, message: "End time is required" }]}>
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Location" required>
            <LocationSearch
              placeholder="Search for a location..."
              onSelect={(loc) => handleLocationSelect(loc, form)}
            />
          </Form.Item>
          <Form.Item name="locationName" rules={[{ required: true, message: "Please select a location" }]}>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item name="latitude" noStyle><InputNumber style={{ display: "none" }} /></Form.Item>
          <Form.Item name="longitude" noStyle><InputNumber style={{ display: "none" }} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Schedule</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Activity Modal */}
      <Modal title="Edit Activity" open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingActivity(null); editForm.resetFields(); }}
        footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Activity Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
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
          <Form.Item label="Location">
            <LocationSearch
              key={editingActivity?.activityId}
              placeholder="Search for a location..."
              initialValue={editingActivity?.locationName ?? ""}
              onSelect={(loc) => handleLocationSelect(loc, editForm)}
            />
          </Form.Item>
          <Form.Item name="locationName" noStyle><Input type="hidden" /></Form.Item>
          <Form.Item name="latitude" noStyle><InputNumber style={{ display: "none" }} /></Form.Item>
          <Form.Item name="longitude" noStyle><InputNumber style={{ display: "none" }} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={editSubmitting} block>Save Changes</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimelinePage;
