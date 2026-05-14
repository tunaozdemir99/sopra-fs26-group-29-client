"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import {
  App,
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Typography,
} from "antd";
import {
  CrownOutlined,
  DeleteOutlined,
  SwapOutlined,
  TeamOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Trip } from "@/types/trip";

const { Title, Text } = Typography;

interface Member {
  id: number;
  username: string;
  status?: string;
}

const MembersPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const { message } = App.useApp();
  const { value: userId } = useLocalStorage<string>("userId", "");

  const [members, setMembers] = useState<Member[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [addUsername, setAddUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<number | null>(null);
  const [transferring, setTransferring] = useState(false);

  const isAdmin = trip ? String(userId) === String(trip.adminId) : false;

  const fetchData = useCallback(async () => {
    try {
      const [m, t] = await Promise.all([
        apiService.get<Member[]>(`/trips/${tripId}/members`),
        apiService.get<Trip>(`/trips/${tripId}`),
      ]);
      setMembers(m);
      setTrip(t);
    } catch { /* ignore poll errors */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAdd = async () => {
    if (!addUsername.trim()) return;
    setAdding(true);
    try {
      await apiService.post(`/trips/${tripId}/members`, {
        username: addUsername.trim(),
      });
      setAddUsername("");
      message.success("Member added!");
      fetchData();
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to add member");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/members/${memberId}`);
      message.success("Member removed");
      fetchData();
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to remove member");
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    setTransferring(true);
    try {
      await apiService.patch(`/trips/${tripId}/members/${transferTarget}`, {});
      message.success("Admin rights transferred!");
      setTransferModalOpen(false);
      setTransferTarget(null);
      fetchData();
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to transfer admin rights");
    } finally {
      setTransferring(false);
    }
  };

  const nonAdminMembers = members.filter(
    (m) => trip && String(m.id) !== String(trip.adminId),
  );

  return (
    <div style={{ padding: "16px 0" }}>
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            <TeamOutlined /> Trip Members
          </Title>
          {isAdmin && (
            <Button
              icon={<SwapOutlined />}
              onClick={() => setTransferModalOpen(true)}
              disabled={nonAdminMembers.length === 0}
            >
              Transfer Admin
            </Button>
          )}
        </div>

        {/* Add member — admin only */}
        {isAdmin && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <Input
              placeholder="Enter username to add..."
              value={addUsername}
              onChange={(e) => setAddUsername(e.target.value)}
              onPressEnter={handleAdd}
              prefix={<UserAddOutlined />}
            />
            <Button
              type="primary"
              onClick={handleAdd}
              loading={adding}
              disabled={!addUsername.trim()}
            >
              Add
            </Button>
          </div>
        )}

        {/* Member list */}
        {members.length === 0 ? <Empty description="No members yet" /> : (
          <List
            dataSource={members}
            renderItem={(m) => {
              const isMemberAdmin = trip &&
                String(m.id) === String(trip.adminId);
              return (
                <List.Item
                  actions={isAdmin && !isMemberAdmin
                    ? [
                      <Popconfirm
                        key="remove"
                        title={`Remove @${m.username} from this trip?`}
                        onConfirm={() => handleRemove(m.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          Remove
                        </Button>
                      </Popconfirm>,
                    ]
                    : []}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Avatar style={{ background: "#2563eb" }}>
                      {m.username[0].toUpperCase()}
                    </Avatar>
                    <div>
                      <Text strong>{m.username}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        @{m.username}
                      </Text>
                    </div>
                    {isMemberAdmin && (
                      <Tag color="blue" icon={<CrownOutlined />}>Admin</Tag>
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </Card>

      {/* Transfer admin modal */}
      <Modal
        title="Transfer Admin Rights"
        open={transferModalOpen}
        onCancel={() => {
          setTransferModalOpen(false);
          setTransferTarget(null);
        }}
        onOk={handleTransfer}
        confirmLoading={transferring}
        okText="Transfer"
        okButtonProps={{ danger: true, disabled: !transferTarget }}
      >
        <Text>
          Select a member to transfer admin rights to. You will lose admin
          privileges.
        </Text>
        <Select
          style={{ width: "100%", marginTop: 12 }}
          placeholder="Choose a member"
          value={transferTarget}
          onChange={(val) => setTransferTarget(val)}
          options={nonAdminMembers.map((m) => ({
            label: m.username,
            value: m.id,
          }))}
        />
      </Modal>
    </div>
  );
};

export default MembersPage;
