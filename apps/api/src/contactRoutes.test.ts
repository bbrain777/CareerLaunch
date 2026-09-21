import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { contactRepository } from "./repositories/contactRepository.js";
import { employerRepository } from "./repositories/employerRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);
const authorization = { Authorization: `Bearer ${token}` };

const contact = {
  id: 9,
  userId: 42,
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  phone: null,
  jobTitle: "Recruiter",
  notes: null,
  employerId: null,
  lastContacted: null,
  nextFollowUp: null,
};

describe("authenticated contact routes", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("requires a bearer token", async () => {
    const findAll = vi.spyOn(contactRepository, "findAllByUserId");
    const response = await request(app).get("/api/contacts");
    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it("uses JWT ownership and supports search", async () => {
    vi.spyOn(contactRepository, "findAllByUserId").mockResolvedValue([
      contact,
      { ...contact, id: 10, firstName: "Sam", jobTitle: "Engineer" },
    ] as any);
    const response = await request(app)
      .get("/api/contacts?search=recruiter&userId=999")
      .set(authorization);
    expect(response.status).toBe(200);
    expect(contactRepository.findAllByUserId).toHaveBeenCalledWith(42);
    expect(response.body.contacts).toEqual([contact]);
  });

  it("creates an owned contact with validated dates", async () => {
    vi.spyOn(employerRepository, "findById").mockResolvedValue({ id: 3, userId: 42 } as any);
    vi.spyOn(contactRepository, "create").mockResolvedValue(contact as any);
    const response = await request(app)
      .post("/api/contacts")
      .set(authorization)
      .send({
        userId: 999,
        firstName: " Jane ",
        email: "jane@example.com",
        employerId: 3,
        nextFollowUp: "2026-10-01",
      });
    expect(response.status).toBe(201);
    expect(employerRepository.findById).toHaveBeenCalledWith(3, 42);
    expect(contactRepository.create).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        firstName: "Jane",
        email: "jane@example.com",
        employerId: 3,
        nextFollowUp: expect.objectContaining({ epochMilliseconds: expect.any(Number) }),
      }),
    );
  });

  it("rejects invalid email and date input", async () => {
    const create = vi.spyOn(contactRepository, "create");
    const invalidEmail = await request(app)
      .post("/api/contacts")
      .set(authorization)
      .send({ firstName: "Jane", email: "invalid" });
    const invalidDate = await request(app)
      .post("/api/contacts")
      .set(authorization)
      .send({ firstName: "Jane", nextFollowUp: "not-a-date" });
    expect(invalidEmail.status).toBe(400);
    expect(invalidDate.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a contact linked to another user's employer", async () => {
    vi.spyOn(employerRepository, "findById").mockResolvedValue(null);
    const create = vi.spyOn(contactRepository, "create");
    const response = await request(app)
      .post("/api/contacts")
      .set(authorization)
      .send({ firstName: "Jane", employerId: 3 });
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("does not update a contact owned by another user", async () => {
    vi.spyOn(contactRepository, "findById").mockResolvedValue(null);
    const update = vi.spyOn(contactRepository, "update");
    const response = await request(app)
      .patch("/api/contacts/9")
      .set(authorization)
      .send({ firstName: "Changed" });
    expect(response.status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });

  it("updates only validated contact fields", async () => {
    vi.spyOn(contactRepository, "findById").mockResolvedValue(contact as any);
    vi.spyOn(contactRepository, "update").mockResolvedValue({
      ...contact,
      jobTitle: "Manager",
    } as any);
    const response = await request(app)
      .patch("/api/contacts/9")
      .set(authorization)
      .send({ jobTitle: "Manager", userId: 999 });
    expect(response.status).toBe(200);
    expect(contactRepository.update).toHaveBeenCalledWith(9, 42, { jobTitle: "Manager" });
  });

  it("deletes only an owned contact", async () => {
    vi.spyOn(contactRepository, "findById").mockResolvedValue(contact as any);
    vi.spyOn(contactRepository, "delete").mockResolvedValue(undefined as any);
    const response = await request(app).delete("/api/contacts/9").set(authorization);
    expect(response.status).toBe(204);
    expect(contactRepository.delete).toHaveBeenCalledWith(9, 42);
  });
});
