import { Router } from "express";
import {
  applicationRepository,
  CreateApplicationInput,
} from "../repositories/applicationRepository.js";

export const applicationRouter = Router();

// Get all applications for a user
applicationRouter.get("/", async (request, response) => {
  const userId = Number(request.query.userId);

  if (!userId) {
    return response.status(400).json({
      message: "userId is required",
    });
  }

  const applications = await applicationRepository.findAllByUserId(userId);

  response.json({ applications });
});

// Get one application for a user
applicationRouter.get("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const userId = Number(request.query.userId);

  if (!userId) {
    return response.status(400).json({
      message: "userId is required",
    });
  }

  const application = await applicationRepository.findById(id, userId);

  if (!application) {
    return response.status(404).json({
      message: "Application not found",
    });
  }

  response.json({ application });
});

// Create an application
applicationRouter.post("/", async (request, response) => {
  const userId = Number(request.body.userId);

  if (!userId) {
    return response.status(400).json({
      message: "userId is required",
    });
  }

  const data: CreateApplicationInput = {
    company: request.body.company,
    position: request.body.position,
    location: request.body.location,
    status: request.body.status,
    deadline: request.body.deadline
      ? new Date(request.body.deadline)
      : undefined,
    appliedAt: request.body.appliedAt
      ? new Date(request.body.appliedAt)
      : undefined,
    notes: request.body.notes,
    employerId: request.body.employerId,
    contactId: request.body.contactId,
  };

  if (!data.company || !data.position) {
    return response.status(400).json({
      message: "company and position are required",
    });
  }

  const application = await applicationRepository.create(userId, data);

  response.status(201).json({ application });
});

// Update an application
applicationRouter.patch("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const userId = Number(request.body.userId);

  if (!userId) {
    return response.status(400).json({
      message: "userId is required",
    });
  }

  const data: Partial<CreateApplicationInput> = {
    company: request.body.company,
    position: request.body.position,
    location: request.body.location,
    status: request.body.status,
    deadline: request.body.deadline
      ? new Date(request.body.deadline)
      : undefined,
    appliedAt: request.body.appliedAt
      ? new Date(request.body.appliedAt)
      : undefined,
    notes: request.body.notes,
    employerId: request.body.employerId,
    contactId: request.body.contactId,
  };

  const application = await applicationRepository.update(id, userId, data);

  response.json({ application });
});

// Delete an application
applicationRouter.delete("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const userId = Number(request.query.userId);

  if (!userId) {
    return response.status(400).json({
      message: "userId is required",
    });
  }

  await applicationRepository.delete(id, userId);

  response.status(204).send();
});