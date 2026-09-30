import { type FormEvent, useMemo, useState } from "react";
import { Alert02Icon, Search01Icon } from "hugeicons-react";
import {
  Button, DatePickerField, Dialog, DialogDescription, DialogRoot, DialogTitle,
  Field, Input, InputArea, Select, Table,
} from "../components/ui";
import {
  useContactsQuery, useCreateInterviewMutation, useDeleteInterviewMutation,
  useEmployersQuery, useInterviewsQuery, useUpdateInterviewMutation,
} from "../hooks/queries";
import type { Contact, Employer, InformationalInterview, InformationalInterviewInput } from "../types";
import {
  PREP_QUESTION_MAX,
  PREP_QUESTION_MIN,
  filterInterviews,
  parsePreparationQuestions,
  validatePreparationQuestions,
} from "./informationalInterviewHelpers";

type EditorState = { mode: "create" } | { mode: "edit"; interview: InformationalInterview };

const statusOptions = {
  Preparing: "Preparing",
  Scheduled: "Scheduled",
  Completed: "Completed",
};

const fullDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function InformationalInterviewsPage() {
  const {
    data: interviews = [],
    isLoading: loading,
    isError: interviewsError,
    error: interviewsErrorDetail,
    refetch: refetchInterviews,
  } = useInterviewsQuery();
  const { data: contacts = [] } = useContactsQuery();
  const { data: employers = [] } = useEmployersQuery();
  const createInterview = useCreateInterviewMutation();
  const updateInterview = useUpdateInterviewMutation();
  const deleteInterview = useDeleteInterviewMutation();
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [detail, setDetail] = useState<InformationalInterview | null>(null);

  const companies = useMemo(() => {
    const set = new Set<string>();
    interviews.forEach((interview) => {
      if (interview.company) set.add(interview.company);
    });
    return Array.from(set).sort();
  }, [interviews]);

  const filteredInterviews = useMemo(
    () => filterInterviews(interviews, query, companyFilter),
    [interviews, query, companyFilter],
  );

  function openCreate() {
    setEditor({ mode: "create" });
    setEditorKey((key) => key + 1);
  }

  function openEdit(interview: InformationalInterview) {
    setDetail(null);
    setEditor({ mode: "edit", interview });
    setEditorKey((key) => key + 1);
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">Networking</span>
          <h1 className="truncate">Informational interviews</h1>
        </div>
        <Button variant="primary" className="!h-8.5 !rounded-[14px] !px-3 !text-[13px] !font-medium sm:!px-3.5" onClick={openCreate}>
          Add interview
        </Button>
      </header>

      <InterviewEditor
        key={editorKey}
        interview={editor?.mode === "edit" ? editor.interview : undefined}
        contacts={contacts}
        employers={employers}
        open={editor !== null}
        saving={createInterview.isPending || updateInterview.isPending}
        deleting={deleteInterview.isPending}
        onOpenChange={(open) => { if (!open) setEditor(null); }}
        onSave={async (input) => {
          if (editor?.mode === "edit") {
            await updateInterview.mutateAsync({ id: editor.interview.id, changes: input });
          } else {
            await createInterview.mutateAsync(input);
          }
          setEditor(null);
        }}
        onDelete={editor?.mode === "edit" ? async () => {
          await deleteInterview.mutateAsync(editor.interview.id);
          setEditor(null);
        } : undefined}
      />

      <InterviewDetail
        interview={detail}
        open={detail !== null}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        onEdit={detail ? () => openEdit(detail) : undefined}
      />

      <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6" aria-label="Informational interviews">
        <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-[220px] sm:flex-none">
            <Select
              aria-label="Filter interviews by company"
              value={companyFilter}
              onValueChange={(value) => value && setCompanyFilter(value)}
              className="w-full"
              items={{
                All: `All companies (${interviews.length})`,
                ...Object.fromEntries(companies.map((company) => [company,
                  `${company} (${interviews.filter((interview) => interview.company === company).length})`])),
              }}
            />
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl border border-gray-200/60 bg-gray-100/80 px-3.5 py-2 text-gray-400 focus-within:border-[#0a5c4d] focus-within:ring-2 focus-within:ring-[#0a5c4d]/20 sm:w-[280px] md:w-[320px]">
            <span className="sr-only">Search interviews</span>
            <Search01Icon size={16} className="shrink-0 text-gray-500" />
            <input
              type="text"
              className="w-full border-0 bg-transparent p-0 text-sm text-gray-900 shadow-none outline-none placeholder:text-gray-400 focus:ring-0"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search interviews"
            />
          </label>
        </div>

        {interviewsError && !loading ? (
          <div className="rounded-xl bg-red-50 px-4 py-5 text-center" role="alert">
            <p className="text-sm font-medium text-red-700">Couldn&apos;t load informational interviews.</p>
            <p className="mt-1 text-xs text-red-600">
              {interviewsErrorDetail instanceof Error ? interviewsErrorDetail.message : "The API request failed."}
            </p>
            <button
              type="button"
              className="mt-3 h-9 rounded-xl bg-red-600 px-4 text-xs font-medium text-white hover:bg-red-700"
              onClick={() => { void refetchInterviews(); }}
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="page-loading" role="status" aria-live="polite"><span className="page-loader" aria-hidden="true" /><span>Loading interviews</span></div>
        ) : filteredInterviews.length ? (
          <div className="w-full overflow-x-auto pb-2">
            <Table className="min-w-[760px]">
              <Table.Header><Table.Row>
                <Table.Head className="min-w-[130px]">Contact</Table.Head>
                <Table.Head className="min-w-[150px]">Company / role</Table.Head>
                <Table.Head className="min-w-[120px]">Date</Table.Head>
                <Table.Head className="min-w-[100px]">Status</Table.Head>
                <Table.Head className="min-w-[160px]">Next action</Table.Head>
                <Table.Head className="min-w-[140px] text-right">Actions</Table.Head>
              </Table.Row></Table.Header>
              <Table.Body>
                {filteredInterviews.map((interview) => (
                  <Table.Row key={interview.id}>
                    <Table.Cell className="font-medium text-gray-900">{interview.contactName}</Table.Cell>
                    <Table.Cell>{interview.role} {interview.company ? `at ${interview.company}` : ""}</Table.Cell>
                    <Table.Cell>{fullDate.format(new Date(interview.scheduledFor))}</Table.Cell>
                    <Table.Cell>{interview.status}</Table.Cell>
                    <Table.Cell className="max-w-xs truncate">{interview.recommendedAction || interview.keyTakeaway || "—"}</Table.Cell>
                    <Table.Cell className="text-right">
                      <span className="inline-flex justify-end gap-2">
                        <button type="button" className="rounded-[6px] border border-gray-200 bg-white px-2.5 py-1 text-[14px] font-medium text-gray-700 hover:bg-gray-100" aria-label={`View interview with ${interview.contactName}`} onClick={() => setDetail(interview)}>View</button>
                        <button type="button" className="rounded-[6px] border-0 bg-[#e6f6f2] px-2.5 py-1 text-[14px] font-medium text-[#0a5c4d] hover:bg-[#cceee5]" aria-label={`Edit interview with ${interview.contactName}`} onClick={() => openEdit(interview)}>Edit</button>
                      </span>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        ) : interviews.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">No informational interviews recorded yet.</p>
            <p className="mt-1 text-sm text-gray-500">Add your first conversation to start tracking preparation and follow-ups.</p>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-gray-500">No informational interviews match your search.</p>
        )}
      </section>
    </>
  );
}

function InterviewDetail({ interview, open, onOpenChange, onEdit }: {
  interview: InformationalInterview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
}) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl" className="max-h-[85vh] overflow-y-auto px-6 py-5">
        <DialogTitle className="text-lg font-semibold text-kumo-strong">
          {interview ? `Conversation with ${interview.contactName}` : "Interview details"}
        </DialogTitle>
        <DialogDescription className="mt-0.5 text-xs text-kumo-subtle">
          {interview ? `${interview.role}${interview.company ? ` at ${interview.company}` : ""} · ${interview.status}` : "Interview details."}
        </DialogDescription>
        {interview && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <dl className="contents">
              <div className="rounded-xl bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Contact</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">{interview.contactName}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Status</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{interview.status}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Role and company research</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{interview.role}{interview.company ? ` at ${interview.company}` : ""}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Interview date</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{fullDate.format(new Date(interview.scheduledFor))}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Thank-you status</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{interview.thankYouSent ? "Sent" : "Pending"}</dd>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <dt className="text-xs font-medium text-gray-500">Follow-up date</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{interview.nextFollowUp ?? "Not scheduled"}</dd>
              </div>
            </dl>
            <section className="sm:col-span-2" aria-label="Preparation questions">
              <h3 className="text-sm font-semibold text-gray-900">Preparation questions ({interview.preparationQuestions.length})</h3>
              {interview.preparationQuestions.length ? (
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
                  {interview.preparationQuestions.map((question, index) => (
                    <li key={`${index}-${question}`}>{question}</li>
                  ))}
                </ol>
              ) : (
                <p className="mt-1 text-sm text-gray-500">No preparation questions recorded.</p>
              )}
            </section>
            <section aria-label="Interview notes">
              <h3 className="text-sm font-semibold text-gray-900">Key takeaway</h3>
              <p className="mt-1 text-sm text-gray-700">{interview.keyTakeaway || "—"}</p>
            </section>
            <section aria-label="Recommended next step">
              <h3 className="text-sm font-semibold text-gray-900">Recommended action</h3>
              <p className="mt-1 text-sm text-gray-700">{interview.recommendedAction || "—"}</p>
            </section>
            <section className="sm:col-span-2" aria-label="Referrals and contacts">
              <h3 className="text-sm font-semibold text-gray-900">Referral</h3>
              <p className="mt-1 text-sm text-gray-700">{interview.referral || "—"}</p>
            </section>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" className="h-10 rounded-xl bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200" onClick={() => onOpenChange(false)}>Close</button>
          {onEdit && <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a5c4d] px-5 text-sm font-medium text-white hover:bg-[#07473b]" onClick={onEdit}>Edit interview</button>}
        </div>
      </Dialog>
    </DialogRoot>
  );
}

function InterviewEditor({ interview, contacts, employers, open, saving, deleting, onOpenChange, onSave, onDelete }: {
  interview?: InformationalInterview;
  contacts: Contact[];
  employers: Employer[];
  open: boolean;
  saving: boolean;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: InformationalInterviewInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const employerById = useMemo(() => new Map(employers.map((employer) => [employer.id, employer])), [employers]);
  const [contactId, setContactId] = useState(interview?.contactId ? String(interview.contactId) : "none");
  const [contactName, setContactName] = useState(interview?.contactName ?? "");
  const [role, setRole] = useState(interview?.role ?? "");
  const [company, setCompany] = useState(interview?.company ?? "");
  const [scheduledFor, setScheduledFor] = useState(interview?.scheduledFor?.slice(0, 10) ?? "");
  const [status, setStatus] = useState<InformationalInterviewInput["status"]>(interview?.status ?? "Preparing");
  const [questions, setQuestions] = useState(interview?.preparationQuestions.join("\n") ?? "");
  const [questionsTouched, setQuestionsTouched] = useState(false);
  const [keyTakeaway, setKeyTakeaway] = useState(interview?.keyTakeaway ?? "");
  const [recommendedAction, setRecommendedAction] = useState(interview?.recommendedAction ?? "");
  const [referral, setReferral] = useState(interview?.referral ?? "");
  const [thankYouSent, setThankYouSent] = useState(interview?.thankYouSent ?? false);
  const [nextFollowUp, setNextFollowUp] = useState(interview?.nextFollowUp ?? "");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const contactOptions = useMemo(() => ({
    none: "No linked contact",
    ...Object.fromEntries(contacts.map((contact) => [String(contact.id),
      [contact.firstName, contact.lastName].filter(Boolean).join(" ")])),
  }), [contacts]);

  const parsedQuestions = useMemo(() => parsePreparationQuestions(questions), [questions]);
  const questionsError = (questionsTouched || interview) ? validatePreparationQuestions(parsedQuestions) : null;
  const questionsErrorId = "interview-questions-error";

  function selectContact(value: string) {
    setContactId(value);
    if (value === "none") return;
    const contact = contacts.find((candidate) => candidate.id === Number(value));
    if (!contact) return;
    setContactName([contact.firstName, contact.lastName].filter(Boolean).join(" "));
    setRole(contact.jobTitle ?? "");
    setCompany(employerById.get(contact.employerId ?? -1)?.name ?? "");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuestionsTouched(true);
    const validationError = validatePreparationQuestions(parsedQuestions);
    if (validationError) return;
    try {
      await onSave({
        contactName: contactName.trim(), role: role.trim(), company: company.trim() || null,
        scheduledFor, status,
        preparationQuestions: parsedQuestions,
        keyTakeaway: keyTakeaway.trim() || null,
        recommendedAction: recommendedAction.trim() || null,
        referral: referral.trim() || null,
        thankYouSent, nextFollowUp: nextFollowUp || null,
        contactId: contactId === "none" ? null : Number(contactId),
      });
    } catch { return; }
  }

  return (
    <>
      <DialogRoot open={open} onOpenChange={onOpenChange}>
        <Dialog size="xl" className="max-h-[85vh] overflow-y-auto px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-kumo-strong">{interview ? "Edit informational interview" : "Add informational interview"}</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-kumo-subtle">Plan the conversation, capture outcomes, and schedule the next follow-up.</DialogDescription>
          <form className="mt-4" onSubmit={handleSubmit} noValidate={false}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select label="Linked contact" className="w-full" value={contactId} onValueChange={(value) => value && selectContact(value)} items={contactOptions} />
              <Field label="Contact name" required><Input value={contactName} onChange={(event) => setContactName(event.target.value)} required /></Field>
              <Field label="Role" required><Input value={role} onChange={(event) => setRole(event.target.value)} required /></Field>
              <Field label="Company"><Input value={company} onChange={(event) => setCompany(event.target.value)} /></Field>
              <DatePickerField label="Interview date" value={scheduledFor || null} onValueChange={(value) => setScheduledFor(value ?? "")} />
              <Select label="Status" className="w-full" value={status} onValueChange={(value) => value && setStatus(value as InformationalInterviewInput["status"])} items={statusOptions} />
              <DatePickerField label="Next follow-up" value={nextFollowUp || null} onValueChange={(value) => setNextFollowUp(value ?? "")} />
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                <input type="checkbox" checked={thankYouSent} onChange={(event) => setThankYouSent(event.target.checked)} className="size-4 accent-[#0a5c4d]" />
                Thank-you message sent
              </label>
              <div className="md:col-span-2">
                <Field label={`Preparation questions (one per line, ${PREP_QUESTION_MIN} to ${PREP_QUESTION_MAX})`}>
                  <InputArea
                    rows={3}
                    value={questions}
                    onChange={(event) => { setQuestions(event.target.value); setQuestionsTouched(true); }}
                    onBlur={() => setQuestionsTouched(true)}
                    aria-invalid={Boolean(questionsError)}
                    aria-describedby={questionsError ? questionsErrorId : "interview-questions-count"}
                  />
                </Field>
                <p id="interview-questions-count" className="mt-1 text-xs text-gray-500">{parsedQuestions.length} of {PREP_QUESTION_MIN}–{PREP_QUESTION_MAX} questions added</p>
                {questionsError && <p id={questionsErrorId} role="alert" className="mt-1 text-xs font-medium text-red-600">{questionsError}</p>}
              </div>
              <Field label="Key takeaway"><InputArea rows={3} value={keyTakeaway} onChange={(event) => setKeyTakeaway(event.target.value)} /></Field>
              <Field label="Recommended action"><InputArea rows={3} value={recommendedAction} onChange={(event) => setRecommendedAction(event.target.value)} /></Field>
              <div className="md:col-span-2"><Field label="Referral"><Input value={referral} onChange={(event) => setReferral(event.target.value)} /></Field></div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              {onDelete && <button type="button" className="mr-auto h-10 rounded-xl bg-red-50 px-4 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-60" disabled={saving || deleting} onClick={() => setConfirmDeleteOpen(true)}>Delete</button>}
              <button type="button" className="h-10 rounded-xl bg-gray-100 px-4 text-sm font-medium text-gray-700 hover:bg-gray-200" onClick={() => onOpenChange(false)}>Cancel</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a5c4d] px-5 text-sm font-medium text-white hover:bg-[#07473b] disabled:opacity-60" disabled={saving || deleting || !scheduledFor}>{saving ? "Saving..." : interview ? "Save changes" : "Add interview"}</button>
            </div>
          </form>
        </Dialog>
      </DialogRoot>

      <DialogRoot open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <Dialog size="sm" className="max-w-[420px] px-6 py-5">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600"><Alert02Icon size={20} /></div>
            <div><DialogTitle className="text-base font-semibold text-kumo-strong">Delete interview</DialogTitle><DialogDescription className="mt-1 text-xs leading-relaxed text-kumo-subtle">Delete the informational interview with <strong>{interview?.contactName}</strong>? This cannot be undone.</DialogDescription></div>
          </div>
          <div className="mt-6 flex justify-end gap-2.5">
            <button type="button" className="h-9 rounded-xl bg-gray-100 px-3.5 text-xs font-medium text-gray-700" onClick={() => setConfirmDeleteOpen(false)}>Cancel</button>
            <button type="button" className="h-9 rounded-xl bg-red-600 px-4 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60" disabled={deleting} onClick={async () => { if (onDelete) await onDelete(); setConfirmDeleteOpen(false); }}>{deleting ? "Deleting..." : "Delete interview"}</button>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}
