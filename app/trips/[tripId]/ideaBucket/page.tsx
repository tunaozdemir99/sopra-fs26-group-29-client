"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { App, Button, Card, DatePicker, Form, Input, Modal, Empty, Select, TimePicker, Typography, Popconfirm } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { BulbOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, CalendarOutlined, LikeOutlined, DislikeOutlined } from "@ant-design/icons";
import { BucketItem } from "@/types/bucketItem";
import type { SelectedLocation } from "@/components/LocationSearch";

const LocationSearch = dynamic(() => import("@/components/LocationSearch"), { ssr: false });

const { Title, Text } = Typography;

const IdeaBucketPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const { notification, message } = App.useApp();
  const { value: currentUserId } = useLocalStorage<string>("userId", "");
  const [items, setItems] = useState<BucketItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [schedulingItem, setSchedulingItem] = useState<BucketItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const locationRef = useRef<SelectedLocation | null>(null);
  const editLocationRef = useRef<SelectedLocation | null>(null);
  const [sortOrder, setSortOrder] = useState<"votes" | "recency">("recency");

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiService.get<BucketItem[]>(`/trips/${tripId}/bucketItems`);
      setItems(data);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  const handleAdd = async (values: { name: string; location?: string; description?: string }) => {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { ...values };
      if (locationRef.current) {
        payload.latitude = locationRef.current.lat;
        payload.longitude = locationRef.current.lng;
        if (!payload.location) payload.location = locationRef.current.label.split(",")[0];
      }
      const newItem = await apiService.post<BucketItem>(`/trips/${tripId}/bucketItems`, payload);
      setItems((prev) => [...prev, newItem]);
      form.resetFields();
      locationRef.current = null;
      setModalOpen(false);
      notification.success({ title: "Bucket item created successfully!", placement: "bottomRight", className: "custom-notification" });
    } catch (e) { message.error((e as Error).message ?? "Failed to add idea"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (values: { name: string; location?: string; description?: string }) => {
    if (!editingItem) return;
    try {
      const payload: Record<string, unknown> = { ...values };
      if (editLocationRef.current) {
        payload.latitude = editLocationRef.current.lat;
        payload.longitude = editLocationRef.current.lng;
      }
      const updated = await apiService.patch<BucketItem>(
        `/trips/${tripId}/bucketItems/${editingItem.bucketItemId}`, payload
      );
      setItems((prev) => prev.map((i) => i.bucketItemId === updated.bucketItemId ? updated : i));
      setEditingItem(null);
      editForm.resetFields();
      editLocationRef.current = null;
      message.success("Idea updated!");
    } catch (e) { message.error((e as Error).message ?? "Failed to update idea"); }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/bucketItems/${itemId}`);
      setItems((prev) => prev.filter((i) => i.bucketItemId !== itemId));
      message.success("Idea deleted!");
    } catch (e) { message.error((e as Error).message ?? "Failed to delete idea"); }
  };

  const handleVote = async (item: BucketItem, value: number) => {
    const newValue = item.myVote === value ? 0 : value;
    try {
      const updated = await apiService.post<BucketItem>(`/trips/${tripId}/bucketItems/${item.bucketItemId}/vote`, { value: newValue });
      setItems((prev) => prev.map((i) => i.bucketItemId === updated.bucketItemId ? updated : i));
    } catch (e) { message.error((e as Error).message ?? "Failed to vote"); }
  };

  const handleSchedule = async (values: { date: Dayjs; startTime: Dayjs; endTime: Dayjs }) => {
  if (!schedulingItem) return;
  try {
    await apiService.post(`/trips/${tripId}/timeline`, {
      bucketItemId: schedulingItem.bucketItemId,
      date: values.date.format("YYYY-MM-DD"),
      startTime: values.startTime.format("HH:mm"),
      endTime: values.endTime.format("HH:mm"),
    });
    setSchedulingItem(null);
    scheduleForm.resetFields();
    message.success("Activity scheduled!");
  } catch (e) { message.error((e as Error).message ?? "Failed to schedule"); }
  };


  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={3} style={{ margin: 0, color: "#111" }}>Idea Bucket</Title>
          <Text type="secondary">Share and vote on ideas for this trip</Text>
        </div>
        <Button
          type="primary"
          icon={<BulbOutlined />}
          onClick={() => setModalOpen(true)}
          style={{ background: "#111", borderColor: "#111" }}
        >
          Add Idea
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          value={sortOrder}
          onChange={(val) => setSortOrder(val)}
          style={{ width: 160 }}
          options={[
            { value: "votes", label: "Sort by Votes" },
            { value: "recency", label: "Sort by Recent" },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <Empty description="No ideas yet. Be the first to add one!" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[...items].sort((a, b) =>
            sortOrder === "votes"
              ? b.voteScore - a.voteScore
              : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ).map((item) => (
            <Card
              key={item.bucketItemId}
              style={{ borderRadius: 12, border: "1px solid #e5e7eb" }}
              styles={{ body: { padding: 20 } }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Title level={5} style={{ margin: 0, color: "#111", flex: 1, paddingRight: 8 }}>{item.name}</Title>
                {item.addedBy.id === Number(currentUserId) && (
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <Button
                      type="text" size="small"
                      icon={<EditOutlined style={{ color: "#2563eb" }} />}
                      onClick={() => { setEditingItem(item); editForm.setFieldsValue(item); }}
                    />
                    <Popconfirm title="Delete this idea?" onConfirm={() => handleDelete(item.bucketItemId)} okText="Yes" cancelText="No">
                      <Button type="text" size="small" icon={<DeleteOutlined style={{ color: "#ef4444" }} />} />
                    </Popconfirm>
                  </div>
                )}
              </div>
              {item.location && (
                <Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 13 }}>
                  <EnvironmentOutlined style={{ marginRight: 4 }} />{item.location}
                </Text>
              )}
              <Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 4 }}>
                by {item.addedBy.username}
              </Text>
              {item.description && (
                <Text style={{ display: "block", color: "#6b7280", fontSize: 13, marginTop: 6 }}>{item.description}</Text>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  minWidth: 32, textAlign: "center", fontWeight: 600, fontSize: 13,
                  padding: "2px 8px", borderRadius: 6,
                  background: item.voteScore > 0 ? "#dcfce7" : item.voteScore < 0 ? "#fee2e2" : "#f3f4f6",
                  color: item.voteScore > 0 ? "#16a34a" : item.voteScore < 0 ? "#dc2626" : "#6b7280",
                }}>
                  {item.voteScore > 0 ? `+${item.voteScore}` : item.voteScore}
                </span>
                <Button
                  size="small"
                  icon={<LikeOutlined />}
                  onClick={() => handleVote(item, 1)}
                  style={item.myVote === 1 ? { background: "#111", color: "#fff", borderColor: "#111" } : {}}
                >
                  {item.voteScore > 0 ? item.voteScore : 0}
                </Button>
                <Button
                  size="small"
                  icon={<DislikeOutlined />}
                  onClick={() => handleVote(item, -1)}
                  style={item.myVote === -1 ? { background: "#111", color: "#fff", borderColor: "#111" } : {}}
                >
                  {item.voteScore < 0 ? Math.abs(item.voteScore) : 0}
                </Button>
                <Button size="small" icon={<CalendarOutlined />} onClick={() => setSchedulingItem(item)}>
                  Schedule
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        title="Add New Idea"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); locationRef.current = null; }}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleAdd} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Title" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Visit the Eiffel Tower" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Any details..." />
          </Form.Item>
          <Form.Item label="Location" required rules={[{ required: true, message: "Location is required" }]}>
            <LocationSearch
              placeholder="Search for a location..."
              onSelect={(loc) => {
                locationRef.current = loc;
                form.setFieldValue("location", loc.label.split(",")[0]);
              }}
            />
          <Form.Item name="location" noStyle rules={[{ required: true, message: "Location is required" }]}>
            <Input type="hidden" />
          </Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Add to Bucket</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Schedule Idea"
        open={schedulingItem !== null}
        onCancel={() => { setSchedulingItem(null); scheduleForm.resetFields(); }}
        footer={null}
      >
        <Form form={scheduleForm} layout="vertical" onFinish={handleSchedule} style={{ marginTop: 16 }}>
          <Form.Item name="date" label="Date" rules={[{ required: true, message: "Date is required" }]}>
            <DatePicker style={{ width: "100%" }} disabledDate={(d) => d.isBefore(dayjs().startOf("day"))} />
          </Form.Item>
          <Form.Item name="startTime" label="Start Time" rules={[{ required: true, message: "Start time is required" }]}>
            <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={15} />
          </Form.Item>
          <Form.Item name="endTime" label="End Time" rules={[{ required: true, message: "End time is required" }]}>
            <TimePicker style={{ width: "100%" }} format="HH:mm" minuteStep={15} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Schedule Activity</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Idea"
        open={editingItem !== null}
        onCancel={() => { setEditingItem(null); editForm.resetFields(); editLocationRef.current = null; }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Title" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Visit the Eiffel Tower" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Any details..." />
          </Form.Item>
          <Form.Item label="Location" required rules={[{ required: true, message: "Location is required" }]}>
            <LocationSearch
              key={editingItem?.bucketItemId ?? 0}
              placeholder="Search for a location..."
              initialValue={editingItem?.location ?? ""}
              onSelect={(loc) => {
                editLocationRef.current = loc;
                editForm.setFieldValue("location", loc.label.split(",")[0]);
              }}
            />
            <Form.Item name="location" noStyle rules={[{ required: true, message: "Location is required" }]}>
              <Input type="hidden" />
            </Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Save Changes</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IdeaBucketPage;
