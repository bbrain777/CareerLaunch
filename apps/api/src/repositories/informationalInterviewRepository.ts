import type { Temporal } from "temporal-polyfill";
import { getDb } from "../db.js";

export type InformationalInterviewStatus = "PREPARING" | "SCHEDULED" | "COMPLETED";

export type InformationalInterviewInput = {
  contactName?: string;
  role?: string;
  company?: string | null;
  scheduledFor?: Temporal.Instant;
  status?: InformationalInterviewStatus;
  preparationQuestions?: string[];
  keyTakeaway?: string | null;
  recommendedAction?: string | null;
  referral?: string | null;
  thankYouSent?: boolean;
  nextFollowUp?: Temporal.Instant | null;
  contactId?: number | null;
};

export const informationalInterviewRepository = {
  async findAllByUserId(userId: number) {
    return getDb().orm.public.InformationalInterview.where({ userId }).all();
  },

  async findById(id: number, userId: number) {
    return getDb().orm.public.InformationalInterview.where({ id, userId }).first();
  },

  async create(
    userId: number,
    data: InformationalInterviewInput & {
      contactName: string;
      role: string;
      scheduledFor: Temporal.Instant;
      thankYouSent: boolean;
    },
  ) {
    return getDb().orm.public.InformationalInterview.create({ ...data, userId });
  },

  async update(id: number, userId: number, data: InformationalInterviewInput) {
    return getDb().orm.public.InformationalInterview.where({ id, userId }).update(data);
  },

  async delete(id: number, userId: number) {
    return getDb().orm.public.InformationalInterview.where({ id, userId }).delete();
  },
};
