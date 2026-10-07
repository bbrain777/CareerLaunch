import { Router } from "express";
import { Temporal } from "temporal-polyfill";
import { authenticatedUserId, requireAuth, type AuthRequest } from "../middleware/auth.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import {
  expenseRepository,
  type ExpenseCategory,
  type ExpenseInput,
} from "../repositories/expenseRepository.js";

export const expenseRouter = Router();

const categories = ["TRAVEL", "PRINTING", "TRAINING", "PROFESSIONAL_SERVICES"] as const;

function parseId(value: string | string[] | undefined): number | undefined {
  if (typeof value !== "string") return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function parseDate(value: unknown): Temporal.Instant | undefined {
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

function parseCategory(value: unknown): ExpenseCategory | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toUpperCase();
  return categories.find((category) => category === normalized);
}

function expenseInput(
  body: Record<string, unknown>,
  partial = false,
): { data?: Partial<ExpenseInput>; message?: string } {
  const data: Partial<ExpenseInput> = {};

  if (!partial || Object.hasOwn(body, "amount")) {
    if (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0) {
      return { message: "amount must be a positive number" };
    }
    data.amount = body.amount;
  }

  if (!partial || Object.hasOwn(body, "category")) {
    const category = parseCategory(body.category);
    if (!category) return { message: `category must be one of: ${categories.join(", ")}` };
    data.category = category;
  }

  if (!partial || Object.hasOwn(body, "date")) {
    const date = parseDate(body.date);
    if (!date) return { message: "date must be a valid date" };
    data.date = date;
  }

  if (!partial || Object.hasOwn(body, "description")) {
    if (typeof body.description !== "string" || !body.description.trim()) {
      return { message: "description is required" };
    }
    data.description = body.description.trim();
  }

  if (Object.hasOwn(body, "applicationId")) {
    if (body.applicationId === null) {
      data.applicationId = null;
    } else if (typeof body.applicationId === "number" && Number.isInteger(body.applicationId) && body.applicationId > 0) {
      data.applicationId = body.applicationId;
    } else {
      return { message: "applicationId must be a positive integer or null" };
    }
  } else if (!partial) {
    data.applicationId = null;
  }

  return { data };
}

function serializeExpense(expense: Record<string, any>) {
  return {
    ...expense,
    id: Number(expense.id),
    amount: Number(expense.amount),
    date: expense.date instanceof Date ? expense.date.toISOString() : String(expense.date),
    applicationId: expense.applicationId ? Number(expense.applicationId) : null,
    createdAt: expense.createdAt ? String(expense.createdAt) : undefined,
    updatedAt: expense.updatedAt ? String(expense.updatedAt) : undefined,
  };
}

async function ownsApplication(userId: number, applicationId: number | null | undefined) {
  return applicationId === undefined || applicationId === null || Boolean(await applicationRepository.findById(applicationId, userId));
}

expenseRouter.use(requireAuth);

expenseRouter.get("/summary", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const startDate = request.query.startDate ? parseDate(request.query.startDate) : undefined;
  const endDate = request.query.endDate ? parseDate(request.query.endDate) : undefined;
  if ((request.query.startDate && !startDate) || (request.query.endDate && !endDate)) {
    return response.status(400).json({ message: "startDate and endDate must be valid dates" });
  }

  const startMs = startDate ? Number(startDate.epochMilliseconds) : Number.NEGATIVE_INFINITY;
  const endMs = endDate ? Number(endDate.epochMilliseconds) + 86_399_999 : Number.POSITIVE_INFINITY;
  const expenses = (await expenseRepository.findAllByUserId(userId)).filter((expense: any) => {
    const value = new Date(String(expense.date)).getTime();
    return value >= startMs && value <= endMs;
  });
  const byCategory: Record<string, number> = {};
  let total = 0;
  for (const expense of expenses as any[]) {
    const amount = Number(expense.amount);
    total += amount;
    const category = String(expense.category);
    byCategory[category] = (byCategory[category] ?? 0) + amount;
  }
  response.json({ summary: { total, byCategory } });
});

expenseRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const expenses = await expenseRepository.findAllByUserId(userId);
  expenses.sort((left: any, right: any) => new Date(String(right.date)).getTime() - new Date(String(left.date)).getTime());
  response.json({ expenses: expenses.map(serializeExpense) });
});

expenseRouter.post("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const parsed = expenseInput(request.body);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });
  if (!(await ownsApplication(userId, parsed.data.applicationId))) {
    return response.status(400).json({ message: "applicationId must reference an application owned by the authenticated user" });
  }
  const expense = await expenseRepository.create(userId, parsed.data as ExpenseInput);
  response.status(201).json({ expense: serializeExpense(expense) });
});

expenseRouter.patch("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;
  if (!(await expenseRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Expense not found" });
  }
  const parsed = expenseInput(request.body, true);
  if (!parsed.data) return response.status(400).json({ message: parsed.message });
  if (!(await ownsApplication(userId, parsed.data.applicationId))) {
    return response.status(400).json({ message: "applicationId must reference an application owned by the authenticated user" });
  }
  const expense = await expenseRepository.update(id, userId, parsed.data);
  response.json({ expense: serializeExpense(expense as any) });
});

expenseRouter.delete("/:id", async (request: AuthRequest, response) => {
  const id = parseId(request.params.id);
  if (!id) return response.status(400).json({ message: "id must be a positive integer" });
  const userId = authenticatedUserId(request)!;
  if (!(await expenseRepository.findById(id, userId))) {
    return response.status(404).json({ message: "Expense not found" });
  }
  await expenseRepository.delete(id, userId);
  response.status(204).send();
});
