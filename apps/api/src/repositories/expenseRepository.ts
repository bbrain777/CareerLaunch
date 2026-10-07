import { getDb } from "../db.js";

export const expenseRepository = {
  async findAllByUserId(userId: number) {
    return getDb().orm.public.Expense.where({ userId }).all();
  },

  async findByIdAndUserId(id: number, userId: number) {
    return getDb().orm.public.Expense.where({ id, userId }).first();
  },

  async create(data: {
    userId: number;
    amount: number;
    category: string;
    date: Date;
    description: string;
    applicationId: number | null;
  }) {
    return getDb().orm.public.Expense.create(data);
  },

  async update(id: number, data: {
    amount?: number;
    category?: string;
    date?: Date;
    description?: string;
    applicationId?: number | null;
  }) {
    return getDb().orm.public.Expense.where({ id }).update(data);
  },

  async delete(id: number) {
    return getDb().orm.public.Expense.where({ id }).delete();
  },

  // NEW: Expense Summary Query (Total + By Category + Date Range)
  async getSummary(userId: number, startDate?: string, endDate?: string) {
    let expenses = await this.findAllByUserId(userId);

    // Filter by date range if provided in the request
    if (startDate) {
      const start = new Date(startDate).getTime();
      expenses = expenses.filter((e: any) => new Date(e.date as string | Date).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      expenses = expenses.filter((e: any) => new Date(e.date as string | Date).getTime() <= end);
    }

    // Calculate total spending
    const total = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // Calculate totals by category
    const byCategory = expenses.reduce((acc: Record<string, number>, e: any) => {
      const cat = String(e.category);
      acc[cat] = (acc[cat] || 0) + Number(e.amount);
      return acc;
    }, {});

    return { total, byCategory };
  }
};