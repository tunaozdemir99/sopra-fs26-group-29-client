"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Card, Form, Input, Modal, Empty, message, Typography } from "antd";
import { BucketItem } from "@/types/bucketItem";

const { Title, Text } = Typography;

const IdeaBucketPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const router = useRouter();
  const apiService = useApi();
  const { value: token } = useLocalStorage<string>("token", "");
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
    </div>
  );
};

export default IdeaBucketPage;
