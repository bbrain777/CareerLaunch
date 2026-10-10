import { GlobeIcon, CheckCircleIcon, GraduationCapIcon, LinkIcon, PencilSimpleIcon } from "@phosphor-icons/react";
import { Dialog, DialogDescription, DialogRoot, DialogTitle } from "../components/ui";
import type { JobApplication, JobInterviewPreparation } from "../types";

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not scheduled";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function InterviewPrepDetail({
  prep,
  application,
  open,
  onOpenChange,
  onEdit,
}: {
  prep: JobInterviewPreparation | null;
  application: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}) {
  if (!prep) return null;

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl" className="max-h-[85vh] overflow-y-auto px-6 py-5 rounded-[12px] bg-white border border-[#e9e7e2]">
        <DialogTitle className="text-[16px] font-semibold text-[#1d1c1a]">
          {prep.role} at {prep.company}
        </DialogTitle>
        <DialogDescription className="mt-0.5 text-[12.5px] text-[#57544e]">
          Interview Scheduled: {formatDate(prep.scheduledFor)}
          {application ? ` · Linked to application #${application.id}` : ""}
        </DialogDescription>

        <div className="mt-4 space-y-3.5">
          {prep.companyResearch && (
            <section className="rounded-[8px] bg-[#f6f5f2] border border-[#e9e7e2] p-3.5">
              <h3 className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">
                <GlobeIcon className="size-4 text-[#0a5c4d]" />
                Company research & insights
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-[13px] text-[#1d1c1a] leading-relaxed">
                {prep.companyResearch}
              </p>
            </section>
          )}

          {prep.responsibilities && prep.responsibilities.length > 0 && (
            <section className="rounded-[8px] bg-[#f6f5f2] border border-[#e9e7e2] p-3.5">
              <h3 className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">
                <CheckCircleIcon className="size-4 text-[#0a5c4d]" />
                Target responsibilities ({prep.responsibilities.length})
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-[#1d1c1a]">
                {prep.responsibilities.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {prep.skills && prep.skills.length > 0 && (
            <section className="rounded-[8px] bg-[#f6f5f2] border border-[#e9e7e2] p-3.5">
              <h3 className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">
                <GraduationCapIcon className="size-4 text-[#0a5c4d]" />
                Relevant skills & strengths ({prep.skills.length})
              </h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {prep.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-[4px] bg-[#e6f6f2] px-2 py-0.5 text-[11.5px] font-medium text-[#0a5c4d] border border-[#0a5c4d]/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {prep.practiceQuestions && prep.practiceQuestions.length > 0 && (
            <section className="rounded-[8px] bg-[#f6f5f2] border border-[#e9e7e2] p-3.5">
              <h3 className="text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">
                Practice questions ({prep.practiceQuestions.length})
              </h3>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] text-[#1d1c1a]">
                {prep.practiceQuestions.map((question, idx) => (
                  <li key={idx}>{question}</li>
                ))}
              </ol>
            </section>
          )}

          {prep.resources && prep.resources.length > 0 && (
            <section className="rounded-[8px] bg-[#f6f5f2] border border-[#e9e7e2] p-3.5">
              <h3 className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">
                <LinkIcon className="size-4 text-[#0a5c4d]" />
                Resources & links ({prep.resources.length})
              </h3>
              <ul className="mt-2 space-y-1 text-[13px]">
                {prep.resources.map((url, idx) => (
                  <li key={idx}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#0a5c4d] hover:underline break-all font-medium text-[12.5px]"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {prep.notes && (
            <section className="rounded-[8px] bg-[#f6f5f2] border border-[#e9e7e2] p-3.5">
              <h3 className="flex items-center gap-1.5 text-[11.5px] font-medium text-[#57544e] uppercase tracking-wider">
                <PencilSimpleIcon className="size-4 text-[#0a5c4d]" />
                Interview notes & talking points
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-[13px] text-[#1d1c1a] leading-relaxed">
                {prep.notes}
              </p>
            </section>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#e9e7e2] pt-4">
          <button
            type="button"
            className="h-[30px] px-3.5 rounded-lg text-[12.5px] font-medium bg-white border border-[#dad7d0] hover:bg-[#f6f5f2] text-[#1d1c1a] transition-colors cursor-pointer shadow-sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
          {onEdit && (
            <button
              type="button"
              className="inline-flex h-[30px] items-center justify-center rounded-lg bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] px-4 text-[12.5px] font-medium text-white transition-all cursor-pointer shadow-sm"
              onClick={onEdit}
            >
              Edit workspace
            </button>
          )}
        </div>
      </Dialog>
    </DialogRoot>
  );
}
