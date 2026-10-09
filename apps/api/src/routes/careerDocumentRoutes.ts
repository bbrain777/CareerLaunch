import { Router } from "express";
import {
authenticatedUserId,
requireAuth,
type AuthRequest,
} from "../middleware/auth.js";
import { applicationRepository } from "../repositories/applicationRepository.js";
import {
careerDocumentRepository,
type CareerDocumentInput,
type CareerDocumentType,
} from "../repositories/careerDocumentRepository.js";

export const careerDocumentRouter = Router();

const documentTypes = ["RESUME", "COVER_LETTER"] as const;
const maxTextLength = 200;
const maxStorageKeyLength = 200;
const maxFileSizeBytes = 25 * 1024 * 1024;

function parseId(value: string | string[] | undefined): number | undefined {
if (typeof value !== "string") return undefined;
const id = Number(value);
return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}

function isObjectBody(value: unknown): value is Record<string, unknown> {
return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseDocumentType(value: unknown): CareerDocumentType | undefined {
if (typeof value !== "string") return undefined;
const normalized = value.trim().toUpperCase();
return documentTypes.find((type) => type === normalized);
}

function isValidStorageReference(value: string): boolean {
if (
value.length > maxStorageKeyLength ||
!/^[A-Za-z0-9][A-Za-z0-9/_-]*$/.test(value)
) {
return false;
}

return !value.split("/").some(
(segment) => segment === "." || segment === "..",
);
}

function documentInput(
body: Record<string, unknown>,
partial = false,
): { data?: CareerDocumentInput; message?: string } {
const data: CareerDocumentInput = {};

for (const field of ["title", "version", "storageReference"] as const) {
if (partial && !Object.hasOwn(body, field)) continue;

const value = body[field];
if (typeof value !== "string" || !value.trim()) {
  return { message: `${field} is required` };
}

const trimmed = value.trim();

if (field === "storageReference") {
  if (!isValidStorageReference(trimmed)) {
    return {
      message: "storageReference must be a valid internal storage key",
    };
  }
} else if (trimmed.length > maxTextLength) {
  return {
    message: `${field} must not exceed ${maxTextLength} characters`,
  };
}

data[field] = trimmed;

}

if (!partial || Object.hasOwn(body, "documentType")) {
const documentType = parseDocumentType(body.documentType);
if (!documentType) {
return {
message: `documentType must be one of: ${documentTypes.join(", ")}`,
};
}
data.documentType = documentType;
}

for (const field of ["fileName", "mimeType"] as const) {
if (!Object.hasOwn(body, field)) continue;

const value = body[field];
if (value !== null && typeof value !== "string") {
  return { message: `${field} must be a string or null` };
}

if (typeof value === "string") {
  const trimmed = value.trim();
  if (trimmed.length > maxTextLength) {
    return {
      message: `${field} must not exceed ${maxTextLength} characters`,
    };
  }
  data[field] = trimmed || null;
} else {
  data[field] = null;
}

}

if (Object.hasOwn(body, "fileSizeBytes")) {
const value = body.fileSizeBytes;
if (
value !== null &&
(typeof value !== "number" ||
!Number.isSafeInteger(value) ||
value < 0 ||
value > maxFileSizeBytes)
) {
return {
message: `fileSizeBytes must be between 0 and ${maxFileSizeBytes}, or null`,
};
}
data.fileSizeBytes = value as number | null;
}

if (Object.hasOwn(body, "applicationId")) {
const value = body.applicationId;
if (value === null) {
data.applicationId = null;
} else if (
typeof value === "number" &&
Number.isSafeInteger(value) &&
value > 0
) {
data.applicationId = value;
} else {
return { message: "applicationId must be a positive integer or null" };
}
}

if (partial && Object.keys(data).length === 0) {
return { message: "Provide at least one field to update" };
}

return { data };
}

async function ownsApplication(
userId: number,
applicationId: number | null | undefined,
): Promise<boolean> {
if (applicationId == null) return true;
return Boolean(
await applicationRepository.findById(applicationId, userId),
);
}

careerDocumentRouter.use(requireAuth);

careerDocumentRouter.get("/", async (request: AuthRequest, response) => {
const userId = authenticatedUserId(request)!;
const documents = await careerDocumentRepository.findAllByUserId(userId);
response.json({ careerDocuments: documents });
});

careerDocumentRouter.get("/:id", async (request: AuthRequest, response) => {
const id = parseId(request.params.id);
if (!id) {
return response.status(400).json({
message: "id must be a positive integer",
});
}

const userId = authenticatedUserId(request)!;
const document = await careerDocumentRepository.findById(id, userId);
if (!document) {
return response.status(404).json({ message: "Career document not found" });
}

response.json({ careerDocument: document });
});

careerDocumentRouter.post("/", async (request: AuthRequest, response) => {
if (!isObjectBody(request.body)) {
return response.status(400).json({
message: "Request body must be an object",
});
}

const userId = authenticatedUserId(request)!;
const parsed = documentInput(request.body);
if (!parsed.data) {
return response.status(400).json({ message: parsed.message });
}

if (!(await ownsApplication(userId, parsed.data.applicationId))) {
return response.status(400).json({
message: "applicationId must reference an owned application",
});
}

const document = await careerDocumentRepository.create(userId, {
...parsed.data,
title: parsed.data.title!,
documentType: parsed.data.documentType!,
version: parsed.data.version!,
storageReference: parsed.data.storageReference!,
});

response.status(201).json({ careerDocument: document });
});

careerDocumentRouter.patch("/:id", async (request: AuthRequest, response) => {
const id = parseId(request.params.id);
if (!id) {
return response.status(400).json({
message: "id must be a positive integer",
});
}

if (!isObjectBody(request.body)) {
return response.status(400).json({
message: "Request body must be an object",
});
}

const userId = authenticatedUserId(request)!;
const existing = await careerDocumentRepository.findById(id, userId);
if (!existing) {
return response.status(404).json({ message: "Career document not found" });
}

const parsed = documentInput(request.body, true);
if (!parsed.data) {
return response.status(400).json({ message: parsed.message });
}

if (!(await ownsApplication(userId, parsed.data.applicationId))) {
return response.status(400).json({
message: "applicationId must reference an owned application",
});
}

const document = await careerDocumentRepository.update(
id,
userId,
parsed.data,
);
if (!document) {
return response.status(404).json({ message: "Career document not found" });
}

response.json({ careerDocument: document });
});

careerDocumentRouter.delete("/:id", async (request: AuthRequest, response) => {
const id = parseId(request.params.id);
if (!id) {
return response.status(400).json({
message: "id must be a positive integer",
});
}

const userId = authenticatedUserId(request)!;
const existing = await careerDocumentRepository.findById(id, userId);
if (!existing) {
return response.status(404).json({ message: "Career document not found" });
}

await careerDocumentRepository.delete(id, userId);
response.status(204).send();
});
