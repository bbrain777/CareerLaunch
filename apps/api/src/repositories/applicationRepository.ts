import { getDb } from "../db.js";
import type { Temporal } from "temporal-polyfill";

export type CreateApplicationInput = {
  company: string;
  position: string;
  location?: string | null;
  status?: "SAVED" | "PREPARING" | "APPLIED" | "INTERVIEW" | "OFFER" | "CLOSED";
  deadline?: Temporal.Instant | null;
  appliedAt?: Temporal.Instant | null;
  notes?: string | null;
  employerId?: number | null;
  contactId?: number | null;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export const applicationRepository = {
  async findAllByUserId(userId: number) {
    const db = getDb();
    return db.orm.public.Application
      .where({ userId })
      .all();
  },

  async findById(id: number, userId: number) {
    const db = getDb();
    return db.orm.public.Application
      .where({ id, userId })
      .first();
  },

  async create(userId: number, data: CreateApplicationInput) {
    const db = getDb();
    return db.orm.public.Application.create({
      ...data,
      userId,
    });
  },

  async update(
    id: number,
    userId: number,
    data: UpdateApplicationInput
  ) {
    const db = getDb();
    return db.orm.public.Application
      .where({ id, userId })
      .update(data);
  },

  async delete(id: number, userId: number) {
    const db = getDb();
    return db.orm.public.Application
      .where({ id, userId })
      .delete();
  },
};
