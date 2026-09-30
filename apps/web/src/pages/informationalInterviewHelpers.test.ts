import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PREP_QUESTION_MAX,
  PREP_QUESTION_MIN,
  filterInterviews,
  getInterviewReadinessSummary,
  parsePreparationQuestions,
  selectInterviewReminders,
  validatePreparationQuestions,
} from "./informationalInterviewHelpers";
import type { InformationalInterview } from "../types";

function interview(overrides: Partial<InformationalInterview> = {}): InformationalInterview {
  return {
    id: 1,
    contactName: "Maya Thompson",
    role: "Engineer",
    company: "Northstar Labs",
    scheduledFor: "2026-09-16T14:00:00+01:00",
    status: "Scheduled",
    preparationQuestions: ["One", "Two", "Three"],
    keyTakeaway: null,
    recommendedAction: null,
    referral: null,
    thankYouSent: false,
    nextFollowUp: null,
    contactId: null,
    ...overrides,
  };
}

describe("preparation question helpers", () => {
  it("defines a three-to-five question range", () => {
    assert.equal(PREP_QUESTION_MIN, 3);
    assert.equal(PREP_QUESTION_MAX, 5);
  });

  it("parses one-per-line input into trimmed questions", () => {
    assert.deepEqual(parsePreparationQuestions("  One\n\nTwo \n Three  \n"), ["One", "Two", "Three"]);
    assert.deepEqual(parsePreparationQuestions(""), []);
  });

  it("requires three to five questions", () => {
    assert.match(validatePreparationQuestions(["One", "Two"]) ?? "", /at least 3/);
    assert.equal(validatePreparationQuestions(["One", "Two", "Three"]), null);
    assert.equal(validatePreparationQuestions(["1", "2", "3", "4", "5"]), null);
    assert.match(validatePreparationQuestions(["1", "2", "3", "4", "5", "6"]) ?? "", /5 or fewer/);
  });
});

describe("interview filtering", () => {
  const interviews = [
    interview({ id: 1, company: "Northstar Labs", status: "Scheduled" }),
    interview({ id: 2, contactName: "Daniel Okoro", company: "Cedar Analytics", status: "Completed" }),
  ];

  it("filters by company", () => {
    assert.equal(filterInterviews(interviews, "", "Cedar Analytics").length, 1);
    assert.equal(filterInterviews(interviews, "", "All").length, 2);
  });

  it("searches across contact, company, role, and status", () => {
    assert.equal(filterInterviews(interviews, "daniel", "All").length, 1);
    assert.equal(filterInterviews(interviews, "northstar", "All").length, 1);
    assert.equal(filterInterviews(interviews, "no-match", "All").length, 0);
  });
});

describe("dashboard readiness selectors", () => {
  it("selects only informational-interview reminders", () => {
    const reminders = selectInterviewReminders([
      { id: "1", title: "Prepare", due: null, type: "Interview", href: "/informational-interviews" },
      { id: "2", title: "Deadline", due: null, type: "Deadline", href: "/applications" },
    ]);
    assert.equal(reminders.length, 1);
    assert.equal(reminders[0].id, "1");
  });

  it("summarizes interview records for career readiness", () => {
    const summary = getInterviewReadinessSummary([
      interview({ id: 1, status: "Preparing", preparationQuestions: ["1", "2", "3"] }),
      interview({ id: 2, status: "Completed", thankYouSent: false, nextFollowUp: "2026-09-23" }),
      interview({ id: 3, status: "Completed", thankYouSent: true }),
    ]);
    assert.equal(summary.total, 3);
    assert.equal(summary.preparing, 1);
    assert.equal(summary.completed, 2);
    assert.equal(summary.thankYouPending, 1);
    assert.equal(summary.followUps, 1);
    assert.equal(summary.preparationQuestionCount, 9);
  });
});
