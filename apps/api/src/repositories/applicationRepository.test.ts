import { describe, expect, it } from "vitest";
import { db } from "../db.js";
import { applicationRepository } from "./applicationRepository.js";

describe("applicationRepository", () => {
    it("finds applications for a user", async () => {
        const user = await db.orm.public.User
            .where({ email: "saleh@example.com" })
            .first();

        expect(user).toBeTruthy();

        const userId = Number(user!.id);
        const applications = await applicationRepository.findAllByUserId(userId);

        expect(applications.length).toBeGreaterThanOrEqual(4);
    });

    it("creates, finds, updates, and deletes an application", async () => {
        const user = await db.orm.public.User
            .where({ email: "saleh@example.com" })
            .first();

        expect(user).toBeTruthy();

        const userId = Number(user!.id);

        const created = await applicationRepository.create(userId, {
            company: "Repository Test Company",
            position: "Test Software Developer",
            location: "Kampala",
            status: "SAVED",
            notes: "Created by application repository test.",
        });

        expect(created.company).toBe("Repository Test Company");
        expect(created.position).toBe("Test Software Developer");
        expect(created.userId).toBe(userId);

        const applicationId = Number(created.id);

        const found = await applicationRepository.findById(
            applicationId,
            userId
        );

        expect(found).toBeTruthy();
        expect(found!.id).toBe(created.id);

        const updated = await applicationRepository.update(
            applicationId,
            userId,
            {
                status: "APPLIED",
                notes: "Updated by application repository test.",
            }
        );

        expect(updated).toBeTruthy();
        if (!updated) {
            throw new Error("Expected application update to succeed");
        }
        expect(updated.status).toBe("APPLIED");
        expect(updated.notes).toBe(
            "Updated by application repository test."
        );

        await applicationRepository.delete(applicationId, userId);

        const deleted = await applicationRepository.findById(
            applicationId,
            userId
        );

        expect(deleted).toBeNull();
    });
});