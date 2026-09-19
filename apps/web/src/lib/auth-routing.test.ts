import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isPublicAuthPath, requiresLogin } from "./auth-routing";

describe("authentication routing", () => {
  it("keeps login and signup public", () => {
    assert.equal(isPublicAuthPath("/login"), true);
    assert.equal(isPublicAuthPath("/signup"), true);
    assert.equal(requiresLogin("/login", null, false), false);
  });

  it("requires a session for application pages", () => {
    assert.equal(requiresLogin("/", null, false), true);
    assert.equal(requiresLogin("/applications", null, false), true);
    assert.equal(requiresLogin("/profile", "valid-token", false), false);
  });

  it("waits for session verification before redirecting", () => {
    assert.equal(requiresLogin("/", null, true), false);
  });
});
