import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { expenseRepository } from "./repositories/expenseRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

describe("authenticated expense integration", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("requires authentication", async () => {
    const findAll = vi.spyOn(expenseRepository, "findAllByUserId");
    const response = await request(app).get("/api/expenses");

    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it("returns owner-scoped expenses", async () => {
    const mockExpenses = [
      { id: 1, amount: 100, category: "TRAVEL", date: new Date("2026-10-01"), description: "Flight", userId: 42, applicationId: null }
    ];
    const findAll = vi.spyOn(expenseRepository, "findAllByUserId").mockResolvedValue(mockExpenses as any);

    const response = await request(app)
      .get("/api/expenses")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(42);
    expect(response.body[0].description).toBe("Flight");
  });

  it("validates positive amounts, allowed categories, and dates on create", async () => {
    const create = vi.spyOn(expenseRepository, "create");

    // Invalid amount
    const res1 = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: -50, category: "TRAVEL", date: "2026-10-05", description: "Test" });
    expect(res1.status).toBe(400);

    // Invalid category
    const res2 = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50, category: "INVALID", date: "2026-10-05", description: "Test" });
    expect(res2.status).toBe(400);
    
    // Missing Date
    const res3 = await request(app)
      .post("/api/expenses")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 50, category: "PRINTING", description: "Test" });
    expect(res3.status).toBe(400);

    expect(create).not.toHaveBeenCalled();
  });

  it("returns 404 when attempting to view or update another user's expense", async () => {
    const findById = vi.spyOn(expenseRepository, "findByIdAndUserId").mockResolvedValue(null);
    
    const response = await request(app)
      .put("/api/expenses/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, category: "PRINTING" });

    expect(response.status).toBe(404);
    expect(findById).toHaveBeenCalledWith(999, 42);
  });

  it("fetches the expense summary successfully with optional date filters", async () => {
    const getSummary = vi.spyOn(expenseRepository, "getSummary").mockResolvedValue({
      total: 150,
      byCategory: { TRAVEL: 100, PRINTING: 50 }
    });

    const response = await request(app)
      .get("/api/expenses/summary?startDate=2026-01-01")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(getSummary).toHaveBeenCalledWith(42, "2026-01-01", undefined);
    expect(response.body.total).toBe(150);
  });
});