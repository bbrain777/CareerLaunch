import { getDb } from "../db.js";
import type { Temporal } from "temporal-polyfill";

export type ExpenseCategory = "TRAVEL" | "PRINTING" | "TRAINING" | "PROFESSIONAL_SERVICES";

export type ExpenseInput = {
  amount: number;
  category: ExpenseCategory;
  date: Temporal.Instant;
  description: string;
  applicationId: number | null;
};

export const expenseRepository = {
  async findAllByUserId(userId: number) {
    return getDb().orm.public.Expense.where({ userId }).all();
  },

  async findById(id: number, userId: number) {
    return getDb().orm.public.Expense.where({ id, userId }).first();
  },

  async create(userId: number, data: ExpenseInput) {
    return getDb().orm.public.Expense.create({ ...data, userId });
  },

  async update(id: number, userId: number, data: Partial<ExpenseInput>) {
    return getDb().orm.public.Expense.where({ id, userId }).update(data);
  },

  async delete(id: number, userId: number) {
    return getDb().orm.public.Expense.where({ id, userId }).delete();
  },
};
