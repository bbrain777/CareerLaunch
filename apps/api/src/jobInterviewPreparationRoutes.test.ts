
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { applicationRepository } from "./repositories/applicationRepository.js";
import { jobInterviewPreparationRepository } from "./repositories/jobInterviewPreparationRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

const preparation = {
  id: 10,
  userId: 42,
  company: "SizaForge Tech",
  role: "Software Engineer",
  scheduledFor: null,
  companyResearch: null,
  notes: null,
  practiceQuestions: ["Tell me about yourself"],
  resources: ["https://example.com"],
  responsibilities: [],
  skills: [],
  applicationId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("Job interview preparation routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requires authentication", async () => {
    const response = await request(app).get("/api/job-interview-preparations");
    expect(response.status).toBe(401);
  });

  it("lists preparations for the authenticated user", async () => {
    const spy = vi
      .spyOn(jobInterviewPreparationRepository, "findAllByUserId")
      .mockResolvedValue([preparation] as any);

    const response = await request(app)
      .get("/api/job-interview-preparations")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.jobInterviewPreparations).toHaveLength(1);
    expect(spy).toHaveBeenCalledWith(42);
  });

  it("creates valid interview preparation", async () => {
    vi.spyOn(jobInterviewPreparationRepository, "create")
      .mockResolvedValue(preparation as any);

    const response = await request(app)
      .post("/api/job-interview-preparations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "SizaForge Tech",
        role: "Software Engineer",
        practiceQuestions: ["Tell me about yourself"],
        resources: ["https://example.com"],
      });

    expect(response.status).toBe(201);
    expect(response.body.jobInterviewPreparation.company).toBe("SizaForge Tech");
  });

  it("rejects a non-HTTP resource URL", async () => {
    const response = await request(app)
      .post("/api/job-interview-preparations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "SizaForge Tech",
        role: "Software Engineer",
        resources: ["javascript:alert(1)"],
      });

    expect(response.status).toBe(400);
  });

  it("rejects more than 20 practice questions", async () => {
    const response = await request(app)
      .post("/api/job-interview-preparations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "SizaForge Tech",
        role: "Software Engineer",
        practiceQuestions: Array(21).fill("Practice question"),
      });

    expect(response.status).toBe(400);
  });

  it("rejects an invalid interview date", async () => {
    const response = await request(app)
      .post("/api/job-interview-preparations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "SizaForge Tech",
        role: "Software Engineer",
        scheduledFor: "not-a-date",
      });

    expect(response.status).toBe(400);
  });

  it("rejects an application not owned by the user", async () => {
    vi.spyOn(applicationRepository, "findById").mockResolvedValue(null as any);

    const response = await request(app)
      .post("/api/job-interview-preparations")
      .set("Authorization", `Bearer ${token}`)
      .send({
        company: "SizaForge Tech",
        role: "Software Engineer",
        applicationId: 999,
      });

    expect(response.status).toBe(400);
  });

  it("does not update a preparation owned by another user", async () => {
    vi.spyOn(jobInterviewPreparationRepository, "findById")
      .mockResolvedValue(null as any);

    const response = await request(app)
      .patch("/api/job-interview-preparations/10")
      .set("Authorization", `Bearer ${token}`)
      .send({ notes: "Updated notes" });

    expect(response.status).toBe(404);
  });

  it("rejects an empty update", async () => {
    vi.spyOn(jobInterviewPreparationRepository, "findById")
      .mockResolvedValue(preparation as any);

    const response = await request(app)
      .patch("/api/job-interview-preparations/10")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("does not delete a preparation owned by another user", async () => {
    const deleteSpy = vi.spyOn(jobInterviewPreparationRepository, "delete");
    vi.spyOn(jobInterviewPreparationRepository, "findById")
      .mockResolvedValue(null as any);

    const response = await request(app)
      .delete("/api/job-interview-preparations/10")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});