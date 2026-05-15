"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App, Button, Card, Form, Input, Popconfirm, Spin, Typography } from "antd";
import { DeleteOutlined, EditOutlined, InfoCircleOutlined, LogoutOutlined } from "@ant-design/icons";
import { Trip } from "@/types/trip";

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");
  const { message } = App.useApp();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const fetchTrip = useCallback(async () => {
    try {
      const data = await apiService.get<Trip>(`/trips/${tripId}`);
      setTrip(data);
      const members = await apiService.get<{ id: number }[]>(`/trips/${tripId}/members`);
      setMemberCount(members.length);
    } catch {
      message.error("Failed to load trip settings");
    } finally {
      setLoading(false);
    }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await apiService.delete(`/trips/${tripId}`);
      message.success("Trip deleted successfully");
      router.push("/");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to delete trip");
    } finally {
      setDeleting(false);
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await apiService.delete(`/trips/${tripId}/members/${userId}`);
      router.push(`/users/${userId}/trips`);
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to leave trip");
    } finally {
      setLeaving(false);
    }
  };

  const handleEditTrip = () => {
    editForm.setFieldsValue({
      title: trip?.title,
      location: trip?.location ?? "",
      startDate: trip?.startDate,
      endDate: trip?.endDate,
    });
    setIsEditingTrip(true);
  };

  const handleSaveTrip = async (values: { title: string; location: string; startDate: string; endDate: string }) => {
    setSaving(true);
    try {
      const updated = await apiService.patch<Trip>(`/trips/${tripId}`, {
        title: values.title,
        location: values.location || null,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      setTrip(updated);
      setIsEditingTrip(false);
      message.success("Trip details updated");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to update trip");
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = String(userId) === String(trip?.adminId);
  const isOnlyMember = isAdmin && memberCount === 1;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!trip) return null;

  return (
    <div style={{ padding: "16px 0" }}>
      {/* Trip info */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>
          <InfoCircleOutlined /> Trip Information
        </Title>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Text type="secondary">Created</Text>
            <br />
            <Text>{trip.createdAt?.split("T")[0]}</Text>
          </div>
          <div>
            <Text type="secondary">Admin</Text>
            <br />
            <Text>@{trip.adminUsername}</Text>
          </div>
        </div>
      </Card>

      {/* Edit trip details — admin only */}
      {isAdmin && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              <EditOutlined /> Edit Trip Details
            </Title>
            {!isEditingTrip && (
              <Button icon={<EditOutlined />} onClick={handleEditTrip}>
                Edit
              </Button>
            )}
          </div>

          {isEditingTrip ? (
            <Form form={editForm} layout="vertical" onFinish={handleSaveTrip}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: "Title is required" }]}
              >
                <Input placeholder="Trip title" />
              </Form.Item>
              <Form.Item name="location" label="Location">
                <Input placeholder="Destination (optional)" />
              </Form.Item>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true, message: "Start date is required" }]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item
                name="endDate"
                label="End Date"
                rules={[{ required: true, message: "End date is required" }]}
              >
                <Input type="date" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                  style={{ marginRight: 8, background: "#111", borderColor: "#111" }}
                >
                  Save
                </Button>
                <Button onClick={() => setIsEditingTrip(false)}>Cancel</Button>
              </Form.Item>
            </Form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <Text type="secondary">Title</Text>
                <br />
                <Text>{trip.title}</Text>
              </div>
              {trip.location && (
                <div>
                  <Text type="secondary">Location</Text>
                  <br />
                  <Text>{trip.location}</Text>
                </div>
              )}
              <div>
                <Text type="secondary">Dates</Text>
                <br />
                <Text>{trip.startDate} – {trip.endDate}</Text>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Leave Trip — all members */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>Leave Trip</Title>
        <Text>
          {isOnlyMember
            ? "You are the only member. Leaving will permanently delete this trip."
            : isAdmin
            ? "As the admin, you must transfer admin rights to another member before leaving the trip."
            : "Remove yourself from this trip. You will need a new invite to rejoin."}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Popconfirm
            title="Leave this trip?"
            description={
              isOnlyMember
                ? "You are the only member. The trip will be permanently deleted."
                : isAdmin
                ? "Transfer admin rights first in the Members tab."
                : "You will need a new invite to rejoin."
            }
            onConfirm={handleLeave}
            okText="Leave"
            cancelText="Cancel"
          >
            <Button icon={<LogoutOutlined />} loading={leaving}>
              Leave Trip
            </Button>
          </Popconfirm>
        </div>
      </Card>

      {/* Danger zone — admin only */}
      {isAdmin && (
        <Card
          style={{
            borderColor: "#ff4d4f",
          }}
        >
          <Title level={4} style={{ color: "#ff4d4f" }}>
            Danger Zone
          </Title>
          <Text>
            Once you delete this trip, all data including activities, tasks,
            ideas, and pins will be permanently removed. This action cannot be
            undone.
          </Text>
          <div style={{ marginTop: 16 }}>
            <Popconfirm
              title="Delete this trip permanently?"
              description="All trip data will be lost. This cannot be undone."
              onConfirm={handleDelete}
              okText="Yes, delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                loading={deleting}
              >
                Delete Trip Permanently
              </Button>
            </Popconfirm>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
