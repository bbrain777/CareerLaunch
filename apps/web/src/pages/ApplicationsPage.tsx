import { type FormEvent, useMemo, useState } from "react";
import { Search01Icon } from "hugeicons-react";
import { pipelineStatuses } from "../status";
import { ApplicationCard } from "../components/Cards";
import { Button, Select, Loader } from "../components/ui";
import {
  useApplicationsQuery,
  useCreateApplicationMutation,
  useDeleteApplicationMutation,
  useUpdateApplicationMutation,
} from "../hooks/queries";
import type { ApplicationInput, ApplicationStatus, JobApplication } from "../types";

type EditorState = { mode: "create" } | { mode: "edit"; application: JobApplication };

export function ApplicationsPage() {
  const { data: applications = [], isLoading: loading, error: queryError } = useApplicationsQuery();
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const createApplication = useCreateApplicationMutation();
  const updateApplication = useUpdateApplicationMutation();
  const deleteApplication = useDeleteApplicationMutation();

  const error = queryError ? "Unable to load applications. Ensure the API server is running." : "";

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
          onClick={() => setEditor({ mode: "create" })}
        >
          Add application
        </Button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {editor && (
        <ApplicationEditor
          key={editor.mode === "edit" ? editor.application.id : "new"}
          application={editor.mode === "edit" ? editor.application : undefined}
          saving={createApplication.isPending || updateApplication.isPending}
          deleting={deleteApplication.isPending}
          error={
            (createApplication.error instanceof Error && createApplication.error.message) ||
            (updateApplication.error instanceof Error && updateApplication.error.message) ||
            (deleteApplication.error instanceof Error && deleteApplication.error.message) ||
            ""
          }
          onCancel={() => setEditor(null)}
          onSave={async (input) => {
            if (editor.mode === "edit") {
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
            editor.mode === "edit"
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
      )}

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
                        onOpen={() => setEditor({ mode: "edit", application })}
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
  onSave,
  onDelete,
  onCancel,
}: {
  application?: JobApplication;
  saving: boolean;
  deleting: boolean;
  error: string;
  onSave: (input: ApplicationInput) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCancel: () => void;
}) {
  const [company, setCompany] = useState(application?.company ?? "");
  const [position, setPosition] = useState(application?.position ?? "");
  const [location, setLocation] = useState(application?.location ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(application?.status ?? "Saved");
  const [deadline, setDeadline] = useState(application?.deadline ?? "");
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [submissionError, setSubmissionError] = useState("");

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
    <div className="application-editor-backdrop">
      <section
        className="application-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-editor-title"
      >
        <div className="application-editor-heading">
          <div>
            <span className="eyebrow">Application pipeline</span>
            <h2 id="application-editor-title">
              {application ? "Edit application" : "Add application"}
            </h2>
          </div>
          <button type="button" className="text-button" onClick={onCancel}>Close</button>
        </div>

        {(submissionError || error) && (
          <div className="error-banner" role="alert">{submissionError || error}</div>
        )}

        <form className="application-form" onSubmit={handleSubmit}>
          <label>
            <span>Company</span>
            <input value={company} onChange={(event) => setCompany(event.target.value)} required />
          </label>
          <label>
            <span>Position</span>
            <input value={position} onChange={(event) => setPosition(event.target.value)} required />
          </label>
          <label>
            <span>Location</span>
            <input value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <label>
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
            >
              {pipelineStatuses.map((pipelineStatus) => (
                <option key={pipelineStatus} value={pipelineStatus}>{pipelineStatus}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Deadline</span>
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
            />
          </label>
          <label className="application-form-notes">
            <span>Notes</span>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <div className="application-form-actions">
            {onDelete && (
              <button
                type="button"
                className="danger-button"
                disabled={saving || deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button type="button" className="secondary-button" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving || deleting}>
              {saving ? "Saving..." : application ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
