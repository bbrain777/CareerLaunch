import { useMemo, useState } from "react";
import { Search01Icon } from "hugeicons-react";
import { BriefcaseIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "../components/ui";
import { InterviewPrepDetail } from "../components/InterviewPrepDetail";
import { InterviewPrepEditor } from "../components/InterviewPrepEditor";
import {
  useApplicationsQuery,
  useCreateJobInterviewPreparationMutation,
  useDeleteJobInterviewPreparationMutation,
  useJobInterviewPreparationsQuery,
  useUpdateJobInterviewPreparationMutation,
} from "../hooks/queries";
import type { JobInterviewPreparation } from "../types";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; prep: JobInterviewPreparation };

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not scheduled";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function InterviewPrepPage() {
  const { data: preparations = [], isLoading } =
    useJobInterviewPreparationsQuery();
  const { data: applications = [] } = useApplicationsQuery();
  const createPrep = useCreateJobInterviewPreparationMutation();
  const updatePrep = useUpdateJobInterviewPreparationMutation();
  const deletePrep = useDeleteJobInterviewPreparationMutation();

  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [detail, setDetail] = useState<JobInterviewPreparation | null>(null);

  const applicationById = useMemo(
    () => new Map(applications.map((app) => [app.id, app])),
    [applications]
  );

  const filteredPreps = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return preparations;
    return preparations.filter((prep) =>
      [
        prep.company,
        prep.role,
        prep.companyResearch,
        prep.notes,
        ...(prep.skills || []),
        ...(prep.responsibilities || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [preparations, query]);

  function openCreate() {
    setEditor({ mode: "create" });
    setEditorKey((key) => key + 1);
  }

  function openEdit(prep: JobInterviewPreparation) {
    setDetail(null);
    setEditor({ mode: "edit", prep });
    setEditorKey((key) => key + 1);
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">
            Interview mastery
          </span>
          <h1 className="truncate">Job Interview Preparation</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Organize company research, role responsibilities, relevant skills, resources, and practice questions.
          </p>
        </div>
        <Button
          variant="primary"
          className="!rounded-lg !h-[30px] !px-3 !text-[12.5px] !font-medium shrink-0 inline-flex items-center gap-1.5 bg-[#0a5c4d] hover:bg-[#07473b] text-white border-0 shadow-sm transition-colors cursor-pointer"
          onClick={openCreate}
        >
          <PlusIcon className="size-3.5" />
          <span>Add interview prep</span>
        </Button>
      </header>

      <InterviewPrepEditor
        key={editorKey}
        prep={editor?.mode === "edit" ? editor.prep : undefined}
        applications={applications}
        open={editor !== null}
        saving={createPrep.isPending || updatePrep.isPending}
        deleting={deletePrep.isPending}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        onSave={async (input) => {
          if (editor?.mode === "edit") {
            await updatePrep.mutateAsync({
              id: editor.prep.id,
              changes: input,
            });
          } else {
            await createPrep.mutateAsync(input);
          }
          setEditor(null);
        }}
        onDelete={
          editor?.mode === "edit"
            ? async () => {
                await deletePrep.mutateAsync(editor.prep.id);
                setEditor(null);
              }
            : undefined
        }
      />

      <InterviewPrepDetail
        prep={detail}
        application={
          detail?.applicationId
            ? applicationById.get(detail.applicationId) ?? null
            : null
        }
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        onEdit={detail ? () => openEdit(detail) : undefined}
      />

      <section
        className="min-w-0 rounded-2xl bg-white p-4 sm:p-6"
        aria-label="Interview preparations"
      >
        <div className="mb-[18px] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-medium text-gray-700">
            {preparations.length} {preparations.length === 1 ? "workspace" : "workspaces"} tracked
          </span>
          <label className="flex w-full items-center gap-2 rounded-xl border border-gray-200/60 bg-gray-100/80 px-3.5 py-2 text-gray-400 focus-within:border-[#0a5c4d] focus-within:ring-2 focus-within:ring-[#0a5c4d]/20 sm:w-[280px] md:w-[320px]">
            <span className="sr-only">Search interview prep</span>
            <Search01Icon size={16} className="shrink-0 text-gray-500" />
            <input
              type="text"
              className="w-full border-0 bg-transparent p-0 text-sm text-gray-900 shadow-none outline-none placeholder:text-gray-400 focus:ring-0"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, role, skills..."
            />
          </label>
        </div>

        {isLoading ? (
          <div className="page-loading" role="status" aria-live="polite">
            <span className="page-loader" aria-hidden="true" />
            <span>Loading interview preparations</span>
          </div>
        ) : filteredPreps.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPreps.map((prep) => (
              <article
                key={prep.id}
                className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-gray-900">
                        {prep.role}
                      </h2>
                      <p className="truncate text-sm font-medium text-[#0a5c4d]">
                        {prep.company}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      {formatDate(prep.scheduledFor)}
                    </span>
                  </div>

                  {prep.skills && prep.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {prep.skills.slice(0, 4).map((skill, index) => (
                        <span
                          key={index}
                          className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                      {prep.skills.length > 4 && (
                        <span className="rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500">
                          +{prep.skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div className="rounded-xl bg-gray-50 p-2.5">
                      <span className="block text-[11px] text-gray-500">
                        Practice questions
                      </span>
                      <strong className="text-sm font-semibold text-gray-900">
                        {prep.practiceQuestions?.length || 0}
                      </strong>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-2.5">
                      <span className="block text-[11px] text-gray-500">
                        Resources & links
                      </span>
                      <strong className="text-sm font-semibold text-gray-900">
                        {prep.resources?.length || 0}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDetail(prep)}
                  >
                    View details
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openEdit(prep)}
                  >
                    Edit
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : preparations.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <BriefcaseIcon className="mx-auto mb-3 size-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              No interview preparations created yet.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create a preparation workspace to organize questions, skills, and company insights.
            </p>
          </div>
        ) : (
          <p className="px-4 py-12 text-center text-sm text-gray-500">
            No interview preparation matches your search.
          </p>
        )}
      </section>
    </>
  );
}
