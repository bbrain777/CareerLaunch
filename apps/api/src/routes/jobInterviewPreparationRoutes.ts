
import { Router } from "express";
import { Temporal } from "temporal-polyfill";
import {
  authenticatedUserId,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import {
  jobInterviewPreparationRepository,
  type JobInterviewPreparationInput,
} from "../repositories/jobInterviewPreparationRepository.js";

export const jobInterviewPreparationRouter = Router();

const maxTextLength = 5000;
const maxListItems = 30;
const maxItemLength = 500;

function parseId(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function isObjectBody(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function parseScheduledFor(
  value: unknown,
): { valid: true; value: Temporal.Instant | null } | { valid: false } {
  if (value === null) return { valid: true, value: null };
  if (typeof value !== "string" || !value.trim()) {
    return { valid: false };
  }

  try {
    const input = value.trim();
    const normalized = /^\d{4}-\d{2}-\d{2}$/.test(input)
      ? `${input}T00:00:00Z`
      : input;

    return {
      valid: true,
      value: Temporal.Instant.from(normalized),
    };
  } catch {
    return { valid: false };
  }
}

function parseStringList(
  value: unknown,
  field: string,
  maximumItems = maxListItems,
): { data?: string[]; message?: string } {
  if (!Array.isArray(value) || value.length > maximumItems) {
    return {
      message: `${field} must be an array with no more than ${maximumItems} items`,
    };
  }

  const items: string[] = [];

  for (const item of value) {
    if (
      typeof item !== "string" ||
      !item.trim() ||
      item.trim().length > maxItemLength
    ) {
      return {
        message: `${field} items must be non-empty strings of at most ${maxItemLength} characters`,
      };
    }

    items.push(item.trim());
  }

  if (field === "resources") {
    for (const resource of items) {
      try {
        const url = new URL(resource);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          !url.hostname ||
          url.username ||
          url.password
        ) {
          return {
            message: "Each resource must be a valid HTTP or HTTPS URL",
          };
        }
      } catch {
        return {
          message: "Each resource must be a valid HTTP or HTTPS URL",
        };
      }
    }
  }

  return { data: items };
}

function preparationInput(
  body: Record<string, unknown>,
  partial = false,
): { data?: JobInterviewPreparationInput; message?: string } {
  const data: JobInterviewPreparationInput = {};

  for (const field of ["company", "role"] as const) {
    if (partial && !Object.hasOwn(body, field)) continue;

    const value = body[field];
    if (
      typeof value !== "string" ||
      !value.trim() ||
      value.trim().length > 200
    ) {
      return {
        message: `${field} must be a non-empty string of at most 200 characters`,
      };
    }

    data[field] = value.trim();
  }

  for (const field of ["companyResearch", "notes"] as const) {
    if (!Object.hasOwn(body, field)) continue;

    const value = body[field];
    if (value !== null && typeof value !== "string") {
      return { message: `${field} must be a string or null` };
    }

    if (typeof value === "string" && value.length > maxTextLength) {
      return {
        message: `${field} must not exceed ${maxTextLength} characters`,
      };
    }

    data[field] =
      typeof value === "string" ? value.trim() || null : null;
  }

  if (Object.hasOwn(body, "scheduledFor")) {
    const result = parseScheduledFor(body.scheduledFor);
    if (!result.valid) {
      return {
        message:
          "scheduledFor must be a valid ISO date or timezone-aware date-time, or null",
      };
    }
    data.scheduledFor = result.value;
  }

  const listLimits = {
    practiceQuestions: 20,
    resources: 20,
    responsibilities: 30,
    skills: 30,
  } as const;

  for (const field of Object.keys(listLimits) as Array<
    keyof typeof listLimits
  >) {
    if (!Object.hasOwn(body, field)) continue;

    const result = parseStringList(
      body[field],
      field,
      listLimits[field],
    );

    if (!result.data) return { message: result.message };
    data[field] = result.data;
  }

  if (Object.hasOwn(body, "applicationId")) {
    const value = body.applicationId;

    if (value === null) {
      data.applicationId = null;
    } else if (
      typeof value === "number" &&
      Number.isInteger(value) &&
      value > 0
    ) {
      data.applicationId = value;
    } else {
      return {
        message: "applicationId must be a positive integer or null",
      };
    }
  }

  if (partial && Object.keys(data).length === 0) {
    return { message: "Provide at least one field to update" };
  }

  return { data };
}

async function ownsApplication(
  userId: number,
  applicationId: number | null | undefined,
): Promise<boolean> {
  if (applicationId == null) return true;
  return Boolean(
    await applicationRepository.findById(applicationId, userId),
  );
}

jobInterviewPreparationRouter.use(requireAuth);

jobInterviewPreparationRouter.get(
  "/",
  async (request: AuthRequest, response) => {
    const userId = authenticatedUserId(request)!;
    const preparations =
      await jobInterviewPreparationRepository.findAllByUserId(userId);

    response.json({ jobInterviewPreparations: preparations });
  },
);

jobInterviewPreparationRouter.get(
  "/:id",
  async (request: AuthRequest, response) => {
    const id = parseId(request.params.id);
    if (!id) {
      return response
        .status(400)
        .json({ message: "id must be a positive integer" });
    }

    const userId = authenticatedUserId(request)!;
    const preparation =
      await jobInterviewPreparationRepository.findById(id, userId);

    if (!preparation) {
      return response
        .status(404)
        .json({ message: "Interview preparation not found" });
    }

    response.json({ jobInterviewPreparation: preparation });
  },
);

jobInterviewPreparationRouter.post(
  "/",
  async (request: AuthRequest, response) => {
    if (!isObjectBody(request.body)) {
      return response.status(400).json({ message: "Request body must be an object" });
    }

    const userId = authenticatedUserId(request)!;
    const parsed = preparationInput(request.body);

    if (!parsed.data) {
      return response.status(400).json({ message: parsed.message });
    }

    if (
      !(await ownsApplication(userId, parsed.data.applicationId))
    ) {
      return response.status(400).json({
        message: "applicationId must reference an owned application",
      });
    }

    const preparation =
      await jobInterviewPreparationRepository.create(userId, {
        ...parsed.data,
        company: parsed.data.company!,
        role: parsed.data.role!,
      });

    response.status(201).json({
      jobInterviewPreparation: preparation,
    });
  },
);

jobInterviewPreparationRouter.patch(
  "/:id",
  async (request: AuthRequest, response) => {
    const id = parseId(request.params.id);
    if (!id) {
      return response
        .status(400)
        .json({ message: "id must be a positive integer" });
    }

    if (!isObjectBody(request.body)) {
      return response.status(400).json({ message: "Request body must be an object" });
    }

    const userId = authenticatedUserId(request)!;
    const existing =
      await jobInterviewPreparationRepository.findById(id, userId);

    if (!existing) {
      return response
        .status(404)
        .json({ message: "Interview preparation not found" });
    }

    const parsed = preparationInput(request.body, true);
    if (!parsed.data) {
      return response.status(400).json({ message: parsed.message });
    }

    if (
      !(await ownsApplication(userId, parsed.data.applicationId))
    ) {
      return response.status(400).json({
        message: "applicationId must reference an owned application",
      });
    }

    const preparation =
      await jobInterviewPreparationRepository.update(
        id,
        userId,
        parsed.data,
      );

    if (!preparation) {
      return response
        .status(404)
        .json({ message: "Interview preparation not found" });
    }

    response.json({ jobInterviewPreparation: preparation });
  },
);


jobInterviewPreparationRouter.delete(
  "/:id",
  async (request: AuthRequest, response) => {
    const id = parseId(request.params.id);

    if (!id) {
      return response
        .status(400)
        .json({ message: "id must be a positive integer" });
    }

    const userId = authenticatedUserId(request)!;
    const existing =
      await jobInterviewPreparationRepository.findById(id, userId);

    if (!existing) {
      return response
        .status(404)
        .json({ message: "Interview preparation not found" });
    }

    await jobInterviewPreparationRepository.delete(id, userId);
    return response.status(204).send();
  },
);