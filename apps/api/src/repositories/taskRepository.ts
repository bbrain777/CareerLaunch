import { getDb } from "../db.js";

export const taskRepository = {
  async findAllByUserId(userId: number) {
    return getDb().orm.public.Task.where({ userId }).all();
  },
};
