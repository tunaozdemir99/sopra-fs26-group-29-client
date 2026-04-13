"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Card, Form, Input, Modal, Empty, message, Typography, Popconfirm } from "antd";
import { BucketItem } from "@/types/bucketItem";

const { Title, Text } = Typography;

const IdeaBucketPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
  const { value: currentUsername } = useLocalStorage<string>("username", "");
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const [editForm] = Form.useForm();
  const [items, setItems] = useState<BucketItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const fetchItems = useCallback(async () => {
    try {
      const data = await apiService.get<BucketItem[]>(`/trips/${tripId}/bucketItems`);
      setItems(data);
    } catch {
      // ignore poll errors
    }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchItems();
    const interval = setInterval(fetchItems, 5000);
    return () => clearInterval(interval);
  }, [fetchItems]);

  const handleSubmit = async (values: { name: string; location?: string; description?: string }) => {
    setSubmitting(true);
    try {
      const newItem = await apiService.post<BucketItem>(`/trips/${tripId}/bucketItems`, values);
      setItems((prev) => [...prev, newItem]);
      form.resetFields();
      setModalOpen(false);
      message.success("Idea added!");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to add idea");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: { name: string; location?: string; description?: string }) => {
    if (!editingItem) return;
    try {
      const updated = await apiService.patch<BucketItem>(
        `/trips/${tripId}/bucketItems/${editingItem.bucketItemId}`,
        values
      );
      setItems((prev) => prev.map((i) => i.bucketItemId === updated.bucketItemId ? updated : i));
      setEditingItem(null);
      editForm.resetFields();
      message.success("Idea updated!");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to update idea");
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/bucketItems/${itemId}`);
      setItems((prev) => prev.filter((i) => i.bucketItemId !== itemId));
      message.success("Idea deleted!");
    } catch (error) {
      const e = error as Error;
      message.error(e.message ?? "Failed to delete idea");
    }
  };

  return (
    <div className="card-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Title level={2}>Idea Bucket</Title>
        <Button type="primary" onClick={() => setModalOpen(true)}>
          + Add Idea
        </Button>
      </div>

      {items.length === 0 ? (
        <Empty description="No ideas yet. Be the first to add one!" />
      ) : (
        items.map((item) => (
          <Card key={item.bucketItemId} style={{ marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0 }}>{item.name}</Title>
            {item.location && <Text type="secondary">📍 {item.location}</Text>}
            {item.description && <p>{item.description}</p>}
            <Text type="secondary">Added by {item.addedBy}</Text>
            {item.addedBy === currentUsername && (
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <Button size="small" onClick={() => { setEditingItem(item); editForm.setFieldsValue(item); }}>
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this idea?"
                  onConfirm={() => handleDelete(item.bucketItemId)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button size="small" danger>Delete</Button>
                </Popconfirm>
              </div>
            )}
          </Card>
        ))
      )}

      <Modal
        title="Add New Idea"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Hike to the waterfall" />
          </Form.Item>
          <Form.Item name="location" label="Location">
            <Input placeholder="e.g. Swiss Alps" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Any details..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Add Idea
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
      title="Edit Idea"
      open={editingItem !== null}
      onCancel={() => { setEditingItem(null); editForm.resetFields(); }}
      footer={null}
    >
      <Form form={editForm} layout="vertical" onFinish={handleEdit}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
          <Input />
        </Form.Item>
        <Form.Item name="location" label="Location">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Modal>
    </div>
  );
};

export default IdeaBucketPage;
