import { Router } from "express";
import { informationalInterviews } from "../data.js";
import { buildDashboardData } from "../dashboardService.js";
import {
  authenticatedUserId,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import { contactRepository } from "../repositories/contactRepository.js";
import { taskRepository } from "../repositories/taskRepository.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const [applications, contacts, tasks] = await Promise.all([
    applicationRepository.findAllByUserId(userId),
    contactRepository.findAllByUserId(userId),
    taskRepository.findAllByUserId(userId),
  ]);

  response.json(buildDashboardData({
    applications,
    contacts,
    tasks,
    informationalInterviews,
  }));
});
