import { Readable } from "node:stream";
import { del, get, put } from "@vercel/blob";
import { Router, type RequestHandler } from "express";
import multer from "multer";
import { authenticatedUserId, AuthRequest, requireAuth } from "../middleware/auth.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import { careerDocumentRepository } from "../repositories/careerDocumentRepository.js";
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

function serializeDocument(
  document: Record<string, any>,
  metadata?: Record<string, any> | null,
) {
  return {
    id: Number(document.id),
    type: String(document.type),
    fileName: String(document.fileName),
    title: String(metadata?.title ?? document.fileName),
    version: String(metadata?.version ?? "v1"),
    applicationId: metadata?.applicationId == null ? null : Number(metadata.applicationId),
    contentType: String(document.contentType),
    sizeBytes: Number(document.sizeBytes),
    createdAt: String(document.createdAt),
    downloadUrl: `/api/documents/${document.id}/download`,
  };
}

documentRouter.use(requireAuth);

documentRouter.get("/", async (request: AuthRequest, response) => {
  const userId = authenticatedUserId(request)!;
  const [documents, metadata] = await Promise.all([
    documentRepository.findAllByUserId(userId),
    careerDocumentRepository.findAllByUserId(userId),
  ]);
  // Blob records own private file access; career metadata is joined by the unique blob pathname.
  const metadataByStorageReference = new Map(
    metadata.map((item) => [item.storageReference, item]),
  );
  response.json({
    documents: documents.map((document) =>
      serializeDocument(document, metadataByStorageReference.get(document.pathname)),
    ),
  });
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

  const title = typeof request.body.title === "string" && request.body.title.trim()
    ? request.body.title.trim()
    : file.originalname;
  const version = typeof request.body.version === "string" && request.body.version.trim()
    ? request.body.version.trim()
    : "v1";
  if (title.length > 200 || version.length > 200) {
    response.status(400).json({ message: "Document title and version must not exceed 200 characters" });
    return;
  }

  let applicationId: number | null = null;
  if (request.body.applicationId) {
    applicationId = Number(request.body.applicationId);
    if (!Number.isSafeInteger(applicationId) || applicationId <= 0) {
      response.status(400).json({ message: "applicationId must be a positive integer or empty" });
      return;
    }
    if (!(await applicationRepository.findById(applicationId, userId))) {
      response.status(400).json({ message: "applicationId must reference an owned application" });
      return;
    }
  }

  let blob: Awaited<ReturnType<typeof put>> | undefined;
  let savedDocument: Record<string, any> | undefined;
  let savedMetadata: Record<string, any> | undefined;
  try {
    const pathname = `users/${userId}/documents/${Date.now()}-${safeFileName(file.originalname)}`;
    blob = await put(pathname, file.buffer, {
      access: "private",
      contentType: file.mimetype,
      addRandomSuffix: true,
    });
    savedDocument = await documentRepository.create(userId, {
      type,
      fileName: file.originalname,
      pathname: blob.pathname,
      blobUrl: blob.url,
      contentType: file.mimetype,
      sizeBytes: file.size,
    });
    savedMetadata = await careerDocumentRepository.create(userId, {
      title,
      documentType: type,
      version,
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      storageReference: blob.pathname,
      applicationId,
    });
    response.status(201).json({ document: serializeDocument(savedDocument, savedMetadata) });
  } catch (error) {
    // Blob storage and the two database records cannot share a transaction, so compensate any partial upload.
    const cleanup = await Promise.allSettled([
      ...(savedMetadata
        ? [careerDocumentRepository.delete(Number(savedMetadata.id), userId)]
        : []),
      ...(savedDocument
        ? [documentRepository.delete(Number(savedDocument.id), userId)]
        : []),
      ...(blob ? [del(blob.url)] : []),
    ]);
    for (const result of cleanup) {
      if (result.status === "rejected") {
        console.error("Document upload cleanup failed", result.reason);
      }
    }
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
  const metadata = await careerDocumentRepository.findByStorageReference(
    String(document.pathname),
    userId,
  );
  if (metadata) {
    await careerDocumentRepository.delete(Number(metadata.id), userId);
  }
  await documentRepository.delete(id, userId);
  response.status(204).send();
});
