import { describe, expect, it } from "vitest";
import { getDb } from "../db.js";
import { dashboardRepository } from "./dashboardRepository.js";

describe.skipIf(!process.env["DATABASE_URL"])("dashboardRepository", () => {
    it("returns owner-scoped application metrics", async () => {
        const db = getDb();

        const user = await db.orm.public.User
            .where({ email: "saleh@example.com" })
            .first();

        expect(user).toBeTruthy();

        const userId = Number(user!.id);

        const metrics = await dashboardRepository.getApplicationMetrics(userId);

        expect(metrics).toEqual({
            activeApplications: expect.any(Number),
            interviews: expect.any(Number),
            offers: expect.any(Number),
            submitted: expect.any(Number),
            responses: expect.any(Number),
        });

        expect(metrics.activeApplications).toBeGreaterThanOrEqual(0);
        expect(metrics.interviews).toBeGreaterThanOrEqual(0);
        expect(metrics.offers).toBeGreaterThanOrEqual(0);
        expect(metrics.submitted).toBeGreaterThanOrEqual(0);
        expect(metrics.responses).toBeGreaterThanOrEqual(0);
    });

    it("returns zero metrics for a user with no applications", async () => {
        const db = getDb();

        const user = await db.orm.public.User
            .where({ email: "student@example.com" })
            .first();

        expect(user).toBeTruthy();

        const userId = Number(user!.id);

        const metrics = await dashboardRepository.getApplicationMetrics(userId);

        expect(metrics).toEqual({
            activeApplications: 0,
            interviews: 0,
            offers: 0,
            submitted: 0,
            responses: 0,
        });
    });
});