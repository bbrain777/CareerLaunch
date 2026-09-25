import { type FormEvent, useMemo, useState } from "react";
import { Search01Icon } from "hugeicons-react";
import {
  Button,
  Field,
  Input,
  InputArea,
  Loader,
  Dialog,
  DialogRoot,
  DialogTitle,
  DialogDescription,
} from "../components/ui";
import {
  useContactsQuery,
  useCreateEmployerMutation,
  useDeleteEmployerMutation,
  useEmployersQuery,
  useUpdateEmployerMutation,
} from "../hooks/queries";
import type { Employer, EmployerInput } from "../types";

type EditorState = { mode: "create" } | { mode: "edit"; employer: Employer };

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function EmployersPage() {
  const { data: employers = [], isLoading: loading, error: queryError } = useEmployersQuery();
  const { data: contacts = [] } = useContactsQuery();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const createEmployer = useCreateEmployerMutation();
  const updateEmployer = useUpdateEmployerMutation();
  const deleteEmployer = useDeleteEmployerMutation();

  const error = queryError ? "Unable to load employers. Ensure the API server is running." : "";

  const openCreate = () => {
    setEditor({ mode: "create" });
    setEditorKey((key) => key + 1);
  };

  const openEdit = (employer: Employer) => {
    setEditor({ mode: "edit", employer });
    setEditorKey((key) => key + 1);
  };

  const filteredEmployers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return employers;

    return employers.filter((employer) =>
      [employer.name, employer.industry, employer.location, employer.website]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [employers, query]);

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Company research</span>
          <h1>Employers</h1>
        </div>
        <Button
          variant="primary"
          className="topbar-add-btn"
          onClick={openCreate}
        >
          Add employer
        </Button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <EmployerEditor
        key={editorKey}
        employer={editor?.mode === "edit" ? editor.employer : undefined}
        open={editor !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditor(null);
        }}
        saving={createEmployer.isPending || updateEmployer.isPending}
        deleting={deleteEmployer.isPending}
        error={
          (createEmployer.error instanceof Error && createEmployer.error.message) ||
          (updateEmployer.error instanceof Error && updateEmployer.error.message) ||
          (deleteEmployer.error instanceof Error && deleteEmployer.error.message) ||
          ""
        }
        onSave={async (input) => {
          if (editor?.mode === "edit") {
            await updateEmployer.mutateAsync({
              id: editor.employer.id,
              changes: input,
            });
          } else {
            await createEmployer.mutateAsync(input);
          }
          setEditor(null);
        }}
        onDelete={
          editor?.mode === "edit"
            ? async () => {
                if (!window.confirm(`Delete ${editor.employer.name}?`)) {
                  return;
                }
                await deleteEmployer.mutateAsync(editor.employer.id);
                setEditor(null);
              }
            : undefined
        }
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">All companies</span>
            <h2>Organizations you are tracking</h2>
          </div>
          <label className="search-field">
            <span className="sr-only">Search employers</span>
            <Search01Icon size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employers"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader size={24} aria-label="Loading employers" />
            <span className="text-xs text-[#6b7280]">Loading employers</span>
          </div>
        ) : (
          <div className="interview-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {filteredEmployers.length ? (
              filteredEmployers.map((employer) => (
                <article className="interview-card" key={employer.id}>
                  <div className="interview-card-heading">
                    <div>
                      <span className="status-label">{employer.industry || "Employer"}</span>
                      <h3>{employer.name}</h3>
                      <p>{employer.location || "Location not specified"}</p>
                    </div>
                  </div>
                  <div className="interview-details">
                    <div>
                      <strong>Industry</strong>
                      <span>{employer.industry || "Not provided"}</span>
                    </div>
                    <div>
                      <strong>Website</strong>
                      <span>{employer.website || "Not provided"}</span>
                    </div>
                    <div>
                      <strong>Contacts</strong>
                      <span>
                        {contacts.filter((contact) => contact.employerId === employer.id).length}
                      </span>
                    </div>
                  </div>
                  {employer.notes && (
                    <p className="interview-takeaway">
                      <strong>Notes:</strong> {employer.notes}
                    </p>
                  )}
                  <div className="card-footer">
                    <span>
                      {employer.createdAt
                        ? `Added ${shortDate.format(new Date(employer.createdAt))}`
                        : "Saved employer"}
                    </span>
                    <button
                      type="button"
                      className="card-action"
                      aria-label={`Open ${employer.name}`}
                      onClick={() => openEdit(employer)}
                    >
                      Open
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">No employers match your search.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function EmployerEditor({
  employer,
  saving,
  deleting,
  error,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  employer?: Employer;
  saving: boolean;
  deleting: boolean;
  error: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: EmployerInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState(employer?.name ?? "");
  const [industry, setIndustry] = useState(employer?.industry ?? "");
  const [location, setLocation] = useState(employer?.location ?? "");
  const [website, setWebsite] = useState(employer?.website ?? "");
  const [notes, setNotes] = useState(employer?.notes ?? "");
  const [submissionError, setSubmissionError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError("");

    try {
      await onSave({
        name: name.trim(),
        industry: industry.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (caught) {
      setSubmissionError(caught instanceof Error ? caught.message : "Unable to save employer");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSubmissionError("");
    try {
      await onDelete();
    } catch (caught) {
      setSubmissionError(caught instanceof Error ? caught.message : "Unable to delete employer");
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl" className="p-6">
        <div className="editor-dialog-body">
          <DialogTitle>{employer ? "Edit employer" : "Add employer"}</DialogTitle>
          <DialogDescription>
            {employer
              ? "Update the details for this company."
              : "Add a company to your research."}
          </DialogDescription>

          {(submissionError || error) && (
            <div className="error-banner mt-4" role="alert">{submissionError || error}</div>
          )}

          <form className="mt-4" onSubmit={handleSubmit}>
            <div className="editor-form-grid">
            <Field label="Name" required>
              <Input
                id="employer-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </Field>
            <Field label="Industry">
              <Input
                id="employer-industry"
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
              />
            </Field>
            <Field label="Location">
              <Input
                id="employer-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </Field>
            <Field label="Website">
              <Input
                id="employer-website"
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://example.com"
              />
            </Field>
            <div className="editor-span-2">
              <Field label="Notes">
                <InputArea
                  id="employer-notes"
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
              {saving ? "Saving..." : employer ? "Save changes" : "Add employer"}
            </button>
          </div>
        </form>
        </div>
      </Dialog>
    </DialogRoot>
  );
}