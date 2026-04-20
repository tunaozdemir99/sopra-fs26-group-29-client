"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import {
  Button, Card, DatePicker, Form, InputNumber, Modal, Empty,
  message, Select, TimePicker, Typography, Input,
} from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined, EnvironmentOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { Activity } from "@/types/activity";
import { BucketItem } from "@/types/bucketItem";

const { Title, Text } = Typography;

const TimelinePage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchActivities = useCallback(async () => {
    try {
      const data = await apiService.get<Activity[]>(`/trips/${tripId}/timeline`);
      setActivities(data);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  const fetchBucketItems = useCallback(async () => {
    try {
      const data = await apiService.get<BucketItem[]>(`/trips/${tripId}/bucketItems`);
      setBucketItems(data);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 5000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const handleSubmit = async (values: {
    bucketItemId: number;
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
        bucketItemId: values.bucketItemId,
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
    editForm.setFieldsValue({
      date: dayjs(activity.date),
      startTime: dayjs(activity.startTime, "HH:mm:ss"),
      endTime: dayjs(activity.endTime, "HH:mm:ss"),
      locationName: activity.locationName ?? undefined,
      latitude: activity.latitude ?? undefined,
      longitude: activity.longitude ?? undefined,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: {
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
        date: values.date.format("YYYY-MM-DD"),
        startTime: values.startTime.format("HH:mm:ss"),
        endTime: values.endTime.format("HH:mm:ss"),
        locationName: values.locationName ?? null,
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

  const overlapsNext = (cur: Activity, next: Activity) =>
    cur.date === next.date && toMinutes(cur.endTime) > toMinutes(next.startTime);

  const travelWarning = (cur: Activity, next: Activity) =>
    cur.date === next.date && cur.travelTimeToNextActivity !== null &&
    toMinutes(next.startTime) - toMinutes(cur.endTime) < cur.travelTimeToNextActivity;

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { fetchBucketItems(); setModalOpen(true); }}>
          Add Activity
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Empty description="No activities yet. Schedule one from your idea bucket!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((activity, index) => {
            const next = index < sorted.length - 1 ? sorted[index + 1] : null;
            const hasOverlap = (next && overlapsNext(activity, next)) ||
              (index > 0 && overlapsNext(sorted[index - 1], activity));
            const hasTravel = next ? travelWarning(activity, next) : false;

            return (
              <React.Fragment key={activity.activityId}>
                <Card
                  style={{
                    borderLeft: "4px solid #2563eb",
                    borderColor: hasOverlap ? "#ff4d4f" : undefined,
                    borderWidth: hasOverlap ? 2 : undefined,
                  }}
                  extra={
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenEditModal(activity)}>Edit</Button>
                      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(activity.activityId)}>Remove</Button>
                    </div>
                  }
                >
                  <Title level={5} style={{ margin: "0 0 4px", color: "#111" }}>{activity.name}</Title>
                  <Text type="secondary">
                    {activity.date} &nbsp;·&nbsp; {activity.startTime.slice(0, 5)}–{activity.endTime.slice(0, 5)}
                  </Text>
                  {activity.locationName && (
                    <div>
                      <Text type="secondary"><EnvironmentOutlined /> {activity.locationName}</Text>
                    </div>
                  )}
                  {hasOverlap && <div><Text type="danger">Time overlap conflict with adjacent activity.</Text></div>}
                  {hasTravel && <div><Text type="warning">Travel-time warning: gap to next activity may be too short.</Text></div>}
                </Card>

                {index < sorted.length - 1 && activity.travelTimeToNextActivity !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#888", fontSize: 13, margin: "2px 0" }}>
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                    <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                      🚗 ~{activity.travelTimeToNextActivity} min drive
                    </Text>
                    <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <Modal title="Schedule Activity" open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }} footer={null} destroyOnHidden>
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="bucketItemId" label="Idea from bucket" rules={[{ required: true, message: "Please select an idea" }]}>
            <Select placeholder="Select from your idea bucket"
              options={bucketItems.map((b) => ({ label: b.name, value: b.bucketItemId }))} />
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
          <Form.Item name="locationName" label="Location Name">
            <Input placeholder="e.g. Zurich Art Museum" />
          </Form.Item>
          <Form.Item name="latitude" label="Latitude">
            <InputNumber placeholder="e.g. 47.3769" style={{ width: "100%" }} step={0.0001} />
          </Form.Item>
          <Form.Item name="longitude" label="Longitude">
            <InputNumber placeholder="e.g. 8.5417" style={{ width: "100%" }} step={0.0001} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Schedule</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Edit Activity" open={editModalOpen}
        onCancel={() => { setEditModalOpen(false); setEditingActivity(null); editForm.resetFields(); }}
        footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="startTime" label="Start Time" rules={[{ required: true, message: "Start time is required" }]}>
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endTime" label="End Time" rules={[{ required: true, message: "End time is required" }]}>
            <TimePicker format="HH:mm" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="locationName" label="Location Name">
            <Input placeholder="e.g. Zurich Art Museum" />
          </Form.Item>
          <Form.Item name="latitude" label="Latitude">
            <InputNumber placeholder="e.g. 47.3769" style={{ width: "100%" }} step={0.0001} />
          </Form.Item>
          <Form.Item name="longitude" label="Longitude">
            <InputNumber placeholder="e.g. 8.5417" style={{ width: "100%" }} step={0.0001} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={editSubmitting} block>Save Changes</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimelinePage;
