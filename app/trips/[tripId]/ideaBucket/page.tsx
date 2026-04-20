"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Card, Form, Input, Modal, Empty, message, Typography, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { BucketItem } from "@/types/bucketItem";
import type { SelectedLocation } from "@/components/LocationSearch";

const LocationSearch = dynamic(() => import("@/components/LocationSearch"), { ssr: false });

const { Title, Text } = Typography;

const IdeaBucketPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const { value: currentUsername } = useLocalStorage<string>("username", "");
  const [items, setItems] = useState<BucketItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const locationRef = useRef<SelectedLocation | null>(null);

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
      message.success("Idea added!");
    } catch (e) { message.error((e as Error).message ?? "Failed to add idea"); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (values: { name: string; location?: string; description?: string }) => {
    if (!editingItem) return;
    try {
      const updated = await apiService.patch<BucketItem>(
        `/trips/${tripId}/bucketItems/${editingItem.bucketItemId}`, values
      );
      setItems((prev) => prev.map((i) => i.bucketItemId === updated.bucketItemId ? updated : i));
      setEditingItem(null);
      editForm.resetFields();
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

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Add Idea
        </Button>
      </div>

      {items.length === 0 ? (
        <Empty description="No ideas yet. Be the first to add one!" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((item) => (
            <Card key={item.bucketItemId} style={{ borderLeft: "4px solid #2563eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <Title level={5} style={{ margin: "0 0 4px", color: "#111" }}>{item.name}</Title>
                  {item.location && (
                    <Text type="secondary" style={{ display: "block" }}>
                      <EnvironmentOutlined /> {item.location}
                    </Text>
                  )}
                  {item.description && (
                    <Text style={{ display: "block", color: "#555", marginTop: 4 }}>{item.description}</Text>
                  )}
                  <Text type="secondary" style={{ fontSize: 12 }}>Added by {item.addedBy}</Text>
                </div>
                {item.addedBy === currentUsername && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button size="small" icon={<EditOutlined />}
                      onClick={() => { setEditingItem(item); editForm.setFieldsValue(item); }} />
                    <Popconfirm title="Delete this idea?" onConfirm={() => handleDelete(item.bucketItemId)} okText="Yes" cancelText="No">
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </div>
                )}
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
          <Form.Item label="Location">
            <LocationSearch
              placeholder="Search for a location..."
              onSelect={(loc) => {
                locationRef.current = loc;
                form.setFieldValue("location", loc.label.split(",")[0]);
              }}
            />
            <Form.Item name="location" noStyle><Input type="hidden" /></Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>Add to Bucket</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Idea"
        open={editingItem !== null}
        onCancel={() => { setEditingItem(null); editForm.resetFields(); }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Title" rules={[{ required: true, message: "Name is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="location" label="Location"><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>Save Changes</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IdeaBucketPage;
