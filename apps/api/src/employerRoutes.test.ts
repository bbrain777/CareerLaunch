import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { app } from "./app.js";
import { getDb } from "./db.js";
import jwt from "jsonwebtoken";

// Mock the database
vi.mock("./db.js", () => ({
  getDb: vi.fn().mockReturnValue({
    orm: {
      public: {
        Employer: {
          where: vi.fn().mockReturnThis(),
          all: vi.fn(),
          first: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn(),
        }
      }
    }
  })
}));

const token = jwt.sign(
  { userId: 42, email: "test@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key"
);
const authHeader = { Authorization: `Bearer ${token}` };

describe("Employer Routes API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- GET TESTS ---
  it("fetches employers for the authenticated user only", async () => {
    const mockEmployers = [{ id: 1, userId: 42, name: "Tech Corp" }];
    const dbMock = getDb();
    (dbMock.orm.public.Employer.all as any).mockResolvedValue(mockEmployers);

    const response = await request(app).get("/api/employers").set(authHeader);
    expect(response.status).toBe(200);
    expect(dbMock.orm.public.Employer.where).toHaveBeenCalledWith({ userId: 42 });
  });

  // --- POST / VALIDATION TESTS ---
  it("rejects POST /api/employers if the name is missing", async () => {
    const response = await request(app)
      .post("/api/employers")
      .set(authHeader)
      .send({ industry: "Technology" });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Employer name is required");
  });

  it("creates a new employer with valid data", async () => {
    const mockCreatedEmployer = { id: 2, userId: 42, name: "Innovate LLC" };
    const dbMock = getDb();
    (dbMock.orm.public.Employer.create as any).mockResolvedValue(mockCreatedEmployer);

    const response = await request(app)
      .post("/api/employers")
      .set(authHeader)
      .send({ name: "Innovate LLC" });

    expect(response.status).toBe(201);
  });

  // --- UPDATE & DELETE / FAILURE TESTS ---
  it("returns 404 when updating an employer that doesn't exist or isn't owned", async () => {
    const dbMock = getDb();
    (dbMock.orm.public.Employer.first as any).mockResolvedValue(null);

    const response = await request(app)
      .patch("/api/employers/99")
      .set(authHeader)
      .send({ name: "Hacked Corp" });
      
    expect(response.status).toBe(404);
  });

  it("successfully updates an owned employer", async () => {
    const dbMock = getDb();
    const mockEmployer = { id: 1, userId: 42, name: "Tech Corp" };
    (dbMock.orm.public.Employer.first as any).mockResolvedValue(mockEmployer);
    (dbMock.orm.public.Employer.update as any).mockResolvedValue({ ...mockEmployer, name: "Tech Corp Updated" });

    const response = await request(app)
      .patch("/api/employers/1")
      .set(authHeader)
      .send({ name: "Tech Corp Updated" });
      
    expect(response.status).toBe(200);
    expect(response.body.employer.name).toBe("Tech Corp Updated");
  });

  it("successfully deletes an owned employer", async () => {
    const dbMock = getDb();
    (dbMock.orm.public.Employer.first as any).mockResolvedValue({ id: 1, userId: 42 });
    (dbMock.orm.public.Employer.delete as any).mockResolvedValue();

    const response = await request(app).delete("/api/employers/1").set(authHeader);
    expect(response.status).toBe(204);
  });
});