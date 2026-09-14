import type { ApplicationStatus } from "./types";

export const pipelineStatuses: ApplicationStatus[] = [
  "Saved",
  "Preparing",
  "Applied",
  "Interview",
  "Offer",
  "Closed"
];

export function formatStatus(status: ApplicationStatus): string {
  return status.toUpperCase();
}
