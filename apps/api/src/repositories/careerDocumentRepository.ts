import { getDb } from "../db.js";

export type CareerDocumentType = "RESUME" | "COVER_LETTER";

export type CareerDocumentInput = {
title?: string;
documentType?: CareerDocumentType;
version?: string;
fileName?: string | null;
mimeType?: string | null;
fileSizeBytes?: number | null;
storageReference?: string;
applicationId?: number | null;
};

export type CreateCareerDocumentInput = CareerDocumentInput & {
title: string;
documentType: CareerDocumentType;
version: string;
storageReference: string;
};

export const careerDocumentRepository = {
async findAllByUserId(userId: number) {
return getDb().orm.public.CareerDocument.where({ userId }).all();
},

async findById(id: number, userId: number) {
return getDb().orm.public.CareerDocument.where({ id, userId }).first();
},

async create(userId: number, data: CreateCareerDocumentInput) {
return getDb().orm.public.CareerDocument.create({
...data,
userId,
});
},


async update(
  id: number,
  userId: number,
  data: CareerDocumentInput,
) {
  return getDb().orm.public.CareerDocument
    .where({ id, userId })
    .update(data);
},

async delete(id: number, userId: number) {
return getDb().orm.public.CareerDocument
.where({ id, userId })
.delete();
},
};
