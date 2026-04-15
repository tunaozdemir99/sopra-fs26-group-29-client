"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  Button,
  Card,
  DatePicker,
  Form,
  InputNumber,
  Modal,
  Empty,
  message,
  Select,
  TimePicker,
  Typography,
  Input,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { Activity } from "@/types/activity";
import { BucketItem } from "@/types/bucketItem";

const { Title, Text } = Typography;

const TimelinePage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [bucketItems, setBucketItems] = useState<BucketItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const fetchActivities = useCallback(async () => {
    try {
      const data = await apiService.get<Activity[]>(`/trips/${tripId}/timeline`);
      setActivities(data);
    } catch {
      // ignore poll errors
    }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 5000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  const fetchBucketItems = useCallback(async () => {
    try {
      const data = await apiService.get<BucketItem[]>(`/trips/${tripId}/bucketItems`);
      setBucketItems(data);
    } catch {
      // ignore errors
    }
  }, [apiService, tripId]);

  const handleOpenModal = () => {
    fetchBucketItems();
    setModalOpen(true);
  };

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
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to schedule activity");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (activityId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/timeline/${activityId}`);
      message.success("Activity removed.");
      fetchActivities();
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to remove activity");
    }
  };

  return (
    <div className="card-container">
      <div style={{ width: "100%", maxWidth: 680 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => router.push(`/trips/${tripId}`)}
          >
            Back to Trip
          </Button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Title level={2}>Timeline</Title>
          <Button type="primary" onClick={handleOpenModal}>
            + Add Activity
          </Button>
        </div>

        {activities.length === 0 ? (
          <Empty description="No activities yet. Schedule one from your idea bucket!" />
        ) : (
          activities.map((activity, index) => (
            <React.Fragment key={activity.activityId}>
              <Card
                style={{ marginBottom: 8 }}
                extra={
                  <Button
                    danger
                    size="small"
                    onClick={() => handleDelete(activity.activityId)}
                  >
                    Remove
                  </Button>
                }
              >
                <Title level={4} style={{ margin: 0 }}>
                  {activity.name}
                </Title>
                <Text type="secondary">
                  {activity.date} &nbsp;·&nbsp; {activity.startTime.slice(0, 5)}–{activity.endTime.slice(0, 5)}
                </Text>
                {activity.locationName && (
                  <div>
                    <Text type="secondary">📍 {activity.locationName}</Text>
                  </div>
                )}
              </Card>

              {index < activities.length - 1 && activity.travelTimeToNextActivity !== null && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    margin: "4px 0",
                    color: "#888",
                    fontSize: 13,
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: "#333" }} />
                  <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                    🚗 ~{activity.travelTimeToNextActivity} min drive
                  </Text>
                  <div style={{ flex: 1, height: 1, background: "#333" }} />
                </div>
              )}

              {index < activities.length - 1 && activity.travelTimeToNextActivity === null && (
                <div style={{ height: 8 }} />
              )}
            </React.Fragment>
          ))
        )}

        <Modal
          title="Schedule Activity"
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="bucketItemId"
              label="Idea"
              rules={[{ required: true, message: "Please select an idea" }]}
            >
              <Select
                placeholder="Select from your idea bucket"
                options={bucketItems.map((b) => ({
                  label: b.name,
                  value: b.bucketItemId,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: "Date is required" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="startTime"
              label="Start Time"
              rules={[{ required: true, message: "Start time is required" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="endTime"
              label="End Time"
              rules={[{ required: true, message: "End time is required" }]}
            >
              <TimePicker format="HH:mm" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="locationName" label="Location Name">
              <Input placeholder="e.g. Zurich Art Museum" />
            </Form.Item>

            <Form.Item name="latitude" label="Latitude">
              <InputNumber
                placeholder="e.g. 47.3769"
                style={{ width: "100%" }}
                step={0.0001}
              />
            </Form.Item>

            <Form.Item name="longitude" label="Longitude">
              <InputNumber
                placeholder="e.g. 8.5417"
                style={{ width: "100%" }}
                step={0.0001}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>
                Schedule
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default TimelinePage;
