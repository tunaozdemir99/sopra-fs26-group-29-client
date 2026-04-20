"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Card, Form, Input, Modal, Empty, message, Typography, Popconfirm, Select } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Task, TaskStatus } from "@/types/task";

const { Text } = Typography;

const statusColors: Record<TaskStatus, string> = {
  TO_DO: "#6b7280",
  IN_PROGRESS: "#2563eb",
  DONE: "#16a34a",
};

const TasksPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [tripMembers, setTripMembers] = useState<{ id: number; username: string }[]>([]);
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchTasks = useCallback(async () => {
    try {
      const data = await apiService.get<Task[]>(`/trips/${tripId}/tasks`);
      setTasks(data);
    } catch { /* ignore */ }
  }, [apiService, tripId]);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleAdd = async (values: { title: string; description?: string; assigneeId: number }) => {
    setSubmitting(true);
    try {
      const newTask = await apiService.post<Task>(`/trips/${tripId}/tasks`, {
        title: values.title,
        description: values.description,
        assigneeId: Number(userId),
      });
      setTasks((prev) => [...prev, newTask]);
      form.resetFields();
      setModalOpen(false);
      message.success("Task added!");
    } catch (e) { message.error((e as Error).message ?? "Failed to add task"); }
    finally { setSubmitting(false); }
  };

  const handleUpdateStatus = async (taskId: number, status: TaskStatus) => {
    try {
      const updated = await apiService.patch<Task>(`/trips/${tripId}/tasks/${taskId}`, { status });
      setTasks((prev) => prev.map((t) => t.taskId === updated.taskId ? updated : t));
    } catch (e) { message.error((e as Error).message ?? "Failed to update task"); }
  };

  const handleDelete = async (taskId: number) => {
    try {
      await apiService.delete(`/trips/${tripId}/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
      message.success("Task deleted!");
    } catch (e) { message.error((e as Error).message ?? "Failed to delete task"); }
  };

  const openModal = async () => {
    try {
      const members = await apiService.get<{ id: number; username: string }[]>(`/trips/${tripId}/members`);
      setTripMembers(members);
    } catch { /* ignore */ }
    setModalOpen(true);
  };

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
          Add Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <Empty description="No tasks yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {tasks.map((task) => (
            <Card key={task.taskId} style={{ borderLeft: `4px solid ${statusColors[task.status]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Text style={{ fontSize: 15, color: "#111" }}>{task.title}</Text>
                  <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                    Assigned to {task.assignee.username}
                  </Text>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Select
                    value={task.status}
                    size="small"
                    onChange={(val) => handleUpdateStatus(task.taskId, val)}
                    options={[
                      { value: "TO_DO", label: "To Do" },
                      { value: "IN_PROGRESS", label: "In Progress" },
                      { value: "DONE", label: "Done" },
                    ]}
                  />
                  <Popconfirm title="Delete this task?" onConfirm={() => handleDelete(task.taskId)} okText="Yes" cancelText="No">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Modal
        title="Add New Task"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleAdd} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="e.g. Book train tickets" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Optional details..." />
          </Form.Item>
          <Form.Item name="assigneeId" label="Assigned to" rules={[{ required: true, message: "Please select an assignee" }]}>
            <Select
              placeholder="Select a member"
              options={tripMembers.map((m) => ({ value: m.id, label: m.username }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Add Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksPage;
