import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatStatus, pipelineStatuses } from "./status";

describe("application status helpers", () => {
  it("includes the complete application pipeline", () => {
    assert.deepEqual(pipelineStatuses, [
      "Saved",
      "Preparing",
      "Applied",
      "Interview",
      "Offer",
      "Closed"
    ]);
  });

  it("formats a status for compact labels", () => {
    assert.equal(formatStatus("Interview"), "INTERVIEW");
  });
});
