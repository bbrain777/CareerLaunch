import { Router } from "express";
import {
  authenticatedUserId,
  requireAuth,
  type AuthRequest,
} from "../middleware/auth.js";
import {
  employerRepository,
  type EmployerInput,
} from "../repositories/employerRepository.js";

export const employerRouter = Router();

function parseId(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function nullableText(
  body: Record<string, unknown>,
  field: keyof EmployerInput,
): { value?: string | null; message?: string } {
  if (!Object.hasOwn(body, field)) return {};
  const value = body[field];
  if (value !== null && typeof value !== "string") {
    return { message: `${field} must be a string or null` };
  }
  return { value: typeof value === "string" ? value.trim() : null };
}

function employerInput(
  body: Record<string, unknown>,
  partial = false,
): { data?: EmployerInput; message?: string } {
  const data: EmployerInput = {};

  if (!partial || Object.hasOwn(body, "name")) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return { message: "name is required" };
    }
    data.name = body.name.trim();
  }

  for (const field of ["industry", "location", "notes"] as const) {
    const parsed = nullableText(body, field);
    if (parsed.message) return { message: parsed.message };
    if (Object.hasOwn(parsed, "value")) data[field] = parsed.value;
  }

  if (Object.hasOwn(body, "website")) {
    const parsed = nullableText(body, "website");
    if (parsed.message) return { message: parsed.message };
    if (parsed.value) {
      try {
        const url = new URL(parsed.value);
        if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error();
      } catch {
        return { message: "website must be a valid HTTP or HTTPS URL" };
      }
    }
    data.website = parsed.value ?? null;
  }

  return { data };
}

function matchesSearch(employer: Record<string, unknown>, search: string) {
  return ["name", "industry", "location", "website"].some((field) =>
    String(employer[field] ?? "").toLowerCase().includes(search),
  );
}

employerRouter.use(requireAuth);

employerRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const employers = await employerRepository.findAllByUserId(userId);
  const search = typeof request.query.search === "string"
    ? request.query.search.trim().toLowerCase()
    : "";

  response.json({
    employers: search
      ? employers.filter((employer) => matchesSearch(employer, search))
      : employers,
  });
});

employerRouter.post("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const parsed = employerInput(request.body);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });

  const employer = await employerRepository.create(
    userId,
    parsed.data as EmployerInput & { name: string },
  );
  response.status(201).json({ employer });
});

employerRouter.patch("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;

  if (!(await employerRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Employer not found" });
  }

  const parsed = employerInput(request.body, true);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });

  const employer = await employerRepository.update(id, userId, parsed.data);
  response.json({ employer });
});

employerRouter.delete("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;

  if (!(await employerRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Employer not found" });
  }

  await employerRepository.delete(id, userId);
  response.status(204).send();
});
