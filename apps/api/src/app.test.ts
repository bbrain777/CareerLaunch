import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { applicationRepository } from "./repositories/applicationRepository.js";
import { contactRepository } from "./repositories/contactRepository.js";
import { taskRepository } from "./repositories/taskRepository.js";
import { informationalInterviewRepository } from "./repositories/informationalInterviewRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

describe("CareerLaunch API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("reports a healthy service", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "careerlaunch-api"
    });
  });

  it("requires authentication for dashboard data", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
  });

  // --- NEW SPRINT 3 SECURITY TEST BELOW ---

  it("rejects invalid tokens for dashboard data", async () => {
    const response = await request(app)
      .get("/api/dashboard")
      .set("Authorization", "Bearer totally-fake-token");
    
    expect(response.status).toBe(401);
  });

  it("returns owner-scoped dashboard metrics and coordinated reminders", async () => {
    const findApplications = vi.spyOn(applicationRepository, "findAllByUserId").mockResolvedValue([
      {
        id: 1,
        company: "BrightPath",
        position: "Frontend Developer",
        status: "APPLIED",
        deadline: "2026-10-02T00:00:00Z",
        userId: 42,
      },
      {
        id: 2,
        company: "Northstar Labs",
        position: "Engineer",
        status: "INTERVIEW",
        deadline: null,
        userId: 42,
      },
    ] as any);
    const findContacts = vi.spyOn(contactRepository, "findAllByUserId").mockResolvedValue([
      {
        id: 9,
        firstName: "Priya",
        lastName: "Shah",
        jobTitle: "Graduate Recruiter",
        nextFollowUp: "2026-10-01T00:00:00Z",
        userId: 42,
      },
    ] as any);
    const findTasks = vi.spyOn(taskRepository, "findAllByUserId").mockResolvedValue([
      {
        id: 3,
        title: "Send thank-you note",
        description: "Thank the interview panel",
        dueDate: "2026-10-03T00:00:00Z",
        status: "PENDING",
        userId: 42,
        applicationId: 2,
        contactId: null,
      },
    ] as any);
    const findInterviews = vi.spyOn(informationalInterviewRepository, "findAllByUserId")
      .mockResolvedValue([] as any);

    const response = await request(app)
      .get("/api/dashboard?userId=999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(findApplications).toHaveBeenCalledWith(42);
    expect(findContacts).toHaveBeenCalledWith(42);
    expect(findTasks).toHaveBeenCalledWith(42);
    expect(findInterviews).toHaveBeenCalledWith(42);
    expect(response.body.metrics).toEqual({
      activeApplications: 2,
      interviews: 1,
      offers: 0,
      responseRate: 50,
    });
    expect(response.body.applications).toHaveLength(2);
    expect(response.body.upcomingTasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "application-1-deadline", type: "Deadline" }),
      expect.objectContaining({ id: "contact-9-follow-up", type: "Recruiter" }),
      expect.objectContaining({ id: "task-3", type: "Thank-you" }),
    ]));
  });

});