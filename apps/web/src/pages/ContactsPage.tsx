import { type FormEvent, useMemo, useState } from "react";
import { Alert02Icon, Search01Icon } from "hugeicons-react";
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
  Table,
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
  const { data: contacts = [], isLoading: loading } = useContactsQuery();
  const { data: employers = [] } = useEmployersQuery();
  const [query, setQuery] = useState("");
  const [employerFilter, setEmployerFilter] = useState("All");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const createContact = useCreateContactMutation();
  const updateContact = useUpdateContactMutation();
  const deleteContact = useDeleteContactMutation();

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

  const employerFilterOptions = useMemo(() => {
    const counts = new Map<number, number>();
    contacts.forEach((c) => {
      if (c.employerId) {
        counts.set(c.employerId, (counts.get(c.employerId) ?? 0) + 1);
      }
    });
    return Object.fromEntries(
      employers.map((e) => [String(e.id), `${e.name} (${counts.get(e.id) ?? 0})`])
    );
  }, [employers, contacts]);

  const filteredContacts = useMemo(() => {
    let result = contacts;
    if (employerFilter !== "All") {
      result = result.filter((c) => String(c.employerId) === employerFilter);
    }
    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((contact) =>
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
    }
    return result;
  }, [contacts, employerById, query, employerFilter]);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">Networking</span>
          <h1 className="truncate">Contacts</h1>
        </div>
        <Button
          variant="primary"
          className="!rounded-[14px] !h-8.5 !px-3 sm:!px-3.5 !text-[13px] !font-medium shrink-0"
          onClick={openCreate}
        >
          Add contact
        </Button>
      </header>

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
                await deleteContact.mutateAsync(editor.contact.id);
                setEditor(null);
              }
            : undefined
        }
      />

      <section className="rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0">
        <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-[220px] sm:flex-none">
            <Select
              aria-label="Filter contacts by company"
              value={employerFilter}
              onValueChange={(val) => val && setEmployerFilter(val)}
              className="w-full"
              items={{
                All: `All companies (${contacts.length})`,
                ...employerFilterOptions
              }}
            />
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl bg-gray-100/80 border border-gray-200/60 px-3.5 py-2 sm:w-[280px] md:w-[320px] text-gray-400 focus-within:border-[#0a5c4d] focus-within:ring-2 focus-within:ring-[#0a5c4d]/20 transition-all">
            <span className="sr-only">Search contacts</span>
            <Search01Icon size={16} className="shrink-0 text-gray-500" />
            <input
              type="text"
              className="bg-transparent border-0 outline-none ring-0 shadow-none p-0 text-sm w-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-0"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search contacts"
            />
          </label>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="page-loader" aria-hidden="true" />
            <span>Loading contacts</span>
          </div>
        ) : filteredContacts.length ? (
          <div className="w-full overflow-x-auto pb-2">
            <Table className="min-w-[720px]">
              <Table.Header>
                <Table.Row>
                  <Table.Head className="min-w-[130px]">Name</Table.Head>
                  <Table.Head className="min-w-[120px]">Role</Table.Head>
                  <Table.Head className="min-w-[120px]">Company</Table.Head>
                  <Table.Head className="min-w-[150px]">Email</Table.Head>
                  <Table.Head className="min-w-[110px]">Phone</Table.Head>
                  <Table.Head className="min-w-[110px]">Last contacted</Table.Head>
                  <Table.Head className="min-w-[80px] text-right">Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredContacts.map((contact) => {
                  const employer = employerById.get(contact.employerId ?? -1);
                  return (
                    <Table.Row key={contact.id}>
                      <Table.Cell className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName ?? ""}
                      </Table.Cell>
                      <Table.Cell>{contact.jobTitle || "—"}</Table.Cell>
                      <Table.Cell>{employer?.name || "—"}</Table.Cell>
                      <Table.Cell>
                        {contact.email ? (
                          <a href={`mailto:${contact.email}`} className="text-[#0a5c4d] hover:underline">
                            {contact.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </Table.Cell>
                      <Table.Cell>{contact.phone || "—"}</Table.Cell>
                      <Table.Cell>
                        {contact.lastContacted
                          ? shortDate.format(new Date(contact.lastContacted))
                          : "Never"}
                      </Table.Cell>
                      <Table.Cell className="text-right">
                        <button
                          type="button"
                          className="rounded-[6px] border-0 bg-[#e6f6f2] px-2.5 py-1 text-[14px] font-medium text-[#0a5c4d] hover:bg-[#cceee5]"
                          aria-label={`Edit ${contact.firstName}`}
                          onClick={() => openEdit(contact)}
                        >
                          Edit
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-gray-500">No contacts match your search.</p>
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
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  contact?: Contact;
  employers: Employer[];
  saving: boolean;
  deleting: boolean;
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const employerOptions = useMemo(
    () => ({
      none: "No employer",
      ...Object.fromEntries(
        employers.map((employer) => [String(employer.id), employer.name])
      ),
    }),
    [employers]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        jobTitle: jobTitle.trim() || null,
        employerId: employerId !== "none" ? Number(employerId) : null,
        lastContacted: lastContacted || null,
        nextFollowUp: nextFollowUp || null,
        notes: notes.trim() || null,
      });
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
            {contact ? "Edit contact" : "Add contact"}
          </DialogTitle>
          <DialogDescription className="text-xs text-kumo-subtle mt-0.5">
            {contact
              ? "Keep contact information, interaction dates, and notes up to date."
              : "Record details for recruiters, referrers, and peers in your network."}
          </DialogDescription>

          <form className="mt-4" onSubmit={handleSubmit}>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <Field label="Email">
              <Input
                id="contact-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                id="contact-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </Field>
            <Field label="Role / Title">
              <Input
                id="contact-role"
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
              />
            </Field>
            <Select
              label="Employer"
              className="w-full"
              value={employerId}
              onValueChange={(value) => value && setEmployerId(value)}
              items={employerOptions}
            />
            <DatePickerField
              label="Last contacted"
              value={lastContacted || null}
              onValueChange={(value) => setLastContacted(value ?? "")}
            />
            <DatePickerField
              label="Next follow-up"
              value={nextFollowUp || null}
              onValueChange={(value) => setNextFollowUp(value ?? "")}
            />
            <div className="md:col-span-2">
              <Field label="Notes">
                <InputArea
                  id="contact-notes"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
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
                  contact ? "Save changes" : "Add contact"
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
                  Delete contact
                </DialogTitle>
                <DialogDescription className="text-xs text-kumo-subtle leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="font-semibold text-gray-900">
                    {[contact?.firstName, contact?.lastName].filter(Boolean).join(" ") || "this contact"}
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
                  if (onDelete) await onDelete();
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
                  "Delete contact"
                )}
              </button>
            </div>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}