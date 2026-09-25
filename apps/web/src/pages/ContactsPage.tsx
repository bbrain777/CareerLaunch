import { type FormEvent, useMemo, useState } from "react";
import { Search01Icon } from "hugeicons-react";
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
  useContactsQuery,
  useCreateContactMutation,
  useDeleteContactMutation,
  useEmployersQuery,
  useUpdateContactMutation,
} from "../hooks/queries";
import type { Contact, ContactInput, Employer } from "../types";

type EditorState = { mode: "create" } | { mode: "edit"; contact: Contact };

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
});

export function ContactsPage() {
  const { data: contacts = [], isLoading: loading, error: queryError } = useContactsQuery();
  const { data: employers = [] } = useEmployersQuery();
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const createContact = useCreateContactMutation();
  const updateContact = useUpdateContactMutation();
  const deleteContact = useDeleteContactMutation();

  const error = queryError ? "Unable to load contacts. Ensure the API server is running." : "";

  const openCreate = () => {
    setEditor({ mode: "create" });
    setEditorKey((key) => key + 1);
  };

  const openEdit = (contact: Contact) => {
    setEditor({ mode: "edit", contact });
    setEditorKey((key) => key + 1);
  };

  const employerById = useMemo(
    () => new Map(employers.map((employer) => [employer.id, employer])),
    [employers]
  );

  const filteredContacts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return contacts;

    return contacts.filter((contact) =>
      [
        contact.firstName,
        contact.lastName,
        contact.email,
        contact.jobTitle,
        employerById.get(contact.employerId ?? -1)?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [contacts, employerById, query]);

  return (
    <>
      <header className="topbar">
        <div>
          <span className="eyebrow">Networking</span>
          <h1>Contacts</h1>
        </div>
        <Button
          variant="primary"
          className="topbar-add-btn"
          onClick={openCreate}
        >
          Add contact
        </Button>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <ContactEditor
        key={editorKey}
        contact={editor?.mode === "edit" ? editor.contact : undefined}
        employers={employers}
        open={editor !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditor(null);
        }}
        saving={createContact.isPending || updateContact.isPending}
        deleting={deleteContact.isPending}
        error={
          (createContact.error instanceof Error && createContact.error.message) ||
          (updateContact.error instanceof Error && updateContact.error.message) ||
          (deleteContact.error instanceof Error && deleteContact.error.message) ||
          ""
        }
        onSave={async (input) => {
          if (editor?.mode === "edit") {
            await updateContact.mutateAsync({
              id: editor.contact.id,
              changes: input,
            });
          } else {
            await createContact.mutateAsync(input);
          }
          setEditor(null);
        }}
        onDelete={
          editor?.mode === "edit"
            ? async () => {
                if (!window.confirm(`Delete ${editor.contact.firstName}?`)) {
                  return;
                }
                await deleteContact.mutateAsync(editor.contact.id);
                setEditor(null);
              }
            : undefined
        }
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">All people</span>
            <h2>Your professional network</h2>
          </div>
          <label className="search-field">
            <span className="sr-only">Search contacts</span>
            <Search01Icon size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contacts"
            />
          </label>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader size={24} aria-label="Loading contacts" />
            <span className="text-xs text-[#6b7280]">Loading contacts</span>
          </div>
        ) : (
          <div className="interview-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {filteredContacts.length ? (
              filteredContacts.map((contact) => {
                const employer = employerById.get(contact.employerId ?? -1);
                return (
                  <article className="interview-card" key={contact.id}>
                    <div className="interview-card-heading">
                      <div>
                        <span className="status-label">{contact.jobTitle || "Contact"}</span>
                        <h3>
                          {contact.firstName} {contact.lastName ?? ""}
                        </h3>
                        <p>{employer?.name || "No employer"}</p>
                      </div>
                    </div>
                    <div className="interview-details">
                      <div>
                        <strong>Email</strong>
                        <span>{contact.email || "Not provided"}</span>
                      </div>
                      <div>
                        <strong>Phone</strong>
                        <span>{contact.phone || "Not provided"}</span>
                      </div>
                      <div>
                        <strong>Last contacted</strong>
                        <span>
                          {contact.lastContacted
                            ? shortDate.format(new Date(contact.lastContacted))
                            : "Never"}
                        </span>
                      </div>
                      <div>
                        <strong>Next follow-up</strong>
                        <span>
                          {contact.nextFollowUp
                            ? shortDate.format(new Date(contact.nextFollowUp))
                            : "None scheduled"}
                        </span>
                      </div>
                    </div>
                    {contact.notes && (
                      <p className="interview-takeaway">
                        <strong>Notes:</strong> {contact.notes}
                      </p>
                    )}
                    <div className="card-footer">
                      <span>
                        {contact.createdAt
                          ? `Added ${shortDate.format(new Date(contact.createdAt))}`
                          : "Saved contact"}
                      </span>
                      <button
                        type="button"
                        className="card-action"
                        aria-label={`Open ${contact.firstName}`}
                        onClick={() => openEdit(contact)}
                      >
                        Open
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty-state">No contacts match your search.</p>
            )}
          </div>
        )}
      </section>
    </>
  );
}

function ContactEditor({
  contact,
  employers,
  saving,
  deleting,
  error,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  contact?: Contact;
  employers: Employer[];
  saving: boolean;
  deleting: boolean;
  error: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: ContactInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [lastName, setLastName] = useState(contact?.lastName ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [jobTitle, setJobTitle] = useState(contact?.jobTitle ?? "");
  const [employerId, setEmployerId] = useState(
    contact?.employerId ? String(contact.employerId) : "none"
  );
  const [lastContacted, setLastContacted] = useState(contact?.lastContacted ?? "");
  const [nextFollowUp, setNextFollowUp] = useState(contact?.nextFollowUp ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");
  const [submissionError, setSubmissionError] = useState("");

  const employerOptions = [
    { value: "none", label: "No employer" },
    ...employers.map((employer) => ({ value: String(employer.id), label: employer.name })),
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionError("");

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        jobTitle: jobTitle.trim() || null,
        employerId: employerId && employerId !== "none" ? Number(employerId) : null,
        lastContacted: lastContacted || null,
        nextFollowUp: nextFollowUp || null,
        notes: notes.trim() || null,
      });
    } catch (caught) {
      setSubmissionError(caught instanceof Error ? caught.message : "Unable to save contact");
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setSubmissionError("");
    try {
      await onDelete();
    } catch (caught) {
      setSubmissionError(caught instanceof Error ? caught.message : "Unable to delete contact");
    }
  }

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl" className="p-6">
        <div className="editor-dialog-body">
          <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            {contact
              ? "Update the details for this person."
              : "Add someone from your professional network."}
          </DialogDescription>

          {(submissionError || error) && (
            <div className="error-banner mt-4" role="alert">{submissionError || error}</div>
          )}

          <form className="mt-4" onSubmit={handleSubmit}>
            <div className="editor-form-grid">
            <Field label="First name" required>
              <Input
                id="contact-first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </Field>
            <Field label="Last name">
              <Input
                id="contact-last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </Field>
            <Field label="Job title">
              <Input
                id="contact-job-title"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </Field>
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
            <Field label="Email">
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <DatePickerField
              label="Last contacted"
              value={lastContacted || null}
              onValueChange={(value) => setLastContacted(value ?? "")}
            />
            <DatePickerField
              label="Next follow-up"
              value={nextFollowUp || null}
              onValueChange={(value) => setNextFollowUp(value ?? "")}
              fromDate={new Date()}
            />
            <div className="editor-span-2">
              <Field label="Notes">
                <InputArea
                  id="contact-notes"
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
              {saving ? "Saving..." : contact ? "Save changes" : "Add contact"}
            </button>
          </div>
        </form>
        </div>
      </Dialog>
    </DialogRoot>
  );
}