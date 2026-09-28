import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError } from "./api";
import { shouldNotifyQueryError } from "./queryClient";

describe("query error notifications", () => {
  it("hides an expected unauthorized error after the token is removed", () => {
    assert.equal(shouldNotifyQueryError(new ApiError(401, "No token provided"), false, false), false);
  });

  it("reports unauthorized errors while a token is still present", () => {
    assert.equal(shouldNotifyQueryError(new ApiError(401, "Token expired"), false, true), true);
  });

  it("does not replace cached data with an error toast", () => {
    assert.equal(shouldNotifyQueryError(new Error("Network error"), true, true), false);
  });

  it("reports other initial-load failures", () => {
    assert.equal(shouldNotifyQueryError(new ApiError(500, "Server error"), false, false), true);
  });
});
