"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Trip } from "@/types/trip";
import { Alert, Button, Card, Result, Spin, Typography } from "antd";
import {
  CalendarOutlined,
  LinkOutlined,
  TeamOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface JoinTripResponse {
  tripId: number;
  alreadyMember: boolean;
  message: string;
}

const InvitePage: React.FC = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [joinedTripId, setJoinedTripId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      router.push(`/login?returnTo=/invite/${inviteCode}`);
    }
  }, [token, router, inviteCode]);

  const fetchTripInfo = useCallback(async () => {
    try {
      const data = await apiService.get<Trip>(`/trips/invite/${inviteCode}`);
      setTrip(data);
    } catch (err) {
      const e = err as Error;
      setError(
        e.message?.toLowerCase().includes("404") ||
          e.message?.toLowerCase().includes("invalid") ||
          e.message?.toLowerCase().includes("expired")
          ? "This invite link is invalid or has expired."
          : (e.message ?? "Failed to load trip information."),
      );
    } finally {
      setLoading(false);
    }
  }, [apiService, inviteCode]);

  useEffect(() => {
    if (token) fetchTripInfo();
  }, [token, fetchTripInfo]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const result = await apiService.post<JoinTripResponse>("/trips/join", {
        inviteCode,
      });
      if (result.alreadyMember) {
        setAlreadyMember(true);
        setJoinedTripId(result.tripId);
      } else {
        router.push(`/trips/${result.tripId}`);
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message ?? "Failed to join trip.");
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eff6ff, #e0e7ff)",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #eff6ff, #e0e7ff)",
          padding: 24,
        }}
      >
        <Result
          status="error"
          title="Invalid Invite Link"
          subTitle={error}
          extra={
            <Button
              type="primary"
              onClick={() => router.push("/login")}
              style={{ background: "#2563eb" }}
            >
              Go Home
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eff6ff, #e0e7ff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card
        style={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 12,
          border: "1px solid #dbeafe",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 60,
              height: 60,
              background: "#2563eb",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
            }}
          >
            <LinkOutlined style={{ fontSize: 28, color: "#fff" }} />
          </div>
          <Title level={3} style={{ margin: "0 0 4px" }}>
            You&apos;ve been invited!
          </Title>
          <Text type="secondary">
            Join this trip to start planning together
          </Text>
        </div>

        {trip && (
          <Card
            style={{
              background: "#f8faff",
              border: "1px solid #dbeafe",
              marginBottom: 24,
              borderRadius: 8,
            }}
          >
            <Title level={4} style={{ margin: "0 0 8px", color: "#111" }}>
              {trip.title}
            </Title>
            {trip.location && (
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4 }}
              >
                📍 {trip.location}
              </Text>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <CalendarOutlined style={{ color: "#2563eb", fontSize: 13 }} />
              <Text style={{ fontSize: 13, color: "#555" }}>
                {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
              </Text>
            </div>
            {trip.adminUsername && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TeamOutlined style={{ color: "#2563eb", fontSize: 13 }} />
                <Text style={{ fontSize: 13, color: "#555" }}>
                  Organized by {trip.adminUsername}
                </Text>
              </div>
            )}
          </Card>
        )}

        {alreadyMember
          ? (
            <>
              <Alert
                message="Already a Member"
                description="You are already a member of this trip."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Button
                type="primary"
                block
                size="large"
                onClick={() => router.push(`/trips/${joinedTripId}`)}
                style={{ background: "#2563eb" }}
              >
                Go to Trip
              </Button>
            </>
          )
          : (
            <Button
              type="primary"
              block
              size="large"
              loading={joining}
              onClick={handleJoin}
              style={{ background: "#2563eb" }}
            >
              Join Trip
            </Button>
          )}
      </Card>
    </div>
  );
};

export default InvitePage;
