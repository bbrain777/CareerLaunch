import { getDb } from "../db.js";

export type DashboardApplicationMetrics = {
    activeApplications: number;
    interviews: number;
    offers: number;
    submitted: number;
    responses: number;
};

export const dashboardRepository = {
    async getApplicationMetrics(
        userId: number,
    ): Promise<DashboardApplicationMetrics> {
        const db = getDb();

        const query = db.raw.sql`
      SELECT
        COUNT(*) FILTER (
          WHERE "status" IN ('SAVED', 'PREPARING', 'APPLIED', 'INTERVIEW')
        ) AS "activeApplications",

        COUNT(*) FILTER (
          WHERE "status" = 'INTERVIEW'
        ) AS "interviews",

        COUNT(*) FILTER (
          WHERE "status" = 'OFFER'
        ) AS "offers",

        COUNT(*) FILTER (
          WHERE "status" IN ('APPLIED', 'INTERVIEW', 'OFFER', 'CLOSED')
        ) AS "submitted",

        COUNT(*) FILTER (
          WHERE "status" IN ('INTERVIEW', 'OFFER', 'CLOSED')
        ) AS "responses"

      FROM "application"
      WHERE "userId" = ${userId}
    `.returnsRow({
            activeApplications: "pg/int8@1",
            interviews: "pg/int8@1",
            offers: "pg/int8@1",
            submitted: "pg/int8@1",
            responses: "pg/int8@1",
        });

        const [result] = await db.runtime().query(query.build());

        return {
            activeApplications: Number(result?.activeApplications ?? 0),
            interviews: Number(result?.interviews ?? 0),
            offers: Number(result?.offers ?? 0),
            submitted: Number(result?.submitted ?? 0),
            responses: Number(result?.responses ?? 0),
        };
    },
};