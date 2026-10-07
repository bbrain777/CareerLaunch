import { Router } from "express";
import { expenseRepository } from "../repositories/expenseRepository.js";
import { requireAuth, authenticatedUserId, AuthRequest } from "../middleware/auth.js";

export const expenseRouter = Router();

// 1. GET /api/expenses - List all expenses
expenseRouter.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = authenticatedUserId(req);
    if (!userId) return;

    const expenses = await expenseRepository.findAllByUserId(userId);
    
    // Sort by date descending
    const sorted = expenses.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    res.status(200).json(sorted);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching expenses" });
  }
});

// 2. GET /api/expenses/summary - Get expense totals (Must be BEFORE /:id)
expenseRouter.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = authenticatedUserId(req);
    if (!userId) return;

    const { startDate, endDate } = req.query;

    const summary = await expenseRepository.getSummary(
      userId,
      startDate as string | undefined,
      endDate as string | undefined
    );

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: "Server error calculating summary" });
  }
});

// 3. POST /api/expenses - Create
expenseRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = authenticatedUserId(req);
    if (!userId) return;
    const { amount, category, date, description, applicationId } = req.body;

    if (typeof amount !== "number" || amount <= 0) {
      res.status(400).json({ message: "A positive amount is required" });
      return;
    }
    const validCategories = ["TRAVEL", "PRINTING", "TRAINING", "PROFESSIONAL_SERVICES"];
    if (!validCategories.includes(category)) {
      res.status(400).json({ message: "Valid category is required" });
      return;
    }
    if (!date || isNaN(Date.parse(date))) {
      res.status(400).json({ message: "Valid date is required" });
      return;
    }
    if (typeof description !== "string" || !description.trim()) {
      res.status(400).json({ message: "Description is required" });
      return;
    }

    const expense = await expenseRepository.create({
      userId,
      amount,
      category,
      date: new Date(date),
      description: description.trim(),
      applicationId: applicationId ? Number(applicationId) : null,
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error creating expense" });
  }
});

// 4. GET /api/expenses/:id - Read
expenseRouter.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = authenticatedUserId(req);
    if (!userId) return;
    const id = Number(req.params.id);

    const expense = await expenseRepository.findByIdAndUserId(id, userId);

    if (!expense) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    res.status(200).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching expense" });
  }
});

// 5. PUT /api/expenses/:id - Update
expenseRouter.put("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = authenticatedUserId(req);
    if (!userId) return;
    const id = Number(req.params.id);
    const { amount, category, date, description, applicationId } = req.body;

    const existing = await expenseRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    const updated = await expenseRepository.update(id, {
      amount: amount ?? (existing.amount as number),
      category: category ?? (existing.category as string),
      date: date ? new Date(date) : (existing.date as Date),
      description: description ? description.trim() : (existing.description as string),
      applicationId: applicationId !== undefined ? (applicationId ? Number(applicationId) : null) : (existing.applicationId as number | null),
    });

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error updating expense" });
  }
});

// 6. DELETE /api/expenses/:id - Delete
expenseRouter.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = authenticatedUserId(req);
    if (!userId) return;
    const id = Number(req.params.id);

    const existing = await expenseRepository.findByIdAndUserId(id, userId);
    if (!existing) {
      res.status(404).json({ message: "Expense not found" });
      return;
    }

    await expenseRepository.delete(id);

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error deleting expense" });
  }
});