import { formatStatus } from "../status";
import type { JobApplication, InformationalInterview } from "../types";

export type MetricAccent = "teal" | "violet" | "amber" | "blue";

export interface MetricCardProps {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  accent: MetricAccent;
}

const accentBg: Record<MetricAccent, string> = {
  teal: "bg-[#e6f6f2] text-[#0a5c4d]",
  violet: "bg-[#f3effe] text-[#6b21a8]",
  amber: "bg-[#fef7ee] text-[#b45309]",
  blue: "bg-[#edf5fe] text-[#1d4ed8]",
};

export function MetricCard({ label, value, suffix = "", detail, accent }: MetricCardProps) {
  const bgClass = accentBg[accent] ?? "bg-white text-gray-900";

  return (
    <article className={`rounded-2xl p-5 transition-all border-0 ring-0 ${bgClass}`}>
      <span className="text-xs font-medium opacity-80">{label}</span>
      <strong className="my-2 block text-3xl font-semibold">
        {value}{suffix}
      </strong>
      <small className="block text-xs opacity-75 font-normal">{detail}</small>
    </article>
  );
}

export function ApplicationCard({
  application,
  onOpen,
}: {
  application: JobApplication;
  onOpen?: () => void;
}) {
  const deadline = application.deadline
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short"
      }).format(new Date(application.deadline + "T12:00:00"))
    : null;

  return (
    <article className="rounded-xl bg-white p-4 transition-all border-0 ring-0 group">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-[#0a5c4d] bg-[#e6f6f2] px-2 py-0.5 rounded-md">
          {formatStatus(application.status)}
        </span>
        <span className="text-xs text-gray-500 font-medium">{deadline ? `Due ${deadline}` : ""}</span>
      </div>
      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#0a5c4d] transition-colors">{application.position}</h4>
      <p className="text-xs font-medium text-gray-600 mt-0.5">{application.company}</p>
      {application.location && (
        <span className="mt-1 block text-xs text-gray-400">{application.location}</span>
      )}
      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          className="rounded-lg bg-gray-100 group-hover:bg-[#0a5c4d] group-hover:text-white px-3 py-1 text-xs font-medium text-gray-700 transition-all cursor-pointer border-0"
          aria-label={"Open " + application.position}
          onClick={onOpen ?? (() => window.location.assign("/applications"))}
        >
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
    <article className="rounded-2xl bg-white p-4 border-0 ring-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-block mb-1 text-xs font-semibold text-[#0a5c4d] bg-[#e6f6f2] px-2 py-0.5 rounded-md">
            {interview.status}
          </span>
          <h3 className="text-[15px] font-semibold">{interview.contactName}</h3>
          <p className="text-[14px] text-[var(--text-muted)]">{interview.role} · {interview.company}</p>
        </div>
        <time dateTime={interview.scheduledFor} className="whitespace-nowrap text-[12px] font-medium text-[var(--text-muted)]">
          {scheduledFor}
        </time>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <strong className="block text-[13px] font-medium text-[var(--text-main)]">Preparation</strong>
          <span className="text-[12px] text-[var(--text-muted)]">{interview.preparationQuestions.length} questions ready</span>
        </div>
        <div>
          <strong className="block text-[13px] font-medium text-[var(--text-main)]">Follow-up</strong>
          <span className="text-[12px] text-[var(--text-muted)]">{nextFollowUp}</span>
        </div>
        <div>
          <strong className="block text-[13px] font-medium text-[var(--text-main)]">Next action</strong>
          <span className="text-[12px] text-[var(--text-muted)]">{interview.recommendedAction ?? "Capture notes"}</span>
        </div>
      </div>
      {interview.keyTakeaway && (
        <p className="mt-3 rounded-[10px] bg-gray-50 px-3 py-2 text-[14px] text-gray-600">
          <strong className="font-medium">Key takeaway:</strong> {interview.keyTakeaway}
        </p>
      )}
      {interview.referral && (
        <p className="mt-3 rounded-[10px] bg-gray-50 px-3 py-2 text-[14px] text-gray-600">
          <strong className="font-medium">Referral:</strong> {interview.referral}
        </p>
      )}
      <p className="mt-3 rounded-[10px] bg-gray-50 px-3 py-2 text-[14px] text-gray-600">
        <strong className="font-medium">Thank-you note:</strong> {interview.thankYouSent ? "Sent" : "Pending"}
      </p>
    </article>
  );
}