import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
const apiDirectory = path.resolve(sourceDirectory, "..");
const repositoryRoot = path.resolve(apiDirectory, "../..");

export function environmentFiles(): string[] {
  return [
    path.join(apiDirectory, ".env.local"),
    path.join(repositoryRoot, ".env.local"),
    path.join(apiDirectory, ".env"),
    path.join(repositoryRoot, ".env"),
  ];
}

/**
 * Load local environment files without overriding variables supplied by the
 * hosting platform or the current shell. API-specific local values take
 * priority, followed by repository-level local values and regular .env files.
 *
 * Tests intentionally do not load developer credentials from disk.
 */
export function loadEnvironment(): void {
  if (process.env.NODE_ENV === "test") return;

  for (const file of environmentFiles()) {
    config({ path: file, override: false, quiet: true });
  }
}

loadEnvironment();
