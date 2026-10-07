import { describe, expect, it } from "vitest";
import { allowedCorsOrigins } from "./cors.js";

describe("CORS origin configuration", () => {
  it("allows the stable production and current Vercel deployment domains", () => {
    const origins = allowedCorsOrigins({
      NODE_ENV: "production",
      VERCEL_URL: "careerlaunch-preview.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "careerlaunch-puce.vercel.app",
    });
    expect(origins).toContain("https://careerlaunch-puce.vercel.app");
    expect(origins).toContain("https://careerlaunch-preview.vercel.app");
  });

  it("accepts an explicit comma-separated allowlist", () => {
    const origins = allowedCorsOrigins({
      NODE_ENV: "production",
      CORS_ORIGINS: "https://student.example, https://review.example/path",
    });
    expect(origins).toContain("https://student.example");
    expect(origins).toContain("https://review.example");
  });

  it("allows localhost only outside production", () => {
    expect(allowedCorsOrigins({ NODE_ENV: "development" })).toContain("http://localhost:5173");
    expect(allowedCorsOrigins({ NODE_ENV: "production" })).not.toContain("http://localhost:5173");
  });
});
