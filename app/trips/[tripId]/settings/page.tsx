"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App, Button, Card, Input, Popconfirm, Spin, Typography } from "antd";
import { DeleteOutlined, InfoCircleOutlined, LinkOutlined, LogoutOutlined } from "@ant-design/icons";
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
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const fetchTrip = useCallback(async () => {
    try {
      const data = await apiService.get<Trip>(`/trips/${tripId}`);
      setTrip(data);
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


  const isAdmin = String(userId) === String(trip?.adminId);

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

      {/* Invite link management — admin only */}
      {isAdmin && (
        <Card style={{ marginBottom: 16 }}>
          <Title level={4}>
            <LinkOutlined /> Invite Link
          </Title>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Input
              value={trip.inviteActive
                ? `${window.location.origin}/invite/${trip.inviteUrl}`
                : "Invite link is deactivated"}
              readOnly
              disabled={!trip.inviteActive}
            />
            <Button
              onClick={() => {
                const url =
                  `${window.location.origin}/invite/${trip.inviteUrl}`;
                navigator.clipboard.writeText(url).then(() =>
                  message.success("Copied!")
                );
              }}
              disabled={!trip.inviteActive}
            >
              Copy
            </Button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              onClick={async () => {
                try {
                  const res = await apiService.put<{ inviteUrl: string }>(
                    `/trips/${tripId}/invite`,
                    {},
                  );
                  setTrip((prev) =>
                    prev ? { ...prev, inviteUrl: res.inviteUrl } : prev
                  );
                  message.success("Invite link regenerated!");
                } catch (error) {
                  const e = error as Error;
                  message.error(e.message ?? "Failed to regenerate");
                }
              }}
              disabled={!trip.inviteActive}
            >
              Regenerate Link
            </Button>
            <Button
              danger={trip.inviteActive}
              type={trip.inviteActive ? "default" : "primary"}
              onClick={async () => {
                try {
                  await apiService.patch(`/trips/${tripId}/invite`, {
                    active: !trip.inviteActive,
                  });
                  setTrip((prev) =>
                    prev ? { ...prev, inviteActive: !prev.inviteActive } : prev
                  );
                  message.success(
                    trip.inviteActive
                      ? "Invite deactivated"
                      : "Invite activated",
                  );
                } catch (error) {
                  const e = error as Error;
                  message.error(e.message ?? "Failed to update invite");
                }
              }}
            >
              {trip.inviteActive ? "Deactivate" : "Activate"}
            </Button>
          </div>
        </Card>
      )}

      {/* Leave Trip — all members */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={4}>Leave Trip</Title>
        <Text>
          {isAdmin
            ? "As the admin, you must transfer admin rights to another member before leaving the trip."
            : "Remove yourself from this trip. You will need a new invite to rejoin."}
        </Text>
        <div style={{ marginTop: 16 }}>
          <Popconfirm
            title="Leave this trip?"
            description={isAdmin ? "Transfer admin rights first in the Members tab." : "You will need a new invite to rejoin."}
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
