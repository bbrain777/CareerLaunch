import { getDb } from "../db.js";
import type { Temporal } from "temporal-polyfill";

export type ExpenseCategory =
  | "TRAVEL"
  | "PRINTING"
  | "TRAINING"
  | "PROFESSIONAL_SERVICES";

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

  async update(
    id: number,
    userId: number,
    data: Partial<ExpenseInput>,
  ) {
    return getDb().orm.public.Expense.where({ id, userId }).update(data);
  },

  async delete(id: number, userId: number) {
    return getDb().orm.public.Expense.where({ id, userId }).delete();
  },

  // Expense Summary Query (Total + By Category + Date Range)
  async getSummary(
    userId: number,
    startDate?: string,
    endDate?: string,
  ) {
    let expenses = await this.findAllByUserId(userId);

    if (startDate) {
      const start = new Date(startDate).getTime();

      expenses = expenses.filter(
        (e: any) =>
          new Date(e.date as string | Date).getTime() >= start,
      );
    }

    if (endDate) {
      const end = new Date(endDate).getTime();

      expenses = expenses.filter(
        (e: any) =>
          new Date(e.date as string | Date).getTime() <= end,
      );
    }

    const total = expenses.reduce(
      (sum: number, e: any) => sum + Number(e.amount),
      0,
    );

    const byCategory = expenses.reduce(
      (acc: Record<string, number>, e: any) => {
        const cat = String(e.category);
        acc[cat] = (acc[cat] || 0) + Number(e.amount);
        return acc;
      },
      {},
    );

    return { total, byCategory };
  },
};