import type { CorsOptions } from "cors";

const productionOrigin = "https://careerlaunch-puce.vercel.app";
const localOrigins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173"];

function normalizedOrigin(value: string | undefined): string | undefined {
  const candidate = value?.trim();
  if (!candidate) return undefined;
  try {
    return new URL(candidate.includes("://") ? candidate : `https://${candidate}`).origin;
  } catch {
    return undefined;
  }
}

export function allowedCorsOrigins(environment: NodeJS.ProcessEnv = process.env) {
  const origins = new Set<string>([productionOrigin]);
  const configured = [
    environment.FRONTEND_URL,
    environment.VERCEL_URL,
    environment.VERCEL_BRANCH_URL,
    environment.VERCEL_PROJECT_PRODUCTION_URL,
    ...(environment.CORS_ORIGINS?.split(",") ?? []),
  ];

  for (const value of configured) {
    const origin = normalizedOrigin(value);
    if (origin) origins.add(origin);
  }

  if (environment.NODE_ENV !== "production") {
    for (const origin of localOrigins) origins.add(origin);
  }

  return origins;
}

export const corsOptions: CorsOptions = {
  credentials: true,
  maxAge: 86_400,
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    callback(null, allowedCorsOrigins().has(normalizedOrigin(origin) ?? ""));
  },
};
