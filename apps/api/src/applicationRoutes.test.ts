import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { applicationRepository } from "./repositories/applicationRepository.js";
import { contactRepository } from "./repositories/contactRepository.js";
import { employerRepository } from "./repositories/employerRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

const authorization = { Authorization: `Bearer ${token}` };

const databaseApplication = {
  id: 7,
  company: "CareerLaunch Labs",
  position: "Software Engineer",
  location: "London",
  status: "INTERVIEW" as const,
  deadline: "2026-09-27T00:00:00Z",
  appliedAt: "2026-09-20T00:00:00Z",
  notes: null,
  employerId: null,
  contactId: null,
  userId: 42,
  createdAt: "2026-09-20T10:00:00Z",
  updatedAt: "2026-09-20T10:00:00Z",
};

describe("authenticated application integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires a bearer token", async () => {
    const findAll = vi.spyOn(applicationRepository, "findAllByUserId");

    const response = await request(app).get("/api/applications");

    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it("uses JWT ownership and maps database values to the client contract", async () => {
    const findAll = vi
      .spyOn(applicationRepository, "findAllByUserId")
      .mockResolvedValue([databaseApplication] as any);

    const response = await request(app)
      .get("/api/applications?userId=999")
      .set(authorization);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(42);
    expect(response.body.applications[0]).toMatchObject({
      id: 7,
      status: "Interview",
      deadline: "2026-09-27",
      appliedAt: "2026-09-20",
      userId: 42,
    });
  });

  it("creates an application for the authenticated user, ignoring body userId", async () => {
    const create = vi
      .spyOn(applicationRepository, "create")
      .mockResolvedValue(databaseApplication as any);

    const response = await request(app)
      .post("/api/applications")
      .set(authorization)
      .send({
        userId: 999,
        company: "CareerLaunch Labs",
        position: "Software Engineer",
        status: "Interview",
        deadline: "2026-09-27",
      });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        company: "CareerLaunch Labs",
        position: "Software Engineer",
        status: "INTERVIEW",
        deadline: expect.objectContaining({
          epochMilliseconds: expect.any(Number),
        }),
      }),
    );
  });

  it("rejects invalid status and date input before accessing the database", async () => {
    const create = vi.spyOn(applicationRepository, "create");

    const response = await request(app)
      .post("/api/applications")
      .set(authorization)
      .send({
        company: "CareerLaunch Labs",
        position: "Software Engineer",
        status: "Unknown",
        deadline: "not-a-date",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("status must be one of");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects employer or contact references owned by another user", async () => {
    vi.spyOn(employerRepository, "findById").mockResolvedValue(null);
    const contactLookup = vi.spyOn(contactRepository, "findById");
    const create = vi.spyOn(applicationRepository, "create");

    const response = await request(app)
      .post("/api/applications")
      .set(authorization)
      .send({
        company: "CareerLaunch Labs",
        position: "Software Engineer",
        employerId: 3,
        contactId: 9,
      });

    expect(response.status).toBe(400);
    expect(employerRepository.findById).toHaveBeenCalledWith(3, 42);
    expect(contactLookup).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not reveal an application that is not owned by the JWT user", async () => {
    const findById = vi
      .spyOn(applicationRepository, "findById")
      .mockResolvedValue(null);

    const response = await request(app)
      .get("/api/applications/7?userId=999")
      .set(authorization);

    expect(response.status).toBe(404);
    expect(findById).toHaveBeenCalledWith(7, 42);
  });

  it("checks ownership before deleting", async () => {
    vi.spyOn(applicationRepository, "findById").mockResolvedValue(null);
    const remove = vi.spyOn(applicationRepository, "delete");

    const response = await request(app)
      .delete("/api/applications/7?userId=999")
      .set(authorization);

    expect(response.status).toBe(404);
    expect(remove).not.toHaveBeenCalled();
  });
});
