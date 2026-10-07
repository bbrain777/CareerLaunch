import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "./app.js";
import { documentRepository } from "./repositories/documentRepository.js";

const blobMocks = vi.hoisted(() => ({
  put: vi.fn(),
  del: vi.fn(),
  get: vi.fn(),
}));

vi.mock("@vercel/blob", () => blobMocks);

const token = jwt.sign(
  { userId: 42, email: "owner@example.com" },
  process.env.JWT_SECRET || "super-secret-careerlaunch-key",
);
const authorization = { Authorization: `Bearer ${token}` };

const documentRecord = {
  id: 8,
  type: "RESUME",
  fileName: "resume.pdf",
  pathname: "users/42/documents/resume.pdf",
  blobUrl: "https://example.private.blob.vercel-storage.com/resume.pdf",
  contentType: "application/pdf",
  sizeBytes: 12,
  userId: 42,
  createdAt: "2026-10-07T12:00:00Z",
  updatedAt: "2026-10-07T12:00:00Z",
};

describe("authenticated document routes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    blobMocks.put.mockReset();
    blobMocks.del.mockReset();
    blobMocks.get.mockReset();
  });

  it("requires a bearer token", async () => {
    const response = await request(app).get("/api/documents");
    expect(response.status).toBe(401);
  });

  it("lists only the authenticated user's document metadata", async () => {
    const findAll = vi.spyOn(documentRepository, "findAllByUserId").mockResolvedValue([documentRecord] as any);
    const response = await request(app).get("/api/documents").set(authorization);
    expect(response.status).toBe(200);
    expect(findAll).toHaveBeenCalledWith(42);
    expect(response.body.documents[0]).toMatchObject({
      id: 8,
      type: "RESUME",
      fileName: "resume.pdf",
      downloadUrl: "/api/documents/8/download",
    });
    expect(response.body.documents[0].blobUrl).toBeUndefined();
  });

  it("uploads an allowed private PDF and saves owner-scoped metadata", async () => {
    blobMocks.put.mockResolvedValue({
      pathname: documentRecord.pathname,
      url: documentRecord.blobUrl,
    });
    const create = vi.spyOn(documentRepository, "create").mockResolvedValue(documentRecord as any);

    const response = await request(app)
      .post("/api/documents")
      .set(authorization)
      .field("type", "RESUME")
      .attach("file", Buffer.from("sample-pdf"), {
        filename: "resume.pdf",
        contentType: "application/pdf",
      });

    expect(response.status).toBe(201);
    expect(blobMocks.put).toHaveBeenCalledWith(
      expect.stringContaining("users/42/documents/"),
      expect.any(Buffer),
      expect.objectContaining({ access: "private", contentType: "application/pdf" }),
    );
    expect(create).toHaveBeenCalledWith(42, expect.objectContaining({ type: "RESUME", fileName: "resume.pdf" }));
  });

  it("rejects unsupported file types before writing to storage", async () => {
    const response = await request(app)
      .post("/api/documents")
      .set(authorization)
      .field("type", "RESUME")
      .attach("file", Buffer.from("image"), {
        filename: "portrait.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("PDF, DOC, and DOCX");
    expect(blobMocks.put).not.toHaveBeenCalled();
  });

  it("does not delete a document owned by another user", async () => {
    vi.spyOn(documentRepository, "findById").mockResolvedValue(null);
    const remove = vi.spyOn(documentRepository, "delete");
    const response = await request(app).delete("/api/documents/8").set(authorization);
    expect(response.status).toBe(404);
    expect(blobMocks.del).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("deletes the private blob before its owned metadata", async () => {
    vi.spyOn(documentRepository, "findById").mockResolvedValue(documentRecord as any);
    const remove = vi.spyOn(documentRepository, "delete").mockResolvedValue(undefined as any);
    blobMocks.del.mockResolvedValue(undefined);
    const response = await request(app).delete("/api/documents/8").set(authorization);
    expect(response.status).toBe(204);
    expect(blobMocks.del).toHaveBeenCalledWith(documentRecord.blobUrl);
    expect(remove).toHaveBeenCalledWith(8, 42);
  });
});
