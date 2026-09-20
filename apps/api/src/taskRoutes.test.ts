import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { taskRepository } from "./repositories/taskRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

describe("authenticated follow-up task integration", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("requires authentication", async () => {
    const findAll = vi.spyOn(taskRepository, "findAllByUserId");
    const response = await request(app).get("/api/tasks");

    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it("returns owner-scoped follow-ups using the dashboard contract", async () => {
    const findAll = vi.spyOn(taskRepository, "findAllByUserId").mockResolvedValue([
      {
        id: 3,
        title: "Follow up with recruiter",
        description: "Send a thank-you message",
        dueDate: "2026-09-25T00:00:00Z",
        status: "PENDING",
        userId: 42,
        applicationId: 7,
        contactId: 9,
      },
    ] as any);

    const response = await request(app)
      .get("/api/tasks?userId=999")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(42);
    expect(response.body.tasks[0]).toEqual({
      id: 3,
      title: "Follow up with recruiter",
      description: "Send a thank-you message",
      due: "2026-09-25",
      status: "Pending",
      type: "Follow-up",
      applicationId: 7,
      contactId: 9,
    });
  });
});
