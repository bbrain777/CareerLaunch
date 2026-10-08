import type { JobApplication } from "../types";

export type ApplicationSort =
  | "updated-desc"
  | "deadline-asc"
  | "deadline-desc"
  | "company-asc";

export type ApplicationFilterOptions = {
  query: string;
  status: string;
  deadlineFrom: string;
  deadlineTo: string;
  sort: ApplicationSort;
};

function deadlineTime(application: JobApplication): number | null {
  if (!application.deadline) return null;
  const value = Date.parse(`${application.deadline.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(value) ? null : value;
}

function updatedTime(application: JobApplication): number {
  const value = application.updatedAt ? Date.parse(application.updatedAt) : Number.NaN;
  return Number.isNaN(value) ? 0 : value;
}

export function filterAndSortApplications(
  applications: JobApplication[],
  options: ApplicationFilterOptions,
) {
  const query = options.query.trim().toLowerCase();
  const from = options.deadlineFrom ? Date.parse(`${options.deadlineFrom}T00:00:00Z`) : null;
  const to = options.deadlineTo ? Date.parse(`${options.deadlineTo}T23:59:59Z`) : null;

  return applications
    .filter((application) => {
      if (options.status !== "All" && application.status !== options.status) return false;
      if (
        query &&
        ![application.company, application.position, application.location, application.status]
          .join(" ")
          .toLowerCase()
          .includes(query)
      ) return false;

      if (from !== null || to !== null) {
        const deadline = deadlineTime(application);
        if (deadline === null) return false;
        if (from !== null && deadline < from) return false;
        if (to !== null && deadline > to) return false;
      }
      return true;
    })
    .sort((left, right) => {
      if (options.sort === "company-asc") {
        return left.company.localeCompare(right.company, undefined, { sensitivity: "base" });
      }
      if (options.sort === "updated-desc") {
        return updatedTime(right) - updatedTime(left) || left.company.localeCompare(right.company);
      }

      const leftDeadline = deadlineTime(left);
      const rightDeadline = deadlineTime(right);
      if (leftDeadline === null && rightDeadline === null) return left.company.localeCompare(right.company);
      if (leftDeadline === null) return 1;
      if (rightDeadline === null) return -1;
      return options.sort === "deadline-desc"
        ? rightDeadline - leftDeadline
        : leftDeadline - rightDeadline;
    });
}
