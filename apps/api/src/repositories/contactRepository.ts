import { getDb } from "../db.js";
import type { Temporal } from "temporal-polyfill";

export type ContactInput = {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  notes?: string | null;
  lastContacted?: Temporal.Instant | null;
  nextFollowUp?: Temporal.Instant | null;
  employerId?: number | null;
};

export const contactRepository = {
  async findAllByUserId(userId: number) {
    return getDb().orm.public.Contact.where({ userId }).all();
  },

  async findById(id: number, userId: number) {
    return getDb().orm.public.Contact.where({ id, userId }).first();
  },

  async create(userId: number, data: ContactInput & { firstName: string }) {
    return getDb().orm.public.Contact.create({ ...data, userId });
  },

  async update(id: number, userId: number, data: ContactInput) {
    return getDb().orm.public.Contact.where({ id, userId }).update(data);
  },

  async delete(id: number, userId: number) {
    return getDb().orm.public.Contact.where({ id, userId }).delete();
  },
};
