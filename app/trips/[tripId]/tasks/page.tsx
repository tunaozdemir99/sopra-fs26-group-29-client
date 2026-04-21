"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input, Modal, message, Typography, Select, Avatar } from "antd";
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { Task, TaskStatus } from "@/types/task";

const { Text, Title } = Typography;

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "TO_DO",       label: "To Do" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "DONE",        label: "Done" },
];

const TasksPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const apiService = useApi();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tripMembers, setTripMembers] = useState<{ id: number; username: string }[]>([]);
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
        assigneeId: values.assigneeId,
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

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Trip Tasks</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Organize and track tasks for your trip</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openModal}
          style={{ background: "#111", borderColor: "#111" }}
        >
          New Task
        </Button>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", border: "2px solid #d1d5db",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", color: "#d1d5db", fontSize: 24,
          }}>✓</div>
          <Text strong style={{ display: "block", fontSize: 15, marginBottom: 6 }}>No tasks yet</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>Create tasks to organize your trip planning</Text>
        </div>
      )}

      {/* Kanban columns */}
      {tasks.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key}>
              {/* Column header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text strong style={{ fontSize: 14 }}>{col.label}</Text>
                <Text type="secondary" style={{ fontSize: 13 }}>{colTasks.length}</Text>
              </div>

              {/* Task cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {colTasks.length === 0 ? (
                  <div style={{
                    border: "1px dashed #d1d5db", borderRadius: 8,
                    padding: "32px 0", textAlign: "center",
                  }}>
                    <Text type="secondary" style={{ fontSize: 13 }}>No tasks</Text>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isAssignedToMe = String(task.assignee.id) === String(userId);
                    const statusIcon = task.status === "DONE"
                      ? <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 15 }} />
                      : task.status === "IN_PROGRESS"
                      ? <ClockCircleOutlined style={{ color: "#2563eb", fontSize: 15 }} />
                      : <MinusCircleOutlined style={{ color: "#9ca3af", fontSize: 15 }} />;

                    return (
                      <div key={task.taskId} style={{
                        background: isAssignedToMe ? "#eff6ff" : "#fff",
                        border: isAssignedToMe ? "2px solid #2563eb" : "1px solid #e5e7eb",
                        borderRadius: 8, padding: "12px 14px",
                      }}>
                        {/* Title row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                            {statusIcon}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <Text style={{ fontSize: 14, fontWeight: 500 }}>{task.title}</Text>
                                {isAssignedToMe && (
                                  <span style={{
                                    fontSize: 11, color: "#2563eb", background: "#dbeafe",
                                    border: "1px solid #bfdbfe", borderRadius: 4, padding: "0 6px",
                                  }}>Assigned to you</span>
                                )}
                              </div>
                              {task.description && (
                                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
                                  {task.description}
                                </Text>
                              )}
                            </div>
                          </div>
                          <DeleteOutlined
                            style={{ color: "#9ca3af", fontSize: 14, cursor: "pointer", marginLeft: 8 }}
                            onClick={() => handleDelete(task.taskId)}
                          />
                        </div>

                        {/* Assignee + status row */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                          <Avatar size={20} style={{ background: "#2563eb", fontSize: 10, flexShrink: 0 }}>
                            {task.assignee.username[0].toUpperCase()}
                          </Avatar>
                          <Text style={{ fontSize: 12, flex: 1 }}>
                            {task.assignee.username}
                          </Text>
                          <Select
                            value={task.status}
                            size="small"
                            style={{ width: 120, fontSize: 12 }}
                            onChange={(val) => handleUpdateStatus(task.taskId, val)}
                            optionRender={(opt) => <span style={{ fontSize: 12 }}>{opt.label}</span>}
                            options={[
                              { value: "TO_DO",       label: "To Do" },
                              { value: "IN_PROGRESS", label: "In Progress" },
                              { value: "DONE",        label: "Done" },
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>}

      {/* New Task modal */}
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
            <Button type="primary" htmlType="submit" loading={submitting} block
              style={{ background: "#111", borderColor: "#111" }}>
              Add Task
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TasksPage;
