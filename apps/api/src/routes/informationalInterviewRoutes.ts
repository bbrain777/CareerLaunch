import { Router } from "express";
import { Temporal } from "temporal-polyfill";
import {
  authenticatedUserId,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";
import { contactRepository } from "../repositories/contactRepository.js";
import {
  informationalInterviewRepository,
  type InformationalInterviewInput,
  type InformationalInterviewStatus,
} from "../repositories/informationalInterviewRepository.js";

export const informationalInterviewRouter = Router();

const statuses = ["PREPARING", "SCHEDULED", "COMPLETED"] as const;
const clientStatus: Record<InformationalInterviewStatus, string> = {
  PREPARING: "Preparing",
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
};

function parseId(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
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

function isoDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : String(value);
}

function serializeInterview(interview: Record<string, any>) {
  const status = String(interview.status).toUpperCase() as InformationalInterviewStatus;
  return {
    ...interview,
    id: Number(interview.id),
    status: clientStatus[status] ?? interview.status,
    scheduledFor: isoDate(interview.scheduledFor),
    nextFollowUp: isoDate(interview.nextFollowUp)?.slice(0, 10) ?? null,
    preparationQuestions: Array.isArray(interview.preparationQuestions)
      ? interview.preparationQuestions.map(String)
      : [],
    thankYouSent: Boolean(interview.thankYouSent),
    contactId: interview.contactId ? Number(interview.contactId) : null,
    createdAt: interview.createdAt ? String(interview.createdAt) : undefined,
    updatedAt: interview.updatedAt ? String(interview.updatedAt) : undefined,
  };
}

function parseStatus(value: unknown): InformationalInterviewStatus | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return statuses.find((status) => status === normalized);
}

function interviewInput(
  body: Record<string, unknown>,
  partial = false,
): { data?: InformationalInterviewInput; message?: string } {
  const data: InformationalInterviewInput = {};

  for (const field of ["contactName", "role"] as const) {
    if (!partial || Object.hasOwn(body, field)) {
      const value = body[field];
      if (typeof value !== "string" || !value.trim()) {
        return { message: `${field} is required` };
      }
      data[field] = value.trim();
    }
  }

  for (const field of ["company", "keyTakeaway", "recommendedAction", "referral"] as const) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (value !== null && typeof value !== "string") {
      return { message: `${field} must be a string or null` };
    }
    data[field] = typeof value === "string" ? value.trim() || null : null;
  }

  if (!partial || Object.hasOwn(body, "scheduledFor")) {
    const scheduledFor = parseDate(body.scheduledFor);
    if (!scheduledFor) return { message: "scheduledFor must be a valid date" };
    data.scheduledFor = scheduledFor;
  }

  if (Object.hasOwn(body, "nextFollowUp")) {
    const nextFollowUp = parseDate(body.nextFollowUp);
    if (nextFollowUp === undefined) {
      return { message: "nextFollowUp must be a valid date or null" };
    }
    data.nextFollowUp = nextFollowUp;
  }

  if (Object.hasOwn(body, "status")) {
    const status = parseStatus(body.status);
    if (!status) return { message: `status must be one of: ${statuses.join(", ")}` };
    data.status = status;
  }

  if (Object.hasOwn(body, "thankYouSent")) {
    if (typeof body.thankYouSent !== "boolean") {
      return { message: "thankYouSent must be a boolean" };
    }
    data.thankYouSent = body.thankYouSent;
  }

  if (Object.hasOwn(body, "preparationQuestions")) {
    if (
      !Array.isArray(body.preparationQuestions) ||
      body.preparationQuestions.some((question) => typeof question !== "string")
    ) {
      return { message: "preparationQuestions must be an array of strings" };
    }
    data.preparationQuestions = body.preparationQuestions
      .map((question) => question.trim())
      .filter(Boolean);
  }

  if (Object.hasOwn(body, "contactId")) {
    const value = body.contactId;
    if (value === null) data.contactId = null;
    else if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      data.contactId = value;
    } else return { message: "contactId must be a positive integer or null" };
  }

  return { data };
}

async function ownsContact(userId: number, contactId: number | null | undefined) {
  return contactId === undefined || contactId === null ||
    Boolean(await contactRepository.findById(contactId, userId));
}

informationalInterviewRouter.use(requireAuth);

informationalInterviewRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const interviews = await informationalInterviewRepository.findAllByUserId(userId);
  response.json({
    informationalInterviews: interviews
      .map(serializeInterview)
      .sort((left, right) => String(left.scheduledFor).localeCompare(String(right.scheduledFor))),
  });
});

informationalInterviewRouter.post("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const parsed = interviewInput(request.body);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });
  if (!(await ownsContact(userId, parsed.data.contactId))) {
    return response.status(400).json({ message: "contactId must reference an owned contact" });
  }

  const interview = await informationalInterviewRepository.create(userId, {
    ...parsed.data,
    contactName: parsed.data.contactName!,
    role: parsed.data.role!,
    scheduledFor: parsed.data.scheduledFor!,
    thankYouSent: parsed.data.thankYouSent ?? false,
  });
  response.status(201).json({ informationalInterview: serializeInterview(interview) });
});

informationalInterviewRouter.patch("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;
  if (!(await informationalInterviewRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Informational interview not found" });
  }

  const parsed = interviewInput(request.body, true);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });
  if (!(await ownsContact(userId, parsed.data.contactId))) {
    return response.status(400).json({ message: "contactId must reference an owned contact" });
  }

  const interview = await informationalInterviewRepository.update(id, userId, parsed.data);
  if (!interview) {
    return response.status(404).json({ message: "Informational interview not found" });
  }
  response.json({ informationalInterview: serializeInterview(interview) });
});

informationalInterviewRouter.delete("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;
  if (!(await informationalInterviewRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Informational interview not found" });
  }

  await informationalInterviewRepository.delete(id, userId);
  response.status(204).send();
});
