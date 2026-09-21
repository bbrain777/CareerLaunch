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
        Contact: {
          where: vi.fn().mockReturnThis(),
          all: vi.fn(),
          create: vi.fn(),
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

describe("Contact Routes API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test 1: Authorization Failure
  it("requires authentication for GET /api/contacts", async () => {
    const response = await request(app).get("/api/contacts");
    expect(response.status).toBe(401);
  });

  // Test 2: Successful Fetch & Ownership Check
  it("fetches contacts for the authenticated user only", async () => {
    const mockContacts = [{ id: 1, userId: 42, firstName: "Jane", lastName: "Doe" }];
    const dbMock = getDb();
    (dbMock.orm.public.Contact.all as any).mockResolvedValue(mockContacts);

    const response = await request(app).get("/api/contacts").set(authHeader);
    expect(response.status).toBe(200);
    expect(response.body.contacts).toEqual(mockContacts);
    expect(dbMock.orm.public.Contact.where).toHaveBeenCalledWith({ userId: 42 });
  });

  // Test 3: Missing Required Field
  it("rejects POST /api/contacts if the firstName is missing", async () => {
    const response = await request(app)
      .post("/api/contacts")
      .set(authHeader)
      .send({ lastName: "Smith" });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("First name is required");
  });

  // Test 4: Invalid Date Format
  it("rejects POST /api/contacts if followUpDate is invalid", async () => {
    const response = await request(app)
      .post("/api/contacts")
      .set(authHeader)
      .send({ firstName: "Jane", followUpDate: "not-a-real-date" });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("valid date format");
  });

  // Test 5: Successful Creation
  it("creates a new contact with valid data", async () => {
    const mockCreatedContact = { id: 2, userId: 42, firstName: "John" };
    const dbMock = getDb();
    (dbMock.orm.public.Contact.create as any).mockResolvedValue(mockCreatedContact);

    const response = await request(app)
      .post("/api/contacts")
      .set(authHeader)
      .send({ firstName: "John", followUpDate: "2026-10-01" });

    expect(response.status).toBe(201);
    expect(response.body.contact).toEqual(mockCreatedContact);
  });
});