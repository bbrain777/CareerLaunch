import { type FormEvent, useMemo, useState } from "react";
import { Alert02Icon } from "hugeicons-react";
import {
  Button,
  DatePickerField,
  Dialog,
  DialogDescription,
  DialogRoot,
  DialogTitle,
  Field,
  Input,
  InputArea,
  Select,
} from "./ui";
import type {
  JobApplication,
  JobInterviewPreparation,
  JobInterviewPreparationInput,
} from "../types";

function parseLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function InterviewPrepEditor({
  prep,
  applications,
  open,
  saving,
  deleting,
  onOpenChange,
  onSave,
  onDelete,
}: {
  prep?: JobInterviewPreparation;
  applications: JobApplication[];
  open: boolean;
  saving: boolean;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: JobInterviewPreparationInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [company, setCompany] = useState(prep?.company ?? "");
  const [role, setRole] = useState(prep?.role ?? "");
  const [scheduledFor, setScheduledFor] = useState(
    prep?.scheduledFor ? prep.scheduledFor.slice(0, 10) : ""
  );
  const [applicationId, setApplicationId] = useState(
    prep?.applicationId ? String(prep.applicationId) : "none"
  );
  const [companyResearch, setCompanyResearch] = useState(
    prep?.companyResearch ?? ""
  );
  const [responsibilities, setResponsibilities] = useState(
    prep?.responsibilities?.join("\n") ?? ""
  );
  const [skills, setSkills] = useState(prep?.skills?.join("\n") ?? "");
  const [practiceQuestions, setPracticeQuestions] = useState(
    prep?.practiceQuestions?.join("\n") ?? ""
  );
  const [resources, setResources] = useState(prep?.resources?.join("\n") ?? "");
  const [notes, setNotes] = useState(prep?.notes ?? "");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const applicationOptions = useMemo(
    () => ({
      none: "None (Standalone preparation)",
      ...Object.fromEntries(
        applications.map((app) => [
          String(app.id),
          `${app.position} at ${app.company}`,
        ])
      ),
    }),
    [applications]
  );

  function selectApplication(value: string) {
    setApplicationId(value);
    if (value === "none") return;
    const app = applications.find((candidate) => candidate.id === Number(value));
    if (!app) return;
    if (!company) setCompany(app.company);
    if (!role) setRole(app.position);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const parsedResources = parseLines(resources);
    for (const url of parsedResources) {
      if (!/^https?:\/\//i.test(url)) {
        setValidationError(`Resource "${url}" must be a valid HTTP or HTTPS URL.`);
        return;
      }
    }

    try {
      await onSave({
        company: company.trim(),
        role: role.trim(),
        scheduledFor: scheduledFor || null,
        applicationId: applicationId === "none" ? null : Number(applicationId),
        companyResearch: companyResearch.trim() || null,
        responsibilities: parseLines(responsibilities),
        skills: parseLines(skills),
        practiceQuestions: parseLines(practiceQuestions),
        resources: parsedResources,
        notes: notes.trim() || null,
      });
    } catch {
      // handled
    }
  }

  return (
    <>
      <DialogRoot open={open} onOpenChange={onOpenChange}>
        <Dialog size="xl" className="max-h-[85vh] overflow-y-auto px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-kumo-strong">
            {prep ? "Edit interview preparation" : "Add interview preparation"}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-kumo-subtle">
            Compile research, talking points, questions, and skill alignments.
          </DialogDescription>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Linked Job Application"
                className="w-full"
                value={applicationId}
                onValueChange={(val) => val && selectApplication(val)}
                items={applicationOptions}
              />
              <DatePickerField
                label="Interview Date"
                value={scheduledFor || null}
                onValueChange={(val) => setScheduledFor(val ?? "")}
              />
              <Field label="Company" required>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                />
              </Field>
              <Field label="Role / Position" required>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  required
                />
              </Field>
            </div>

            <Field label="Company Research & Background">
              <InputArea
                rows={3}
                value={companyResearch}
                onChange={(e) => setCompanyResearch(e.target.value)}
                placeholder="Key mission, culture insights, recent news, competitors..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Target Responsibilities (one per line)">
                <InputArea
                  rows={4}
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  placeholder="Lead web migration&#10;Design state architectures"
                />
              </Field>
              <Field label="Relevant Skills (one per line)">
                <InputArea
                  rows={4}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React 19&#10;TypeScript&#10;Performance Tuning"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Practice Questions (one per line)">
                <InputArea
                  rows={4}
                  value={practiceQuestions}
                  onChange={(e) => setPracticeQuestions(e.target.value)}
                  placeholder="Tell me about yourself.&#10;Describe a challenging bug you fixed."
                />
              </Field>
              <Field label="Resources & URLs (one per line)">
                <InputArea
                  rows={4}
                  value={resources}
                  onChange={(e) => setResources(e.target.value)}
                  placeholder="https://company.com/about&#10;https://github.com/company"
                />
              </Field>
            </div>

            <Field label="Interview Notes & Talking Points">
              <InputArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Personal questions for interviewer, compensation notes..."
              />
            </Field>

            {validationError && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {validationError}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {onDelete && (
                <button
                  type="button"
                  className="mr-auto h-10 rounded-xl bg-red-50 px-4 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                  disabled={saving || deleting}
                  onClick={() => setConfirmDeleteOpen(true)}
                >
                  Delete
                </button>
              )}
              <Button
                variant="secondary"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={saving || deleting || !company || !role}
              >
                {saving
                  ? "Saving..."
                  : prep
                  ? "Save changes"
                  : "Add interview prep"}
              </Button>
            </div>
          </form>
        </Dialog>
      </DialogRoot>

      <DialogRoot open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <Dialog size="sm" className="max-w-[420px] px-6 py-5">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Alert02Icon size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-kumo-strong">
                Delete interview preparation
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-kumo-subtle">
                Delete the interview preparation workspace for <strong>{prep?.company}</strong>? This cannot be undone.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            <button
              type="button"
              className="h-[30px] px-3 rounded-lg text-[12.5px] font-medium border border-[#dad7d0] bg-white hover:bg-[#f6f5f2] text-[#1d1c1a] transition-colors cursor-pointer shadow-sm"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3.5 text-[12.5px] font-medium text-white hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              disabled={deleting}
              onClick={async () => {
                if (onDelete) await onDelete();
                setConfirmDeleteOpen(false);
              }}
            >
              {deleting ? "Deleting..." : "Delete prep"}
            </button>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
