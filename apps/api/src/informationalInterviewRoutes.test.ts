import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { contactRepository } from "./repositories/contactRepository.js";
import { informationalInterviewRepository } from "./repositories/informationalInterviewRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

const interview = {
  id: 7,
  contactName: "Jordan Lee",
  role: "Product Designer",
  company: "Studio",
  scheduledFor: "2026-10-02T14:00:00Z",
  status: "SCHEDULED",
  preparationQuestions: ["What skills matter most?"],
  keyTakeaway: null,
  recommendedAction: "Review the portfolio",
  referral: null,
  thankYouSent: false,
  nextFollowUp: "2026-10-03T00:00:00Z",
  userId: 42,
  contactId: 9,
};

describe("informational interview routes", () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each([
    ["get", "/api/informational-interviews"],
    ["post", "/api/informational-interviews"],
    ["patch", "/api/informational-interviews/7"],
    ["delete", "/api/informational-interviews/7"],
  ] as const)("requires authentication for %s %s", async (method, path) => {
    const response = await request(app)[method](path);
    expect(response.status).toBe(401);
  });

  it("lists only records owned by the authenticated user", async () => {
    const findAll = vi.spyOn(informationalInterviewRepository, "findAllByUserId")
      .mockResolvedValue([interview] as any);

    const response = await request(app)
      .get("/api/informational-interviews?userId=999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(42);
    expect(response.body.informationalInterviews[0]).toMatchObject({
      id: 7,
      status: "Scheduled",
      contactId: 9,
      thankYouSent: false,
    });
  });

  it("creates an owned interview and ignores a body userId", async () => {
    vi.spyOn(contactRepository, "findById").mockResolvedValue({ id: 9, userId: 42 } as any);
    const create = vi.spyOn(informationalInterviewRepository, "create")
      .mockResolvedValue(interview as any);

    const response = await request(app)
      .post("/api/informational-interviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        userId: 999,
        contactName: "Jordan Lee",
        role: "Product Designer",
        company: "Studio",
        scheduledFor: "2026-10-02T14:00:00Z",
        status: "Scheduled",
        preparationQuestions: [" What skills matter most? "],
        contactId: 9,
      });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(42, expect.objectContaining({
      contactName: "Jordan Lee",
      status: "SCHEDULED",
      preparationQuestions: ["What skills matter most?"],
      contactId: 9,
      thankYouSent: false,
    }));
  });

  it("rejects invalid input and contacts owned by another user", async () => {
    const invalid = await request(app)
      .post("/api/informational-interviews")
      .set("Authorization", `Bearer ${token}`)
      .send({ contactName: "", role: "Engineer", scheduledFor: "not-a-date" });
    expect(invalid.status).toBe(400);

    vi.spyOn(contactRepository, "findById").mockResolvedValue(null as any);
    const foreignContact = await request(app)
      .post("/api/informational-interviews")
      .set("Authorization", `Bearer ${token}`)
      .send({
        contactName: "Jordan Lee",
        role: "Engineer",
        scheduledFor: "2026-10-02T14:00:00Z",
        contactId: 99,
      });
    expect(foreignContact.status).toBe(400);
    expect(foreignContact.body.message).toMatch(/owned contact/);
  });

  it("does not update an interview owned by another user", async () => {
    const findById = vi.spyOn(informationalInterviewRepository, "findById")
      .mockResolvedValue(null as any);
    const update = vi.spyOn(informationalInterviewRepository, "update");

    const response = await request(app)
      .patch("/api/informational-interviews/7")
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "Completed" });

    expect(response.status).toBe(404);
    expect(findById).toHaveBeenCalledWith(7, 42);
    expect(update).not.toHaveBeenCalled();
  });

  it("deletes only an interview owned by the authenticated user", async () => {
    vi.spyOn(informationalInterviewRepository, "findById").mockResolvedValue(interview as any);
    const remove = vi.spyOn(informationalInterviewRepository, "delete").mockResolvedValue(undefined as any);

    const response = await request(app)
      .delete("/api/informational-interviews/7")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(remove).toHaveBeenCalledWith(7, 42);
  });
});
