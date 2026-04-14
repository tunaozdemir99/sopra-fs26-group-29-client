"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";
import { Button, Card, Empty, Modal, Form, Input, DatePicker, Typography } from "antd";
import { PlusOutlined, LogoutOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;

const UserTripsDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const { clear: clearToken } = useLocalStorage<string>("token", "");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const fetchTrips = useCallback(async () => {
    try {
      const data = await apiService.get<Trip[]>(`/users/${id}/trips`);
      setTrips(data);
    } catch {
      // ignore poll errors
    } finally {
      setLoading(false);
    }
  }, [apiService, id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleCreateTrip = async (values: {
    title: string;
    location?: string;
    dateRange: [Dayjs, Dayjs];
  }) => {
    setSubmitting(true);
    try {
      const created = await apiService.post<Trip>("/trips", {
        title: values.title,
        location: values.location ?? null,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      });
      form.resetFields();
      setModalOpen(false);
      router.push(`/trips/${created.tripId}`);
    } catch (error) {
      const e = error as Error;
      console.error("Failed to create trip:", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.post(`/users/${userId}/logout`, {});
    } catch {
      // ignore
    } finally {
      clearToken();
      clearUserId();
      router.push("/login");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>My Trips</Title>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalOpen(true)}
            >
              New Trip
            </Button>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {loading ? (
          <Card loading />
        ) : trips.length === 0 ? (
          <Empty description="No trips yet. Create your first trip!" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {trips.map((trip) => (
              <Card
                key={trip.tripId}
                hoverable
                onClick={() => router.push(`/trips/${trip.tripId}`)}
                style={{ cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Title level={4} style={{ margin: 0 }}>{trip.title}</Title>
                    {trip.location && (
                      <Text type="secondary">📍 {trip.location}</Text>
                    )}
                    <div>
                      <Text type="secondary">
                        {trip.startDate} → {trip.endDate}
                      </Text>
                    </div>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Admin: {trip.adminUsername}
                  </Text>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        title="Create New Trip"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTrip}>
          <Form.Item
            name="title"
            label="Trip Title"
            rules={[{ required: true, message: "Title is required" }]}
          >
            <Input placeholder="e.g. Summer in Japan" />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. Tokyo, Japan" />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="Dates"
            rules={[{ required: true, message: "Start and end date are required" }]}
          >
            <DatePicker.RangePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Create Trip
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserTripsDashboard;
