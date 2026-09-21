import { Router } from "express";
import { Temporal } from "temporal-polyfill";
import {
  authenticatedUserId,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";
import {
  applicationRepository,
  type CreateApplicationInput,
} from "../repositories/applicationRepository.js";
import { contactRepository } from "../repositories/contactRepository.js";
import { employerRepository } from "../repositories/employerRepository.js";

export const applicationRouter = Router();

const databaseStatuses = [
  "SAVED",
  "PREPARING",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "CLOSED",
] as const;

type DatabaseStatus = (typeof databaseStatuses)[number];

const clientStatusByDatabaseStatus: Record<DatabaseStatus, string> = {
  SAVED: "Saved",
  PREPARING: "Preparing",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  CLOSED: "Closed",
};

function parseId(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function parseStatus(value: unknown): DatabaseStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return databaseStatuses.find((status) => status === normalized);
}

function parseDate(value: unknown): Temporal.Instant | null | undefined {
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) return undefined;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
    ? `${value.trim()}T00:00:00Z`
    : value.trim();

  try {
    return Temporal.Instant.from(normalized);
  } catch {
    return undefined;
  }
}

function dateOnly(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const serialized = value instanceof Date ? value.toISOString() : String(value);
  return serialized.slice(0, 10);
}

function serializeApplication(application: Record<string, any>) {
  const status = parseStatus(application.status);

  return {
    ...application,
    status: status ? clientStatusByDatabaseStatus[status] : application.status,
    deadline: dateOnly(application.deadline),
    appliedAt: dateOnly(application.appliedAt),
    createdAt: application.createdAt ? String(application.createdAt) : undefined,
    updatedAt: application.updatedAt ? String(application.updatedAt) : undefined,
  };
}

function applicationInput(
  body: Record<string, unknown>,
  partial = false,
): { data?: Partial<CreateApplicationInput>; message?: string } {
  const data: Partial<CreateApplicationInput> = {};

  if (!partial || Object.hasOwn(body, "company")) {
    if (typeof body.company !== "string" || !body.company.trim()) {
      return { message: "company is required" };
    }
    data.company = body.company.trim();
  }

  if (!partial || Object.hasOwn(body, "position")) {
    if (typeof body.position !== "string" || !body.position.trim()) {
      return { message: "position is required" };
    }
    data.position = body.position.trim();
  }

  for (const field of ["location", "notes"] as const) {
    if (Object.hasOwn(body, field)) {
      const value = body[field];
      if (value !== null && typeof value !== "string") {
        return { message: `${field} must be a string or null` };
      }
      data[field] = typeof value === "string" ? value.trim() : null;
    }
  }

  if (Object.hasOwn(body, "status")) {
    const status = parseStatus(body.status);
    if (!status) {
      return { message: `status must be one of: ${databaseStatuses.join(", ")}` };
    }
    data.status = status;
  }

  for (const field of ["deadline", "appliedAt"] as const) {
    if (Object.hasOwn(body, field)) {
      const date = parseDate(body[field]);
      if (date === undefined) {
        return { message: `${field} must be a valid date or null` };
      }
      data[field] = date;
    }
  }

  for (const field of ["employerId", "contactId"] as const) {
    if (Object.hasOwn(body, field)) {
      const value = body[field];
      if (value === null) {
        data[field] = null;
      } else if (typeof value === "number" && Number.isInteger(value) && value > 0) {
        data[field] = value;
      } else {
        return { message: `${field} must be a positive integer or null` };
      }
    }
  }

  return { data };
}

async function ownsRelatedRecords(
  userId: number,
  data: Partial<CreateApplicationInput>,
) {
  if (
    data.employerId !== undefined &&
    data.employerId !== null &&
    !(await employerRepository.findById(data.employerId, userId))
  ) {
    return false;
  }

  if (
    data.contactId !== undefined &&
    data.contactId !== null &&
    !(await contactRepository.findById(data.contactId, userId))
  ) {
    return false;
  }

  return true;
}

applicationRouter.use(requireAuth);

// Get all applications for a user
applicationRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;

  const applications = await applicationRepository.findAllByUserId(userId);

  response.json({ applications: applications.map(serializeApplication) });
});

// Get one application for a user
applicationRouter.get("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) {
    return response.status(400).json({ message: "id must be a positive integer" });
  }
  const userId = authenticatedUserId(request)!;

  const application = await applicationRepository.findById(id, userId);

  if (!application) {
    return response.status(404).json({
      message: "Application not found",
    });
  }

  response.json({ application: serializeApplication(application) });
});

// Create an application
applicationRouter.post("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const parsed = applicationInput(request.body);
  if (!parsed.data) {
    return response.status(400).json({ message: parsed.message });
  }
  if (!(await ownsRelatedRecords(userId, parsed.data))) {
    return response.status(400).json({
      message: "employerId and contactId must reference records owned by the authenticated user",
    });
  }

  const application = await applicationRepository.create(
    userId,
    parsed.data as CreateApplicationInput,
  );

  response.status(201).json({ application: serializeApplication(application) });
});

// Update an application
applicationRouter.patch("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) {
    return response.status(400).json({ message: "id must be a positive integer" });
  }
  const userId = authenticatedUserId(request)!;

  const existing = await applicationRepository.findById(id, userId);
  if (!existing) {
    return response.status(404).json({ message: "Application not found" });
  }

  const parsed = applicationInput(request.body, true);
  if (!parsed.data) {
    return response.status(400).json({ message: parsed.message });
  }
  if (!(await ownsRelatedRecords(userId, parsed.data))) {
    return response.status(400).json({
      message: "employerId and contactId must reference records owned by the authenticated user",
    });
  }

  const application = await applicationRepository.update(id, userId, parsed.data);

  if (!application) {
    return response.status(404).json({ message: "Application not found" });
  }

  response.json({ application: serializeApplication(application) });
});

// Delete an application
applicationRouter.delete("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) {
    return response.status(400).json({ message: "id must be a positive integer" });
  }
  const userId = authenticatedUserId(request)!;

  const existing = await applicationRepository.findById(id, userId);
  if (!existing) {
    return response.status(404).json({ message: "Application not found" });
  }

  await applicationRepository.delete(id, userId);

  response.status(204).send();
});
