import type { Temporal } from "temporal-polyfill";
import { getDb } from "../db.js";

export type JobInterviewPreparationInput = {
company?: string;
role?: string;
scheduledFor?: Temporal.Instant | null;
companyResearch?: string | null;
notes?: string | null;
practiceQuestions?: string[];
resources?: string[];
responsibilities?: string[];
skills?: string[];
applicationId?: number | null;
};

export type CreateJobInterviewPreparationInput =
JobInterviewPreparationInput & {
company: string;
role: string;
};

export const jobInterviewPreparationRepository = {
async findAllByUserId(userId: number) {
return getDb().orm.public.JobInterviewPreparation
.where({ userId })
.all();
},

async findById(id: number, userId: number) {
return getDb().orm.public.JobInterviewPreparation
.where({ id, userId })
.first();
},

async create(
userId: number,
data: CreateJobInterviewPreparationInput,
) {
return getDb().orm.public.JobInterviewPreparation.create({
...data,
userId,
});
},

async update(
id: number,
userId: number,
data: JobInterviewPreparationInput,
) {
return getDb().orm.public.JobInterviewPreparation
.where({ id, userId })
.update(data);
},

async delete(id: number, userId: number) {
return getDb().orm.public.JobInterviewPreparation
.where({ id, userId })
.delete();
},
};
