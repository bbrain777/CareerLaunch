import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("CareerLaunch API", () => {
  it("reports a healthy service", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "careerlaunch-api"
    });
  });

  it("returns dashboard metrics and applications", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(200);
    expect(response.body.metrics.activeApplications).toBe(4);
    expect(response.body.applications).toHaveLength(4);
    expect(response.body.upcomingTasks).toHaveLength(3);
    expect(response.body.informationalInterviews).toHaveLength(2);
  });

  it("returns informational interview preparation and follow-up details", async () => {
    const response = await request(app).get("/api/informational-interviews");

    expect(response.status).toBe(200);
    expect(response.body.informationalInterviews).toHaveLength(2);
    expect(response.body.informationalInterviews[0].preparationQuestions).toHaveLength(3);
    expect(response.body.informationalInterviews[1]).toMatchObject({
      status: "Completed",
      thankYouSent: true
    });
  });
});
