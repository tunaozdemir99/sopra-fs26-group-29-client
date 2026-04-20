export type TaskStatus = "TO_DO" | "IN_PROGRESS" | "DONE";

export interface Task {
  taskId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  assignee: { id: number; username: string };
}
