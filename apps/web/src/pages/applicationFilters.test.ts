import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JobApplication } from "../types.js";
import { filterAndSortApplications } from "./applicationFilters.js";

const applications: JobApplication[] = [
  { id: 1, company: "Zephyr", position: "Engineer", location: "Leeds", status: "Applied", deadline: "2026-10-20", updatedAt: "2026-10-01T10:00:00Z" },
  { id: 2, company: "Acme", position: "Analyst", location: "London", status: "Saved", deadline: "2026-10-10", updatedAt: "2026-10-05T10:00:00Z" },
  { id: 3, company: "Beacon", position: "Designer", location: null, status: "Applied", deadline: null, updatedAt: "2026-10-03T10:00:00Z" },
];

const base = { query: "", status: "All", deadlineFrom: "", deadlineTo: "" };

describe("application filtering and sorting", () => {
  it("combines text and status filters", () => {
    const result = filterAndSortApplications(applications, { ...base, query: "zeph", status: "Applied", sort: "company-asc" });
    assert.deepEqual(result.map((application) => application.id), [1]);
  });

  it("uses an inclusive deadline range and excludes missing deadlines", () => {
    const result = filterAndSortApplications(applications, { ...base, deadlineFrom: "2026-10-10", deadlineTo: "2026-10-20", sort: "deadline-asc" });
    assert.deepEqual(result.map((application) => application.id), [2, 1]);
  });

  it("sorts deadlines in both directions with missing deadlines last", () => {
    const ascending = filterAndSortApplications(applications, { ...base, sort: "deadline-asc" });
    const descending = filterAndSortApplications(applications, { ...base, sort: "deadline-desc" });
    assert.deepEqual(ascending.map((application) => application.id), [2, 1, 3]);
    assert.deepEqual(descending.map((application) => application.id), [1, 2, 3]);
  });

  it("sorts by recent update and company", () => {
    const recent = filterAndSortApplications(applications, { ...base, sort: "updated-desc" });
    const company = filterAndSortApplications(applications, { ...base, sort: "company-asc" });
    assert.deepEqual(recent.map((application) => application.id), [2, 3, 1]);
    assert.deepEqual(company.map((application) => application.id), [2, 3, 1]);
  });
});
