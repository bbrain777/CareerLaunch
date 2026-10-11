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

export function MetricCard({ label, value, suffix = "", detail, accent: _accent }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-1.5 p-3.5 sm:p-4 text-left bg-white transition-colors duration-140 hover:bg-[#f6f5f2]">
      <span className="text-[12.5px] font-normal text-[#57544e] flex items-center gap-1.5">
        {label}
      </span>
      <span className="text-[22px] font-semibold text-[#1d1c1a] tracking-tight tabular-nums leading-tight">
        {value}{suffix}
      </span>
      <span className="text-[12px] text-[#6b6760] font-normal truncate">
        {detail}
      </span>
    </div>
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
    <article className="rounded-[8px] bg-white p-3.5 border border-[#e9e7e2] transition-all hover:border-[#dad7d0] hover:shadow-[0_1px_2px_rgba(28,25,20,0.05)] group">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#0a5c4d] bg-[#e6f6f2] px-2 py-0.5 rounded-[5px]">
          <span className="size-1.5 rounded-full bg-[#0a5c4d]" />
          {formatStatus(application.status)}
        </span>
        <span className="text-[12px] text-[#8c8880] tabular-nums">{deadline ? `Due ${deadline}` : ""}</span>
      </div>
      <h4 className="text-[13.5px] font-semibold text-[#1d1c1a] group-hover:text-[#0a5c4d] transition-colors line-clamp-1">{application.position}</h4>
      <p className="text-[12.5px] text-[#57544e] mt-0.5">{application.company}</p>
      {application.location && (
        <span className="mt-1 block text-[11.5px] text-[#8c8880]">{application.location}</span>
      )}
      <div className="mt-3 pt-2.5 border-t border-[#f0eeea] flex items-center justify-between">
        <span className="text-[11.5px] text-[#8c8880]">Updated recently</span>
        <button
          type="button"
          className="h-[26px] px-2.5 rounded-[6px] bg-[#f6f5f2] border border-[#dad7d0] hover:bg-white text-[12px] font-medium text-[#1d1c1a] transition-colors cursor-pointer"
          aria-label={"View " + application.position}
          onClick={onOpen ?? (() => window.location.assign("/applications"))}
        >
          View details
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
    <article className="rounded-[10px] bg-white p-4 border border-[#e9e7e2] shadow-[0_1px_2px_rgba(28,25,20,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 mb-1.5 text-[11.5px] font-medium text-[#0a5c4d] bg-[#e6f6f2] px-2 py-0.5 rounded-[5px]">
            <span className="size-1.5 rounded-full bg-[#0a5c4d]" />
            {interview.status}
          </span>
          <h3 className="text-[14.5px] font-semibold text-[#1d1c1a]">{interview.contactName}</h3>
          <p className="text-[13px] text-[#57544e]">{interview.role} · {interview.company}</p>
        </div>
        <time dateTime={interview.scheduledFor} className="whitespace-nowrap text-[12px] text-[#6b6760] font-normal tabular-nums">
          {scheduledFor}
        </time>
      </div>
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 p-2.5 rounded-[6px] bg-[#f6f5f2] border border-[#e9e7e2]">
        <div>
          <strong className="block text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">Preparation</strong>
          <span className="text-[12.5px] text-[#1d1c1a] font-normal">{interview.preparationQuestions.length} questions</span>
        </div>
        <div>
          <strong className="block text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">Follow-up</strong>
          <span className="text-[12.5px] text-[#1d1c1a] font-normal">{nextFollowUp}</span>
        </div>
        <div>
          <strong className="block text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">Next action</strong>
          <span className="text-[12.5px] text-[#1d1c1a] font-normal truncate block">{interview.recommendedAction ?? "Capture notes"}</span>
        </div>
      </div>
      {interview.keyTakeaway && (
        <p className="mt-2.5 rounded-[6px] bg-[#fbfaf8] border border-[#e9e7e2] px-3 py-2 text-[12.5px] text-[#57544e]">
          <strong className="font-semibold text-[#1d1c1a]">Key takeaway:</strong> {interview.keyTakeaway}
        </p>
      )}
      {interview.referral && (
        <p className="mt-2 rounded-[6px] bg-[#fbfaf8] border border-[#e9e7e2] px-3 py-2 text-[12.5px] text-[#57544e]">
          <strong className="font-semibold text-[#1d1c1a]">Referral:</strong> {interview.referral}
        </p>
      )}
    </article>
  );
}