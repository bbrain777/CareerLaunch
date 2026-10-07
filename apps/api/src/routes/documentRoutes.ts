import { Readable } from "node:stream";
import { del, get, put } from "@vercel/blob";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { authenticatedUserId, AuthRequest, requireAuth } from "../middleware/auth.js";
import { documentRepository, type DocumentType } from "../repositories/documentRepository.js";

export const documentRouter = Router();

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const extensionByType: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 },
});

const receiveSingleDocument: RequestHandler = (request, response, next) => {
  upload.single("file")(request, response, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      response.status(413).json({ message: "Documents must be 5 MB or smaller" });
      return;
    }
    if (error) {
      response.status(400).json({ message: "Unable to read the uploaded document" });
      return;
    }
    next();
  });
};

function parseId(value: unknown): number | null {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDocumentType(value: unknown): DocumentType | null {
  if (value === "RESUME" || value === "COVER_LETTER") return value;
  return null;
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "document";
}

function serializeDocument(document: Record<string, any>) {
  return {
    id: Number(document.id),
    type: String(document.type),
    fileName: String(document.fileName),
    contentType: String(document.contentType),
    sizeBytes: Number(document.sizeBytes),
    createdAt: String(document.createdAt),
    downloadUrl: `/api/documents/${document.id}/download`,
  };
}

documentRouter.use(requireAuth);

documentRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const documents = await documentRepository.findAllByUserId(userId);
  response.json({ documents: documents.map(serializeDocument) });
});

documentRouter.post("/", receiveSingleDocument, async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const type = parseDocumentType(request.body.type);
  const file = request.file;

  if (!type) {
    response.status(400).json({ message: "Document type must be RESUME or COVER_LETTER" });
    return;
  }
  if (!file) {
    response.status(400).json({ message: "Select a PDF, DOC, or DOCX file" });
    return;
  }

  const extension = file.originalname.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_DOCUMENT_TYPES.has(file.mimetype) || !extensionByType[file.mimetype]?.includes(extension)) {
    response.status(400).json({ message: "Only PDF, DOC, and DOCX files are allowed" });
    return;
  }

  let blob: Awaited<ReturnType<typeof put>> | undefined;
  try {
    const pathname = `users/${userId}/documents/${Date.now()}-${safeFileName(file.originalname)}`;
    blob = await put(pathname, file.buffer, {
      access: "private",
      contentType: file.mimetype,
      addRandomSuffix: true,
    });
    const document = await documentRepository.create(userId, {
      type,
      fileName: file.originalname,
      pathname: blob.pathname,
      blobUrl: blob.url,
      contentType: file.mimetype,
      sizeBytes: file.size,
    });
    response.status(201).json({ document: serializeDocument(document) });
  } catch (error) {
    if (blob) await del(blob.url).catch(() => undefined);
    console.error("Document upload failed", error);
    response.status(500).json({ message: "Document upload failed" });
  }
});

documentRouter.get("/:id/download", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const id = parseId(request.params.id);
  if (!id) {
    response.status(400).json({ message: "Invalid document id" });
    return;
  }

  const document = await documentRepository.findById(id, userId);
  if (!document) {
    response.status(404).json({ message: "Document not found" });
    return;
  }

  const result = await get(String(document.blobUrl), { access: "private" });
  if (!result || result.statusCode !== 200) {
    response.status(404).json({ message: "Stored document not found" });
    return;
  }

  response.setHeader("Content-Type", String(document.contentType));
  response.setHeader("Content-Length", String(document.sizeBytes));
  response.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(String(document.fileName))}`);
  Readable.fromWeb(result.stream as any).pipe(response);
});

documentRouter.delete("/:id", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const id = parseId(request.params.id);
  if (!id) {
    response.status(400).json({ message: "Invalid document id" });
    return;
  }

  const document = await documentRepository.findById(id, userId);
  if (!document) {
    response.status(404).json({ message: "Document not found" });
    return;
  }

  await del(String(document.blobUrl));
  await documentRepository.delete(id, userId);
  response.status(204).send();
});
