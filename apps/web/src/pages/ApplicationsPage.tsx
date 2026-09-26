import { type FormEvent, useMemo, useState } from "react";
import { Alert02Icon, Search01Icon } from "hugeicons-react";
import { pipelineStatuses } from "../status";
import { ApplicationCard } from "../components/Cards";
import {
  Button,
  DatePickerField,
  Field,
  Input,
  InputArea,
  Select,
  Dialog,
  DialogRoot,
  DialogTitle,
  DialogDescription,
} from "../components/ui";
import {
  useApplicationsQuery,
  useContactsQuery,
  useCreateApplicationMutation,
  useDeleteApplicationMutation,
  useEmployersQuery,
  useUpdateApplicationMutation,
} from "../hooks/queries";
import type { ApplicationInput, ApplicationStatus, JobApplication } from "../types";

type EditorState = { mode: "create" } | { mode: "edit"; application: JobApplication };

export function ApplicationsPage() {
  const { data: applications = [], isLoading: loading } = useApplicationsQuery();
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const createApplication = useCreateApplicationMutation();
  const updateApplication = useUpdateApplicationMutation();
  const deleteApplication = useDeleteApplicationMutation();

  const openCreate = () => {
    setEditor({ mode: "create" });
    setEditorKey((key) => key + 1);
  };

  const openEdit = (application: JobApplication) => {
    setEditor({ mode: "edit", application });
    setEditorKey((key) => key + 1);
  };

  const filteredApplications = useMemo(() => {
    let result = applications;

    if (selectedStatus !== "All") {
      result = result.filter((app) => app.status === selectedStatus);
    }

    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((app) =>
        [app.company, app.position, app.location, app.status]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    return result;
  }, [applications, query, selectedStatus]);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">Pipeline management</span>
          <h1 className="truncate">Job applications</h1>
        </div>
        <Button
          variant="primary"
          className="!rounded-[14px] !h-8.5 !px-3 sm:!px-3.5 !text-[13px] !font-medium shrink-0"
          onClick={openCreate}
        >
          Add application
        </Button>
      </header>

      <ApplicationEditor
        key={editorKey}
        application={editor?.mode === "edit" ? editor.application : undefined}
        open={editor !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditor(null);
        }}
        saving={createApplication.isPending || updateApplication.isPending}
        deleting={deleteApplication.isPending}
        onSave={async (input) => {
          if (editor?.mode === "edit") {
            await updateApplication.mutateAsync({
              id: editor.application.id,
              changes: input,
            });
          } else {
            await createApplication.mutateAsync(input);
          }
          setEditor(null);
        }}
        onDelete={
          editor?.mode === "edit"
            ? async () => {
                await deleteApplication.mutateAsync(editor.application.id);
                setEditor(null);
              }
            : undefined
        }
      />

      <section className="rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0">
        <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-[220px] sm:flex-none">
            <Select
              aria-label="Filter applications by status"
              value={selectedStatus}
              onValueChange={(val) => val && setSelectedStatus(val)}
              className="w-full"
              items={{
                All: `All applications (${applications.length})`,
                ...Object.fromEntries(
                  pipelineStatuses.map((status) => [
                    status,
                    `${status} (${applications.filter((a) => a.status === status).length})`
                  ])
                )
              }}
            />
          </div>

          <label className="flex w-full items-center gap-2 rounded-xl bg-gray-100/80 border border-gray-200/60 px-3.5 py-2 sm:w-[280px] md:w-[320px] text-gray-400 focus-within:border-[#0a5c4d] focus-within:ring-2 focus-within:ring-[#0a5c4d]/20 transition-all">
            <span className="sr-only">Search applications</span>
            <Search01Icon size={16} className="shrink-0 text-gray-500" />
            <input
              type="text"
              className="bg-transparent border-0 outline-none ring-0 shadow-none p-0 text-sm w-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-0"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applications"
            />
          </label>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="page-loader" aria-hidden="true" />
            <span>Loading applications</span>
          </div>
        ) : selectedStatus === "All" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start snap-x scroll-smooth">
            {pipelineStatuses.map((status) => {
              const statusApps = filteredApplications.filter((app) => app.status === status);
              return (
                <div
                  className="w-[280px] min-w-[280px] shrink-0 snap-start rounded-2xl bg-gray-50/70 border border-gray-200/60 p-3.5 flex flex-col gap-3"
                  key={status}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200/40">
                    <span className={`size-2 rounded-full ${statusDotClass(status)}`} />
                    <h3 className="text-sm font-semibold text-gray-900">{status}</h3>
                    <span className="ml-auto text-xs font-semibold text-gray-500 bg-white border border-gray-200/80 px-2 py-0.5 rounded-full">
                      {statusApps.length}
                    </span>
                  </div>
                  {statusApps.length ? (
                    <div className="flex flex-col gap-2.5">
                      {statusApps.map((application) => (
                        <ApplicationCard
                          application={application}
                          key={application.id}
                          onOpen={() => openEdit(application)}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="px-2 py-6 text-center text-xs text-gray-400 font-medium">
                      No applications
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            {filteredApplications.length ? (
              filteredApplications.map((application) => (
                <ApplicationCard
                  application={application}
                  key={application.id}
                  onOpen={() => openEdit(application)}
                />
              ))
            ) : (
              <p className="col-span-full px-2 py-12 text-center text-sm text-gray-500">
                No applications found in {selectedStatus}.
              </p>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function statusDotClass(status: ApplicationStatus): string {
  switch (status) {
    case "Saved": return "bg-gray-400";
    case "Preparing": return "bg-amber-600";
    case "Applied": return "bg-blue-600";
    case "Interview": return "bg-violet-600";
    case "Offer": return "bg-emerald-600";
    case "Closed": return "bg-gray-600";
    default: return "bg-gray-400";
  }
}

function ApplicationEditor({
  application,
  saving,
  deleting,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  application?: JobApplication;
  saving: boolean;
  deleting: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: ApplicationInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [company, setCompany] = useState(application?.company ?? "");
  const [position, setPosition] = useState(application?.position ?? "");
  const [location, setLocation] = useState(application?.location ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? "Saved");
  const [deadline, setDeadline] = useState(application?.deadline ?? "");
  const [employerId, setEmployerId] = useState(
    application?.employerId ? String(application.employerId) : "none"
  );
  const [contactId, setContactId] = useState(
    application?.contactId ? String(application.contactId) : "none"
  );
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { data: employers = [] } = useEmployersQuery();
  const { data: contacts = [] } = useContactsQuery();

  const employerOptions = [
    { value: "none", label: "No employer" },
    ...employers.map((employer) => ({ value: String(employer.id), label: employer.name })),
  ];

  const contactOptions = [
    { value: "none", label: "No contact" },
    ...contacts.map((contact) => ({
      value: String(contact.id),
      label: [contact.firstName, contact.lastName].filter(Boolean).join(" "),
    })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onSave({
        company: company.trim(),
        position: position.trim(),
        location: location.trim() || null,
        status,
        deadline: deadline || null,
        employerId: employerId !== "none" ? Number(employerId) : null,
        contactId: contactId !== "none" ? Number(contactId) : null,
        notes: notes.trim() || null,
      });
    } catch {
      return;
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    try {
      await onDelete();
    } catch {
      return;
    }
  }

  return (
    <>
      <DialogRoot open={open} onOpenChange={onOpenChange}>
        <Dialog size="xl" className="px-6 py-5">
        <div className="flex flex-col gap-1">
          <DialogTitle className="text-lg font-semibold text-kumo-strong">
            {application ? "Edit application" : "Add application"}
          </DialogTitle>
          <DialogDescription className="text-xs text-kumo-subtle mt-0.5">
            {application
              ? "Update the details for this job application."
              : "Record a new opportunity in your pipeline."}
          </DialogDescription>

          <form className="mt-4" onSubmit={handleSubmit}>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company" required>
              <Input
                id="application-company"
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                required
              />
            </Field>
            <Field label="Position" required>
              <Input
                id="application-position"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                required
              />
            </Field>
            <Field label="Location">
              <Input
                id="application-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </Field>
            <Select
              label="Status"
              className="w-full"
              value={status}
              onValueChange={(value) => value && setStatus(value as ApplicationStatus)}
              items={Object.fromEntries(pipelineStatuses.map((s) => [s, s]))}
            />
            <DatePickerField
              label="Deadline"
              value={deadline || null}
              onValueChange={(value) => setDeadline(value ?? "")}
            />
            <Select
              label="Employer"
              className="w-full"
              value={employerId}
              onValueChange={(value) => value && setEmployerId(value)}
              items={employerOptions}
            />
            <Select
              label="Contact"
              className="w-full"
              value={contactId}
              onValueChange={(value) => value && setContactId(value)}
              items={contactOptions}
            />
            <div className="md:col-span-2">
              <Field label="Notes">
                <InputArea
                  id="application-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  autoResize
                  minRows={3}
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {onDelete && (
              <button
                type="button"
                className="mr-auto h-10 px-4 rounded-xl text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving || deleting}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                {deleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 rounded-full border-2 border-red-600/30 border-t-red-600 animate-spin" aria-hidden="true" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            )}
            <button
              type="button"
              className="h-10 px-4 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] px-5 text-sm font-medium text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving || deleting}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  Saving...
                </span>
              ) : (
                application ? "Save changes" : "Add application"
              )}
            </button>
          </div>
        </form>
        </div>
      </Dialog>
    </DialogRoot>

    <DialogRoot open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
      <Dialog size="sm" className="px-6 py-5 max-w-[420px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Alert02Icon size={20} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <DialogTitle className="text-base font-semibold text-kumo-strong">
                Delete application
              </DialogTitle>
              <DialogDescription className="text-xs text-kumo-subtle leading-relaxed">
                Are you sure you want to delete the application for{" "}
                <strong className="font-semibold text-gray-900">
                  {application?.position || "this position"}
                </strong>{" "}
                at{" "}
                <strong className="font-semibold text-gray-900">
                  {application?.company || "this company"}
                </strong>
                ? This action cannot be undone.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              className="h-9 px-3.5 rounded-xl text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer disabled:opacity-60"
              disabled={deleting}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] px-4 text-xs font-medium text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
              disabled={deleting}
              onClick={async () => {
                await handleDelete();
                setConfirmDeleteOpen(false);
              }}
            >
              {deleting ? (
                <>
                  <span
                    className="size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"
                    aria-hidden="true"
                  />
                  <span>Deleting...</span>
                </>
              ) : (
                "Delete application"
              )}
            </button>
          </div>
        </div>
      </Dialog>
    </DialogRoot>
    </>
  );
}