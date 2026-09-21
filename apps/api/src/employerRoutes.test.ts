import request from "supertest";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { app } from "./app.js";
import { getDb } from "./db.js";
import jwt from "jsonwebtoken";

// 1. Mock the database to isolate our API tests
vi.mock("./db.js", () => ({
  getDb: vi.fn().mockReturnValue({
    orm: {
      public: {
        Employer: {
          where: vi.fn().mockReturnThis(),
          all: vi.fn(),
          create: vi.fn(),
        }
      }
    }
  })
}));

// Create a valid dummy token for testing authorization
const token = jwt.sign(
  { userId: 42, email: "test@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key"
);
const authHeader = { Authorization: `Bearer ${token}` };

describe("Employer Routes API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Authorization Failure
  it("requires authentication for GET /api/employers", async () => {
    const response = await request(app).get("/api/employers");
    expect(response.status).toBe(401);
  });

  // Test 2: Successful Data Fetch & Ownership Check
  it("fetches employers for the authenticated user only", async () => {
    const mockEmployers = [{ id: 1, userId: 42, name: "Tech Corp" }];
    const dbMock = getDb();
    (dbMock.orm.public.Employer.all as any).mockResolvedValue(mockEmployers);

    const response = await request(app).get("/api/employers").set(authHeader);
    expect(response.status).toBe(200);
    expect(response.body.employers).toEqual(mockEmployers);
    
    // Proves we are strictly filtering by the logged-in user's ID
    expect(dbMock.orm.public.Employer.where).toHaveBeenCalledWith({ userId: 42 });
  });

  // Test 3: Input Validation Failure
  it("rejects POST /api/employers if the name is missing", async () => {
    const response = await request(app)
      .post("/api/employers")
      .set(authHeader)
      .send({ industry: "Technology" }); // Missing the required 'name' field

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("Employer name is required");
  });

  // Test 4: Successful Creation
  it("creates a new employer with valid data", async () => {
    const mockCreatedEmployer = { id: 2, userId: 42, name: "Innovate LLC" };
    const dbMock = getDb();
    (dbMock.orm.public.Employer.create as any).mockResolvedValue(mockCreatedEmployer);

    const response = await request(app)
      .post("/api/employers")
      .set(authHeader)
      .send({ name: "Innovate LLC", industry: "Technology" });

    expect(response.status).toBe(201);
    expect(response.body.employer).toEqual(mockCreatedEmployer);
  });
});