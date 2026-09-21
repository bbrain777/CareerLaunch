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

describe("Contact Routes API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- GET TESTS ---
  it("fetches contacts for the authenticated user only", async () => {
    const mockContacts = [{ id: 1, userId: 42, firstName: "Jane" }];
    const dbMock = getDb();
    (dbMock.orm.public.Contact.all as any).mockResolvedValue(mockContacts);

    const response = await request(app).get("/api/contacts").set(authHeader);
    expect(response.status).toBe(200);
    expect(dbMock.orm.public.Contact.where).toHaveBeenCalledWith({ userId: 42 });
  });

  // --- POST / VALIDATION TESTS ---
  it("rejects POST /api/contacts if nextFollowUp is invalid", async () => {
    const response = await request(app)
      .post("/api/contacts")
      .set(authHeader)
      .send({ firstName: "Jane", nextFollowUp: "not-a-date" }); 

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("valid date format");
  });

  it("creates a new contact using nextFollowUp", async () => {
    const mockCreatedContact = { id: 2, userId: 42, firstName: "John" };
    const dbMock = getDb();
    (dbMock.orm.public.Contact.create as any).mockResolvedValue(mockCreatedContact);

    const response = await request(app)
      .post("/api/contacts")
      .set(authHeader)
      .send({ firstName: "John", nextFollowUp: "2026-10-01" }); 

    expect(response.status).toBe(201);
  });

  // --- UPDATE & DELETE / FAILURE TESTS ---
  it("returns 404 when updating a contact that doesn't exist or isn't owned", async () => {
    const dbMock = getDb();
    (dbMock.orm.public.Contact.first as any).mockResolvedValue(null); 

    const response = await request(app)
      .patch("/api/contacts/99")
      .set(authHeader)
      .send({ firstName: "Hacked" });
      
    expect(response.status).toBe(404);
  });

  it("successfully updates an owned contact", async () => {
    const dbMock = getDb();
    const mockContact = { id: 1, userId: 42, firstName: "Jane" };
    (dbMock.orm.public.Contact.first as any).mockResolvedValue(mockContact);
    (dbMock.orm.public.Contact.update as any).mockResolvedValue({ ...mockContact, lastName: "Doe" });

    const response = await request(app)
      .patch("/api/contacts/1")
      .set(authHeader)
      .send({ lastName: "Doe" });
      
    expect(response.status).toBe(200);
    expect(response.body.contact.lastName).toBe("Doe");
  });

  it("successfully deletes an owned contact", async () => {
    const dbMock = getDb();
    (dbMock.orm.public.Contact.first as any).mockResolvedValue({ id: 1, userId: 42 });
    (dbMock.orm.public.Contact.delete as any).mockResolvedValue();

    const response = await request(app).delete("/api/contacts/1").set(authHeader);
    expect(response.status).toBe(204);
  });
});