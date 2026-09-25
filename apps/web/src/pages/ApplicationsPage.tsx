import { type FormEvent, useMemo, useState } from "react";
import { Search01Icon } from "hugeicons-react";
import { pipelineStatuses } from "../status";
import { ApplicationCard } from "../components/Cards";
import {
  Button,
  DatePickerField,
  Field,
  Input,
  InputArea,
  Label,
  Loader,
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
  const { data: applications = [], isLoading: loading, error: queryError } = useApplicationsQuery();
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const createApplication = useCreateApplicationMutation();
  const updateApplication = useUpdateApplicationMutation();
  const deleteApplication = useDeleteApplicationMutation();

  const error = queryError ? "Unable to load applications. Ensure the API server is running." : "";

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
      <header className="topbar">
        <div>
          <span className="eyebrow">Pipeline management</span>
          <h1>Job applications</h1>
        </div>
        <Button
          variant="primary"
          className="topbar-add-btn"
          onClick={openCreate}
        >
          Add application
        </Button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <ApplicationEditor
        key={editorKey}
        application={editor?.mode === "edit" ? editor.application : undefined}
        open={editor !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditor(null);
        }}
        saving={createApplication.isPending || updateApplication.isPending}
        deleting={deleteApplication.isPending}
        error={
          (createApplication.error instanceof Error && createApplication.error.message) ||
          (updateApplication.error instanceof Error && updateApplication.error.message) ||
          (deleteApplication.error instanceof Error && deleteApplication.error.message) ||
          ""
        }
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
                if (!window.confirm(`Delete the ${editor.application.position} application?`)) {
                  return;
                }
                await deleteApplication.mutateAsync(editor.application.id);
                setEditor(null);
              }
            : undefined
        }
      />

      <section className="panel">
        <div className="panel-heading applications-toolbar">
          <div className="filter-select-wrapper">
            <Select
              aria-label="Filter applications by status"
              value={selectedStatus}
              onValueChange={(val) => val && setSelectedStatus(val as string)}
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

          <label className="search-field applications-search">
            <span className="sr-only">Search applications</span>
            <Search01Icon size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search applications"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader size={24} aria-label="Loading applications" />
            <span className="text-xs text-[#6b7280]">Loading applications</span>
          </div>
        ) : (
          <div className="pipeline">
            {(selectedStatus === "All" ? pipelineStatuses : [selectedStatus]).map((status) => {
              const statusApps = filteredApplications.filter((app) => app.status === status);
              return (
                <div className="pipeline-column" key={status}>
                  <div className="column-heading">
                    <span className={"status-dot " + status.toLowerCase()} />
                    <h3>{status}</h3>
                    <span>{statusApps.length}</span>
                  </div>
                  {statusApps.length ? (
                    statusApps.map((application) => (
                      <ApplicationCard
                        application={application}
                        key={application.id}
                        onOpen={() => openEdit(application)}
                      />
                    ))
                  ) : (
                    <p className="empty-state" style={{ padding: "16px 4px", fontSize: "12px" }}>
                      No applications
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function ApplicationEditor({
  application,
  saving,
  deleting,
  error,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  application?: JobApplication;
  saving: boolean;
  deleting: boolean;
  error: string;
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
  const [submissionError, setSubmissionError] = useState("");
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
    setSubmissionError("");

    try {
      await onSave({
        company: company.trim(),
        position: position.trim(),
        location: location.trim() || null,
        status,
        deadline: deadline || null,
        employerId: employerId && employerId !== "none" ? Number(employerId) : null,
        contactId: contactId && contactId !== "none" ? Number(contactId) : null,
        notes: notes.trim() || null,
      });
    } catch (caught) {
      setSubmissionError(caught instanceof Error ? caught.message : "Unable to save application");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSubmissionError("");
    try {
      await onDelete();
    } catch (caught) {
      setSubmissionError(caught instanceof Error ? caught.message : "Unable to delete application");
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl" className="p-6">
        <div className="editor-dialog-body">
          <DialogTitle>{application ? "Edit application" : "Add application"}</DialogTitle>
          <DialogDescription>
            {application
              ? "Update the details for this job application."
              : "Record a new opportunity in your pipeline."}
          </DialogDescription>

          {(submissionError || error) && (
            <div className="error-banner mt-4" role="alert">{submissionError || error}</div>
          )}

          <form className="mt-4" onSubmit={handleSubmit}>
            <div className="editor-form-grid">
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
            <div>
              <Label className="block mb-1.5">Status</Label>
              <Select
                aria-label="Status"
                className="w-full"
                value={status}
                onValueChange={(value) => setStatus(value as ApplicationStatus)}
                items={Object.fromEntries(pipelineStatuses.map((s) => [s, s]))}
              />
            </div>
            <DatePickerField
              label="Deadline"
              value={deadline || null}
              onValueChange={(value) => setDeadline(value ?? "")}
            />
            <div>
              <Label className="block mb-1.5">Employer</Label>
              <Select
                aria-label="Employer"
                className="w-full"
                value={employerId}
                onValueChange={setEmployerId}
                options={employerOptions}
              />
            </div>
            <div>
              <Label className="block mb-1.5">Contact</Label>
              <Select
                aria-label="Contact"
                className="w-full"
                value={contactId}
                onValueChange={setContactId}
                options={contactOptions}
              />
            </div>
            <div className="editor-span-2">
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

          <div className="editor-footer flex flex-wrap items-center justify-end gap-2">
            {onDelete && (
              <button
                type="button"
                className="danger-button mr-auto"
                disabled={saving || deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button type="button" className="secondary-button" onClick={() => onOpenChange(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving || deleting}>
              {saving ? "Saving..." : application ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
        </div>
      </Dialog>
    </DialogRoot>
  );
}