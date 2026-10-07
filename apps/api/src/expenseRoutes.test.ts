import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { applicationRepository } from "./repositories/applicationRepository.js";
import { expenseRepository } from "./repositories/expenseRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

const expense = {
  id: 1,
  amount: 125.5,
  category: "TRAVEL",
  date: new Date("2026-10-01T00:00:00Z"),
  description: "Interview train ticket",
  userId: 42,
  applicationId: null,
};

describe("authenticated expense routes", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("requires authentication", async () => {
    const findAll = vi.spyOn(expenseRepository, "findAllByUserId");
    const response = await request(app).get("/api/expenses");
    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it("returns owner-scoped expenses", async () => {
    vi.spyOn(expenseRepository, "findAllByUserId").mockResolvedValue([expense] as any);
    const response = await request(app).get("/api/expenses").set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(expenseRepository.findAllByUserId).toHaveBeenCalledWith(42);
    expect(response.body.expenses[0].description).toBe("Interview train ticket");
  });

  it("validates create input", async () => {
    const create = vi.spyOn(expenseRepository, "create");
    const response = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: -1, category: "OTHER", date: "not-a-date", description: "" });
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects applications owned by another user", async () => {
    vi.spyOn(applicationRepository, "findById").mockResolvedValue(null);
    const create = vi.spyOn(expenseRepository, "create");
    const response = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 25, category: "PRINTING", date: "2026-10-01", description: "Portfolio", applicationId: 99 });
    expect(response.status).toBe(400);
    expect(applicationRepository.findById).toHaveBeenCalledWith(99, 42);
    expect(create).not.toHaveBeenCalled();
  });

  it("protects update and delete by owner", async () => {
    vi.spyOn(expenseRepository, "findById").mockResolvedValue(null);
    const update = await request(app)
      .patch("/api/expenses/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50 });
    const remove = await request(app)
      .delete("/api/expenses/999")
      .set("Authorization", `Bearer ${token}`);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
  });

  it("calculates a date-filtered summary", async () => {
    vi.spyOn(expenseRepository, "findAllByUserId").mockResolvedValue([
      expense,
      { ...expense, id: 2, amount: 24.5, category: "PRINTING", date: new Date("2026-10-04T00:00:00Z") },
      { ...expense, id: 3, amount: 90, date: new Date("2026-09-01T00:00:00Z") },
    ] as any);
    const response = await request(app)
      .get("/api/expenses/summary?startDate=2026-10-01&endDate=2026-10-31")
      .set("Authorization", `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.summary).toEqual({ total: 150, byCategory: { TRAVEL: 125.5, PRINTING: 24.5 } });
  });
});
