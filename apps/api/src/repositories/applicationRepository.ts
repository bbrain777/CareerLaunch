import { db } from "../db.js";

export type CreateApplicationInput = {
  company: string;
  position: string;
  location?: string;
  status?: "SAVED" | "PREPARING" | "APPLIED" | "INTERVIEW" | "OFFER" | "CLOSED";
  deadline?: Date;
  appliedAt?: Date;
  notes?: string;
  employerId?: number;
  contactId?: number;
};

export type UpdateApplicationInput = Partial<CreateApplicationInput>;

export const applicationRepository = {
  async findAllByUserId(userId: number) {
    return db.orm.public.Application
      .where({ userId })
      .all();
  },

  async findById(id: number, userId: number) {
    return db.orm.public.Application
      .where({ id, userId })
      .first();
  },

  async create(userId: number, data: CreateApplicationInput) {
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
    return db.orm.public.Application
      .where({ id, userId })
      .update(data);
  },

  async delete(id: number, userId: number) {
    return db.orm.public.Application
      .where({ id, userId })
      .delete();
  },
};