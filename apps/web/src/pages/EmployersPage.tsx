import { type FormEvent, useMemo, useState } from "react";
import { Alert02Icon, Search01Icon } from "hugeicons-react";
import {
  Button,
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
  year: "numeric",
});

export function EmployersPage() {
  const { data: employers = [], isLoading: loading } = useEmployersQuery();
  const { data: contacts = [] } = useContactsQuery();
  const [query, setQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const createEmployer = useCreateEmployerMutation();
  const updateEmployer = useUpdateEmployerMutation();
  const deleteEmployer = useDeleteEmployerMutation();

  const openCreate = () => {
    setEditor({ mode: "create" });
    setEditorKey((key) => key + 1);
  };

  const openEdit = (employer: Employer) => {
    setEditor({ mode: "edit", employer });
    setEditorKey((key) => key + 1);
  };

  const industries = useMemo(() => {
    const set = new Set<string>();
    employers.forEach((e) => {
      if (e.industry) set.add(e.industry);
    });
    return Array.from(set).sort();
  }, [employers]);

  const filteredEmployers = useMemo(() => {
    let result = employers;
    if (industryFilter !== "All") {
      result = result.filter((e) => e.industry === industryFilter);
    }
    const search = query.trim().toLowerCase();
    if (search) {
      result = result.filter((employer) =>
        [employer.name, employer.industry, employer.location, employer.website]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }
    return result;
  }, [employers, query, industryFilter]);

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">Company research</span>
          <h1 className="truncate">Employers</h1>
        </div>
        <Button
          variant="primary"
          className="!rounded-[14px] !h-8.5 !px-3 sm:!px-3.5 !text-[13px] !font-medium shrink-0"
          onClick={openCreate}
        >
          Add employer
        </Button>
      </header>

      <EmployerEditor
        key={editorKey}
        employer={editor?.mode === "edit" ? editor.employer : undefined}
        open={editor !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setEditor(null);
        }}
        saving={createEmployer.isPending || updateEmployer.isPending}
        deleting={deleteEmployer.isPending}
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
                await deleteEmployer.mutateAsync(editor.employer.id);
                setEditor(null);
              }
            : undefined
        }
      />

      <section className="rounded-2xl bg-white p-4 sm:p-6 border-0 ring-0 min-w-0">
        <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:w-[220px] sm:flex-none">
            <Select
              aria-label="Filter employers by industry"
              value={industryFilter}
              onValueChange={(val) => val && setIndustryFilter(val)}
              className="w-full"
              items={{
                All: `All industries (${employers.length})`,
                ...Object.fromEntries(
                  industries.map((ind) => [
                    ind,
                    `${ind} (${employers.filter((e) => e.industry === ind).length})`
                  ])
                )
              }}
            />
          </div>
          <label className="flex w-full items-center gap-2 rounded-xl bg-gray-100/80 border border-gray-200/60 px-3.5 py-2 sm:w-[280px] md:w-[320px] text-gray-400 focus-within:border-[#0a5c4d] focus-within:ring-2 focus-within:ring-[#0a5c4d]/20 transition-all">
            <span className="sr-only">Search employers</span>
            <Search01Icon size={16} className="shrink-0 text-gray-500" />
            <input
              type="text"
              className="bg-transparent border-0 outline-none ring-0 shadow-none p-0 text-sm w-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-0"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search employers"
            />
          </label>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="page-loader" aria-hidden="true" />
            <span>Loading employers</span>
          </div>
        ) : filteredEmployers.length ? (
          <div className="w-full overflow-x-auto pb-2">
            <Table className="min-w-[620px]">
              <Table.Header>
                <Table.Row>
                  <Table.Head className="min-w-[140px]">Company</Table.Head>
                  <Table.Head className="min-w-[120px]">Industry</Table.Head>
                  <Table.Head className="min-w-[120px]">Location</Table.Head>
                  <Table.Head className="min-w-[140px]">Website</Table.Head>
                  <Table.Head className="min-w-[80px]">Contacts</Table.Head>
                  <Table.Head className="min-w-[80px] text-right">Actions</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {filteredEmployers.map((employer) => (
                  <Table.Row key={employer.id}>
                    <Table.Cell className="font-medium text-gray-900">
                      {employer.name}
                    </Table.Cell>
                    <Table.Cell>{employer.industry || "—"}</Table.Cell>
                    <Table.Cell>{employer.location || "—"}</Table.Cell>
                    <Table.Cell>
                      {employer.website ? (
                        <a
                          href={employer.website.startsWith("http") ? employer.website : `https://${employer.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0a5c4d] hover:underline"
                        >
                          {employer.website}
                        </a>
                      ) : (
                        "—"
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {contacts.filter((contact) => contact.employerId === employer.id).length}
                    </Table.Cell>
                    <Table.Cell className="text-right">
                      <button
                        type="button"
                        className="rounded-[6px] border-0 bg-[#e6f6f2] px-2.5 py-1 text-[14px] font-medium text-[#0a5c4d] hover:bg-[#cceee5]"
                        aria-label={`Open ${employer.name}`}
                        onClick={() => openEdit(employer)}
                      >
                        Edit
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-gray-500">No employers match your search.</p>
        )}
      </section>
    </>
  );
}

function EmployerEditor({
  employer,
  saving,
  deleting,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  employer?: Employer;
  saving: boolean;
  deleting: boolean;
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
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onSave({
        name: name.trim(),
        industry: industry.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
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
            {employer ? "Edit employer" : "Add employer"}
          </DialogTitle>
          <DialogDescription className="text-xs text-kumo-subtle mt-0.5">
            {employer
              ? "Update company information and notes."
              : "Save an employer to organize applications and contacts."}
          </DialogDescription>

          <form className="mt-4" onSubmit={handleSubmit}>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Company name" required>
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
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Notes">
                <InputArea
                  id="employer-notes"
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
                  employer ? "Save changes" : "Add employer"
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
                  Delete employer
                </DialogTitle>
                <DialogDescription className="text-xs text-kumo-subtle leading-relaxed">
                  Are you sure you want to delete{" "}
                  <strong className="font-semibold text-gray-900">
                    {employer?.name || "this employer"}
                  </strong>
                  ? This will not delete associated applications, but their employer link will be cleared. This action cannot be undone.
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
                  "Delete employer"
                )}
              </button>
            </div>
          </div>
        </Dialog>
      </DialogRoot>
    </>
  );
}