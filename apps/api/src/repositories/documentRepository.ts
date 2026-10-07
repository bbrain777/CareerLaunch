import { getDb } from "../db.js";

export type DocumentType = "RESUME" | "COVER_LETTER";

export type CreateDocumentInput = {
  type: DocumentType;
  fileName: string;
  pathname: string;
  blobUrl: string;
  contentType: string;
  sizeBytes: number;
};

export const documentRepository = {
  async findAllByUserId(userId: number) {
    return getDb().orm.public.Document.where({ userId }).all();
  },

  async findById(id: number, userId: number) {
    return getDb().orm.public.Document.where({ id, userId }).first();
  },

  async create(userId: number, data: CreateDocumentInput) {
    return getDb().orm.public.Document.create({ ...data, userId });
  },

  async delete(id: number, userId: number) {
    return getDb().orm.public.Document.where({ id, userId }).delete();
  },
};
