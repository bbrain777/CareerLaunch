import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { employerRepository } from "./repositories/employerRepository.js";

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);
const authorization = { Authorization: `Bearer ${token}` };

const employer = {
  id: 7,
  userId: 42,
  name: "CareerLaunch Labs",
  industry: "Technology",
  location: "London",
  website: "https://example.com",
  notes: null,
};

describe("authenticated employer routes", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("requires a bearer token", async () => {
    const findAll = vi.spyOn(employerRepository, "findAllByUserId");
    const response = await request(app).get("/api/employers");
    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it("uses JWT ownership and supports search", async () => {
    vi.spyOn(employerRepository, "findAllByUserId").mockResolvedValue([
      employer,
      { ...employer, id: 8, name: "Health Group", industry: "Healthcare" },
    ] as any);

    const response = await request(app)
      .get("/api/employers?search=technology&userId=999")
      .set(authorization);

    expect(response.status).toBe(200);
    expect(employerRepository.findAllByUserId).toHaveBeenCalledWith(42);
    expect(response.body.employers).toEqual([employer]);
  });

  it("creates an owned employer and ignores a body userId", async () => {
    vi.spyOn(employerRepository, "create").mockResolvedValue(employer as any);
    const response = await request(app)
      .post("/api/employers")
      .set(authorization)
      .send({ userId: 999, name: " CareerLaunch Labs ", website: "https://example.com" });

    expect(response.status).toBe(201);
    expect(employerRepository.create).toHaveBeenCalledWith(42, {
      name: "CareerLaunch Labs",
      website: "https://example.com",
    });
  });

  it("rejects invalid employer input", async () => {
    const create = vi.spyOn(employerRepository, "create");
    const response = await request(app)
      .post("/api/employers")
      .set(authorization)
      .send({ name: "", website: "javascript:alert(1)" });
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("does not update an employer owned by another user", async () => {
    vi.spyOn(employerRepository, "findById").mockResolvedValue(null);
    const update = vi.spyOn(employerRepository, "update");
    const response = await request(app)
      .patch("/api/employers/7")
      .set(authorization)
      .send({ name: "Changed" });
    expect(response.status).toBe(404);
    expect(employerRepository.findById).toHaveBeenCalledWith(7, 42);
    expect(update).not.toHaveBeenCalled();
  });

  it("updates only validated employer fields", async () => {
    vi.spyOn(employerRepository, "findById").mockResolvedValue(employer as any);
    vi.spyOn(employerRepository, "update").mockResolvedValue({
      ...employer,
      name: "Updated",
    } as any);
    const response = await request(app)
      .patch("/api/employers/7")
      .set(authorization)
      .send({ name: "Updated", userId: 999 });
    expect(response.status).toBe(200);
    expect(employerRepository.update).toHaveBeenCalledWith(7, 42, { name: "Updated" });
  });

  it("rejects invalid ids", async () => {
    const response = await request(app)
      .delete("/api/employers/not-a-number")
      .set(authorization);
    expect(response.status).toBe(400);
  });

  it("deletes only an owned employer", async () => {
    vi.spyOn(employerRepository, "findById").mockResolvedValue(employer as any);
    vi.spyOn(employerRepository, "delete").mockResolvedValue(undefined as any);
    const response = await request(app).delete("/api/employers/7").set(authorization);
    expect(response.status).toBe(204);
    expect(employerRepository.delete).toHaveBeenCalledWith(7, 42);
  });
});
