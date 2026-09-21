import { getDb } from "../db.js";

export type EmployerInput = {
  name?: string;
  website?: string | null;
  industry?: string | null;
  location?: string | null;
  notes?: string | null;
};

export const employerRepository = {
  async findAllByUserId(userId: number) {
    return getDb().orm.public.Employer.where({ userId }).all();
  },

  async findById(id: number, userId: number) {
    return getDb().orm.public.Employer.where({ id, userId }).first();
  },

  async create(userId: number, data: EmployerInput & { name: string }) {
    return getDb().orm.public.Employer.create({ ...data, userId });
  },

  async update(id: number, userId: number, data: EmployerInput) {
    return getDb().orm.public.Employer.where({ id, userId }).update(data);
  },

  async delete(id: number, userId: number) {
    return getDb().orm.public.Employer.where({ id, userId }).delete();
  },
};
