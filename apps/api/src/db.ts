import "temporal-polyfill/full/global";
import "dotenv/config";

import postgres from "@prisma/orm-postgres/runtime";
import contractJson from "../prisma/contract.json" with { type: "json" };

type Contract = typeof contractJson;

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
}

export const db = postgres<any>({
    contractJson,
    url: databaseUrl,
});