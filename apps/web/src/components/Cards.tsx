import { formatStatus } from "../status";
import type { JobApplication, InformationalInterview } from "../types";

export interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  accent: string;
}

export function MetricCard({ label, value, suffix = "", detail, accent }: MetricCardProps) {
  return (
    <article className={"metric-card " + accent}>
      <span>{label}</span>
      <strong>{value}{suffix}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function ApplicationCard({ application }: { application: JobApplication }) {
  const deadline = application.deadline
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short"
      }).format(new Date(application.deadline + "T12:00:00"))
    : null;

  return (
    <article className="application-card">
      <span className="status-label">{formatStatus(application.status)}</span>
      <h4>{application.position}</h4>
      <strong>{application.company}</strong>
      <span className="location">{application.location || "Location not specified"}</span>
      <div className="card-footer">
        <span>{deadline ? `Due ${deadline}` : "No deadline"}</span>
        <button type="button" className="card-action" aria-label={"Open " + application.position}>
          Open
        </button>
      </div>
    </article>
  );
}

export function InformationalInterviewCard({ interview }: { interview: InformationalInterview }) {
  const scheduledFor = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(interview.scheduledFor));

  const nextFollowUp = interview.nextFollowUp
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(
        new Date(interview.nextFollowUp + "T12:00:00")
      )
    : "Not scheduled";

  return (
    <article className="interview-card">
      <div className="interview-card-heading">
        <div>
          <span className="status-label">{interview.status}</span>
          <h3>{interview.contactName}</h3>
          <p>{interview.role} · {interview.company}</p>
        </div>
        <time dateTime={interview.scheduledFor}>{scheduledFor}</time>
      </div>
      <div className="interview-details">
        <div>
          <strong>Preparation</strong>
          <span>{interview.preparationQuestions.length} questions ready</span>
        </div>
        <div>
          <strong>Follow-up</strong>
          <span>{nextFollowUp}</span>
        </div>
        <div>
          <strong>Next action</strong>
          <span>{interview.recommendedAction ?? "Capture notes"}</span>
        </div>
      </div>
      {interview.keyTakeaway && (
        <p className="interview-takeaway">
          <strong>Key takeaway:</strong> {interview.keyTakeaway}
        </p>
      )}
      {interview.referral && (
        <p className="interview-referral">
          <strong>Referral:</strong> {interview.referral}
        </p>
      )}
      <p className="interview-referral">
        <strong>Thank-you note:</strong> {interview.thankYouSent ? "Sent" : "Pending"}
      </p>
    </article>
  );
}
