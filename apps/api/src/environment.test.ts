import path from "node:path";
import { describe, expect, it } from "vitest";
import { environmentFiles } from "./environment.js";

describe("environment file discovery", () => {
  it("prefers API and repository local files before regular env files", () => {
    const files = environmentFiles();
    const apiDirectory = path.dirname(files[0]);
    const repositoryRoot = path.resolve(apiDirectory, "../..");

    expect(files).toEqual([
      path.join(apiDirectory, ".env.local"),
      path.join(repositoryRoot, ".env.local"),
      path.join(apiDirectory, ".env"),
      path.join(repositoryRoot, ".env"),
    ]);
  });
});
