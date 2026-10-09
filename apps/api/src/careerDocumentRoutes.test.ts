import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { applicationRepository } from "./repositories/applicationRepository.js";
import { careerDocumentRepository } from "./repositories/careerDocumentRepository.js";

const token = jwt.sign(
{ userId: 42, email: "owner@example.com" },
process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);

const documentFixture = {
id: 7,
title: "Software Developer Resume",
documentType: "RESUME",
version: "v1",
fileName: "resume.pdf",
mimeType: "application/pdf",
fileSizeBytes: 12000,
storageReference: "users/42/documents/resume-v1",
applicationId: null,
userId: 42,
};

describe("Career document routes", () => {
beforeEach(() => {
vi.restoreAllMocks();
});

it("requires authentication", async () => {
const response = await request(app).get("/api/career-documents");

expect(response.status).toBe(401);

});

it("lists documents for the authenticated user", async () => {
const findAll = vi
.spyOn(careerDocumentRepository, "findAllByUserId")
.mockResolvedValue([documentFixture] as any);

const response = await request(app)
  .get("/api/career-documents?userId=999")
  .set("Authorization", `Bearer ${token}`);

expect(response.status).toBe(200);
expect(response.body.careerDocuments).toHaveLength(1);
expect(findAll).toHaveBeenCalledWith(42);

});

it("creates a document with a valid internal storage reference", async () => {
const create = vi
.spyOn(careerDocumentRepository, "create")
.mockResolvedValue(documentFixture as any);

const response = await request(app)
  .post("/api/career-documents")
  .set("Authorization", `Bearer ${token}`)
  .send({
    title: "Software Developer Resume",
    documentType: "RESUME",
    version: "v1",
    storageReference: "users/42/documents/resume-v1",
  });

expect(response.status).toBe(201);
expect(create).toHaveBeenCalledWith(
  42,
  expect.objectContaining({
    title: "Software Developer Resume",
    documentType: "RESUME",
    version: "v1",
    storageReference: "users/42/documents/resume-v1",
  }),
);

});

it("rejects an external URL as a storage reference", async () => {
const create = vi.spyOn(careerDocumentRepository, "create");

const response = await request(app)
  .post("/api/career-documents")
  .set("Authorization", `Bearer ${token}`)
  .send({
    title: "Resume",
    documentType: "RESUME",
    version: "v1",
    storageReference: "https://example.com/resume.pdf",
  });

expect(response.status).toBe(400);
expect(create).not.toHaveBeenCalled();

});

it("rejects a storage reference containing path traversal", async () => {
const create = vi.spyOn(careerDocumentRepository, "create");

const response = await request(app)
  .post("/api/career-documents")
  .set("Authorization", `Bearer ${token}`)
  .send({
    title: "Resume",
    documentType: "RESUME",
    version: "v1",
    storageReference: "users/42/../other/resume",
  });

expect(response.status).toBe(400);
expect(create).not.toHaveBeenCalled();

});

it("rejects a storage reference owned by another user", async () => {
const create = vi.spyOn(careerDocumentRepository, "create");

const response = await request(app)
  .post("/api/career-documents")
  .set("Authorization", `Bearer ${token}`)
  .send({
    title: "Resume",
    documentType: "RESUME",
    version: "v1",
    storageReference: "users/99/documents/resume-v1",
  });

expect(response.status).toBe(400);
expect(create).not.toHaveBeenCalled();
});

it("rejects an application that does not belong to the user", async () => {
vi.spyOn(applicationRepository, "findById").mockResolvedValue(null as any);
const create = vi.spyOn(careerDocumentRepository, "create");

const response = await request(app)
  .post("/api/career-documents")
  .set("Authorization", `Bearer ${token}`)
  .send({
    title: "Resume",
    documentType: "RESUME",
    version: "v1",
    storageReference: "users/42/documents/resume-v1",
    applicationId: 99,
  });

expect(response.status).toBe(400);
expect(create).not.toHaveBeenCalled();

});

it("does not allow updating a document owned by another user", async () => {
const findById = vi
.spyOn(careerDocumentRepository, "findById")
.mockResolvedValue(null as any);
const update = vi.spyOn(careerDocumentRepository, "update");

const response = await request(app)
  .patch("/api/career-documents/7")
  .set("Authorization", `Bearer ${token}`)
  .send({ title: "Changed title" });

expect(response.status).toBe(404);
expect(findById).toHaveBeenCalledWith(7, 42);
expect(update).not.toHaveBeenCalled();

});

it("rejects an empty update", async () => {
vi.spyOn(careerDocumentRepository, "findById").mockResolvedValue(
documentFixture as any,
);
const update = vi.spyOn(careerDocumentRepository, "update");

const response = await request(app)
  .patch("/api/career-documents/7")
  .set("Authorization", `Bearer ${token}`)
  .send({});

expect(response.status).toBe(400);
expect(update).not.toHaveBeenCalled();

});

it("does not delete a document owned by another user", async () => {
vi.spyOn(careerDocumentRepository, "findById").mockResolvedValue(null as any);
const deleteDocument = vi.spyOn(careerDocumentRepository, "delete");

const response = await request(app)
  .delete("/api/career-documents/7")
  .set("Authorization", `Bearer ${token}`);

expect(response.status).toBe(404);
expect(deleteDocument).not.toHaveBeenCalled();

});
});
