"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Card, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const TripOverviewPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: userId } = useLocalStorage<string>("userId", "");

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  return (
    <div className="card-container">
      <div style={{ width: "100%", maxWidth: 600 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => router.push(`/users/${userId}/trips`)}
          >
            My Trips
          </Button>
        </div>
        <Title level={2} style={{ marginBottom: 24 }}>
          Trip {tripId}
        </Title>

        <div style={{ display: "flex", gap: 16 }}>
          <Card
            hoverable
            style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
            onClick={() => router.push(`/trips/${tripId}/ideaBucket`)}
          >
            <Title level={3} style={{ margin: 0 }}>
              💡
            </Title>
            <Title level={4} style={{ marginTop: 8 }}>
              Idea Bucket
            </Title>
            <Text type="secondary">Collect and vote on activity ideas</Text>
          </Card>

          <Card
            hoverable
            style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
            onClick={() => router.push(`/trips/${tripId}/timeline`)}
          >
            <Title level={3} style={{ margin: 0 }}>
              🗓️
            </Title>
            <Title level={4} style={{ marginTop: 8 }}>
              Timeline
            </Title>
            <Text type="secondary">Schedule activities and see travel times</Text>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripOverviewPage;
