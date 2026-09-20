import { Router } from "express";
import {
  authenticatedUserId,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";
import { taskRepository } from "../repositories/taskRepository.js";

export const taskRouter = Router();

function dateOnly(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value).slice(0, 10);
}

function serializeTask(task: Record<string, any>) {
  const type = task.contactId
    ? "Follow-up"
    : task.applicationId
      ? "Application"
      : "Task";

  return {
    id: Number(task.id),
    title: String(task.title),
    description: task.description ? String(task.description) : null,
    due: dateOnly(task.dueDate),
    status: task.status === "COMPLETED" ? "Completed" : "Pending",
    type,
    applicationId: task.applicationId ? Number(task.applicationId) : null,
    contactId: task.contactId ? Number(task.contactId) : null,
  };
}

taskRouter.use(requireAuth);

taskRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const tasks = await taskRepository.findAllByUserId(userId);
  const serialized = tasks
    .map(serializeTask)
    .sort((left, right) => (left.due ?? "9999").localeCompare(right.due ?? "9999"));

  response.json({ tasks: serialized });
});
