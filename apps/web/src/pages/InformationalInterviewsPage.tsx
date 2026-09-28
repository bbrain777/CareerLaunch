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

type EditorState = { mode: "create" } | { mode: "edit"; interview: InformationalInterview };

const statusOptions = {
  Preparing: "Preparing",
  Scheduled: "Scheduled",
  Completed: "Completed",
};

export function InformationalInterviewsPage() {
  const { data: interviews = [], isLoading: loading } = useInterviewsQuery();
  const { data: contacts = [] } = useContactsQuery();
  const { data: employers = [] } = useEmployersQuery();
  const createInterview = useCreateInterviewMutation();
  const updateInterview = useUpdateInterviewMutation();
  const deleteInterview = useDeleteInterviewMutation();
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);

  const companies = useMemo(() => {
    const set = new Set<string>();
    interviews.forEach((interview) => {
      if (interview.company) set.add(interview.company);
    });
    return Array.from(set).sort();
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    let result = interviews;
    if (companyFilter !== "All") result = result.filter((interview) => interview.company === companyFilter);
    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((interview) =>
        [interview.contactName, interview.company, interview.role, interview.status,
          interview.keyTakeaway, interview.scheduledFor]
          .filter(Boolean).join(" ").toLowerCase().includes(search)
      );
    }
    return result;
  }, [interviews, query, companyFilter]);

  function openCreate() {
    setEditor({ mode: "create" });
    setEditorKey((key) => key + 1);
  }

  function openEdit(interview: InformationalInterview) {
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

      <section className="min-w-0 rounded-2xl bg-white p-4 sm:p-6">
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

        {loading ? (
          <div className="page-loading"><span className="page-loader" aria-hidden="true" /><span>Loading interviews</span></div>
        ) : filteredInterviews.length ? (
          <div className="w-full overflow-x-auto pb-2">
            <Table className="min-w-[760px]">
              <Table.Header><Table.Row>
                <Table.Head className="min-w-[130px]">Contact</Table.Head>
                <Table.Head className="min-w-[150px]">Company / role</Table.Head>
                <Table.Head className="min-w-[120px]">Date</Table.Head>
                <Table.Head className="min-w-[100px]">Status</Table.Head>
                <Table.Head className="min-w-[160px]">Next action</Table.Head>
                <Table.Head className="min-w-[80px] text-right">Actions</Table.Head>
              </Table.Row></Table.Header>
              <Table.Body>
                {filteredInterviews.map((interview) => (
                  <Table.Row key={interview.id}>
                    <Table.Cell className="font-medium text-gray-900">{interview.contactName}</Table.Cell>
                    <Table.Cell>{interview.role} {interview.company ? `at ${interview.company}` : ""}</Table.Cell>
                    <Table.Cell>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(interview.scheduledFor))}</Table.Cell>
                    <Table.Cell>{interview.status}</Table.Cell>
                    <Table.Cell className="max-w-xs truncate">{interview.recommendedAction || interview.keyTakeaway || "—"}</Table.Cell>
                    <Table.Cell className="text-right">
                      <button type="button" className="rounded-[6px] border-0 bg-[#e6f6f2] px-2.5 py-1 text-[14px] font-medium text-[#0a5c4d] hover:bg-[#cceee5]" aria-label={`Edit interview with ${interview.contactName}`} onClick={() => openEdit(interview)}>Edit</button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-gray-500">No informational interviews match your search.</p>
        )}
      </section>
    </>
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
    try {
      await onSave({
        contactName: contactName.trim(), role: role.trim(), company: company.trim() || null,
        scheduledFor, status,
        preparationQuestions: questions.split("\n").map((question) => question.trim()).filter(Boolean),
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
        <Dialog size="xl" className="px-6 py-5">
          <DialogTitle className="text-lg font-semibold text-kumo-strong">{interview ? "Edit informational interview" : "Add informational interview"}</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-kumo-subtle">Plan the conversation, capture outcomes, and schedule the next follow-up.</DialogDescription>
          <form className="mt-4" onSubmit={handleSubmit}>
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
              <div className="md:col-span-2"><Field label="Preparation questions (one per line)"><InputArea rows={3} value={questions} onChange={(event) => setQuestions(event.target.value)} /></Field></div>
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
