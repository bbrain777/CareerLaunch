import { Router } from "express";
import { Temporal } from "temporal-polyfill";
import {
  authenticatedUserId,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";
import {
  contactRepository,
  type ContactInput,
} from "../repositories/contactRepository.js";
import { employerRepository } from "../repositories/employerRepository.js";

export const contactRouter = Router();

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

function contactInput(
  body: Record<string, unknown>,
  partial = false,
): { data?: ContactInput; message?: string } {
  const data: ContactInput = {};

  if (!partial || Object.hasOwn(body, "firstName")) {
    if (typeof body.firstName !== "string" || !body.firstName.trim()) {
      return { message: "firstName is required" };
    }
    data.firstName = body.firstName.trim();
  }

  for (const field of ["lastName", "phone", "jobTitle", "notes"] as const) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (value !== null && typeof value !== "string") {
      return { message: `${field} must be a string or null` };
    }
    data[field] = typeof value === "string" ? value.trim() : null;
  }

  if (Object.hasOwn(body, "email")) {
    const value = body.email;
    if (value !== null && typeof value !== "string") {
      return { message: "email must be a string or null" };
    }
    const email = typeof value === "string" ? value.trim() : null;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { message: "email must be valid" };
    }
    data.email = email;
  }

  for (const field of ["lastContacted", "nextFollowUp"] as const) {
    if (!Object.hasOwn(body, field)) continue;
    const date = parseDate(body[field]);
    if (date === undefined) return { message: `${field} must be a valid date or null` };
    data[field] = date;
  }

  if (Object.hasOwn(body, "employerId")) {
    const value = body.employerId;
    if (value === null) data.employerId = null;
    else if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      data.employerId = value;
    } else return { message: "employerId must be a positive integer or null" };
  }

  return { data };
}

function matchesSearch(contact: Record<string, unknown>, search: string) {
  return ["firstName", "lastName", "email", "phone", "jobTitle", "notes"].some(
    (field) => String(contact[field] ?? "").toLowerCase().includes(search),
  );
}

async function ownsEmployer(userId: number, employerId: number | null | undefined) {
  return employerId === undefined || employerId === null ||
    Boolean(await employerRepository.findById(employerId, userId));
}

contactRouter.use(requireAuth);

contactRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const contacts = await contactRepository.findAllByUserId(userId);
  const search = typeof request.query.search === "string"
    ? request.query.search.trim().toLowerCase()
    : "";
  response.json({
    contacts: search ? contacts.filter((contact) => matchesSearch(contact, search)) : contacts,
  });
});

contactRouter.post("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const parsed = contactInput(request.body);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });
  if (!(await ownsEmployer(userId, parsed.data.employerId))) {
    return response.status(400).json({ message: "employerId must reference an owned employer" });
  }

  const contact = await contactRepository.create(
    userId,
    parsed.data as ContactInput & { firstName: string },
  );
  response.status(201).json({ contact });
});

contactRouter.patch("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;
  if (!(await contactRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Contact not found" });
  }

  const parsed = contactInput(request.body, true);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });
  if (!(await ownsEmployer(userId, parsed.data.employerId))) {
    return response.status(400).json({ message: "employerId must reference an owned employer" });
  }

  const contact = await contactRepository.update(id, userId, parsed.data);
  response.json({ contact });
});

contactRouter.delete("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;
  if (!(await contactRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Contact not found" });
  }

  await contactRepository.delete(id, userId);
  response.status(204).send();
});
