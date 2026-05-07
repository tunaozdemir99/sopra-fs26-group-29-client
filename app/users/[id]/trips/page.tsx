"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";
import { App, Button, Card, Empty, Modal, Form, Input, DatePicker, Typography } from "antd";
import { PlusOutlined, LogoutOutlined, QuestionCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;

const UserTripsDashboard: React.FC = () => {
  const { message } = App.useApp();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId, clear: clearUserId } = useLocalStorage<string>("userId", "");
  const { clear: clearToken } = useLocalStorage<string>("token", "");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [joinForm] = Form.useForm();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    if (id && userId && id !== userId) {
      router.push(`/users/${userId}/trips`);
    }
  }, [token, userId, id, router]);


  const fetchTrips = useCallback(async () => {
    try {
      const data = await apiService.get<Trip[]>(`/users/${id}/trips`);
      setTrips(data);
    } catch (error) {
      const e = error as { status?: number };
      if (e?.status === 403) {
        router.push(`/users/${userId}/trips`);
      } else {
        message.error("Failed to load trips. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [apiService, id, userId, router, message]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleCreateTrip = async (values: {
    title: string;
    location: string;
    dateRange: [Dayjs, Dayjs];
  }) => {
    setSubmitting(true);
    try {
      const created = await apiService.post<Trip>("/trips", {
        title: values.title,
        location: values.location,
        startDate: values.dateRange[0].format("YYYY-MM-DD"),
        endDate: values.dateRange[1].format("YYYY-MM-DD"),
      });
      form.resetFields();
      setCreateModalOpen(false);
      router.push(`/trips/${created.tripId}`);
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to create trip");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTrip = async (values: { inviteCode: string }) => {
    setSubmitting(true);
    try {
      const codeMatch = values.inviteCode.match(/\/invite\/([a-f0-9-]+)/i);
      const inviteCode = codeMatch ? codeMatch[1] : values.inviteCode.trim();
      const result = await apiService.post<{ tripId: number; alreadyMember: boolean; message: string }>("/trips/join", { inviteCode });
      joinForm.resetFields();
      setJoinModalOpen(false);
      if (result.alreadyMember) {
        message.info(result.message ?? "You are already a member of this trip.");
      } else {
        message.success("Joined trip successfully!");
      }
      router.push(`/trips/${result.tripId}`);
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to join trip. Please check the invite link.");
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #eff6ff, #e0e7ff)", padding: 24 }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, background: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 18 }}>✈️</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 20, color: "#1e3a5f" }}>JointJourney</span>
            </div>
            <Title level={2} style={{ margin: 0, color: "#111" }}>My Trips</Title>
            <Text style={{ color: "#666" }}>Plan and manage your adventures</Text>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={() => router.push(`/users/${id}`)}>
              My Profile
            </Button>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateModalOpen(true)}
            style={{ background: "#2563eb", borderColor: "#2563eb" }}
          >
            Create Trip
          </Button>
          <Button
            icon={<QuestionCircleOutlined />}
            size="large"
            onClick={() => setJoinModalOpen(true)}
          >
            Join a Trip
          </Button>
        </div>

        {/* Trip list */}
        {loading ? (
          <Card loading />
        ) : trips.length === 0 ? (
          <Empty
            description={
              <span style={{ color: "#666" }}>
                No trips yet. Create your first trip or join one with an invite link!
              </span>
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {trips.map((trip) => (
              <Card
                key={trip.tripId}
                hoverable
                onClick={() => router.push(`/trips/${trip.tripId}`)}
                style={{ cursor: "pointer", borderLeft: "4px solid #2563eb", borderRadius: 8 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Title level={4} style={{ margin: 0, color: "#111" }}>{trip.title}</Title>
                    {trip.location && (
                      <Text type="secondary" style={{ display: "block" }}>📍 {trip.location}</Text>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <CalendarOutlined style={{ color: "#2563eb", fontSize: 13 }} />
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                      </Text>
                    </div>
                  </div>
                  {trip.adminUsername && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Admin: {trip.adminUsername}
                    </Text>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <Modal
        title={
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Create New Trip</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: "#666" }}>Start planning your next adventure</div>
          </div>
        }
        open={createModalOpen}
        onCancel={() => { setCreateModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateTrip} style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Trip Name"
            rules={[{ required: true, message: "Trip name is required" }]}
          >
            <Input placeholder="e.g. Summer Europe Adventure" size="large" />
          </Form.Item>
          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: "Location is required" }]}
          >
            <Input placeholder="e.g. Tokyo, Japan" size="large" />
          </Form.Item>
          <Form.Item
            name="dateRange"
            label="Dates"
            rules={[{ required: true, message: "Start and end date are required" }]}
          >
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              size="large"
              placeholder={["Start Date", "End Date"]}
              format="DD.MM.YYYY"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              style={{ background: "#000", borderColor: "#000" }}
            >
              Create Trip
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Join Trip Modal */}
      <Modal
        title={
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Join a Trip</div>
            <div style={{ fontWeight: 400, fontSize: 13, color: "#666" }}>Paste an invite link to join an existing trip</div>
          </div>
        }
        open={joinModalOpen}
        onCancel={() => { setJoinModalOpen(false); joinForm.resetFields(); }}
        footer={null}
      >
        <Form form={joinForm} layout="vertical" onFinish={handleJoinTrip} style={{ marginTop: 16 }}>
          <Form.Item
            name="inviteCode"
            label="Invite Link or Code"
            rules={[{ required: true, message: "Please paste an invite link or code" }]}
          >
            <Input placeholder="Paste invite link or code here" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              style={{ background: "#000", borderColor: "#000" }}
            >
              Join Trip
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserTripsDashboard;
