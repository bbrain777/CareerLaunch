import { type FormEvent, useState } from "react";
import { DownloadSimpleIcon, FileTextIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Alert02Icon } from "hugeicons-react";
import { Dialog, DialogDescription, DialogRoot, DialogTitle, Select } from "../components/ui";
import {
  useApplicationsQuery,
  useDeleteDocumentMutation,
  useDocumentsQuery,
  useUploadDocumentMutation,
} from "../hooks/queries";
import { api } from "../lib/api";
import { appToastManager } from "../lib/toast";
import type { CareerDocument } from "../types";

const MAX_BYTES = 5 * 1024 * 1024;
const allowedExtensions = ["pdf", "doc", "docx"];

function documentLabel(type: CareerDocument["type"]) {
  return type === "RESUME" ? "Resume" : "Cover letter";
}

function fileSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DocumentsPage() {
  const { data: documents = [], isLoading } = useDocumentsQuery();
  const { data: applications = [] } = useApplicationsQuery();
  const uploadDocument = useUploadDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();
  const [type, setType] = useState<CareerDocument["type"]>("RESUME");
  const [title, setTitle] = useState("");
  const [version, setVersion] = useState("v1");
  const [applicationId, setApplicationId] = useState("none");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<CareerDocument | null>(null);

  function handleFileChange(selectedFile: File | null) {
    setFile(selectedFile);
    setValidationError(null);
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop()?.toLowerCase() ?? "";
    if (!title.trim()) {
      setTitle(selectedFile.name.replace(/\.[^.]+$/, ""));
    }
    if (!allowedExtensions.includes(extension)) {
      setValidationError("Unsupported file format. Please choose a PDF, DOC, or DOCX file.");
      return;
    }
    if (selectedFile.size > MAX_BYTES) {
      setValidationError("File is too large. Maximum file size is 5 MB.");
      return;
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setValidationError("Please select a file to upload.");
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension) || file.size > MAX_BYTES) {
      const msg = "Choose a PDF, DOC, or DOCX file no larger than 5 MB.";
      setValidationError(msg);
      appToastManager.add({
        title: "File not allowed",
        description: msg,
        variant: "error",
      });
      return;
    }

    try {
      setUploadProgress(0);
      await uploadDocument.mutateAsync({
        file,
        type,
        title: title.trim() || file.name,
        version: version.trim() || "v1",
        applicationId: applicationId === "none" ? null : Number(applicationId),
        onProgress: (percent) => setUploadProgress(percent),
      });
      setFile(null);
      setTitle("");
      setVersion("v1");
      setApplicationId("none");
      setUploadProgress(null);
      setValidationError(null);
      const input = document.getElementById("career-document-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch {
      setUploadProgress(null);
    }
  }

  async function download(document: CareerDocument) {
    const blob = await api.download(document.downloadUrl);
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteConfirm() {
    if (!docToDelete) return;
    try {
      await deleteDocument.mutateAsync(docToDelete.id);
      setDocToDelete(null);
    } catch {
      // handled by mutation/toast
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* page header */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-semibold text-[#1d1c1a] tracking-tight">Documents</h1>
          <p className="mt-1 text-[13.5px] text-[#57544e]">Store resumes and cover letters in private, owner-only storage.</p>
        </div>
      </header>

      {/* upload panel */}
      <section className="bg-white border border-[#e9e7e2] rounded-[10px] shadow-[0_1px_2px_rgba(28,25,20,0.04)] p-4 sm:p-5 flex flex-col gap-3" aria-labelledby="upload-document-heading">
        <div className="border-b border-[#f0eeea] pb-2.5">
          <h2 id="upload-document-heading" className="text-[14.5px] font-semibold text-[#1d1c1a]">Upload a document</h2>
          <p className="mt-0.5 text-[12.5px] text-[#57544e]">PDF, DOC, or DOCX only. Maximum file size: 5 MB.</p>
        </div>
        <form
          className="mt-2 grid gap-3.5 md:grid-cols-2 md:items-end xl:grid-cols-[160px_minmax(160px,1fr)_100px_minmax(180px,1fr)_minmax(180px,1fr)_auto]"
          onSubmit={submit}
        >
          <div className="w-full">
            <Select
              label="Document type"
              className="w-full"
              value={type}
              onValueChange={(val) => val && setType(val as CareerDocument["type"])}
              items={{
                RESUME: "Resume",
                COVER_LETTER: "Cover letter",
              }}
            />
          </div>
          <label className="grid gap-1.5 text-[12.5px] font-medium text-[#1d1c1a]">
            Document title
            <input
              className="h-[30px] rounded-[6px] border border-[#dad7d0] px-2.5 text-[12.5px]"
              value={title}
              maxLength={200}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-1.5 text-[12.5px] font-medium text-[#1d1c1a]">
            Version
            <input
              className="h-[30px] rounded-[6px] border border-[#dad7d0] px-2.5 text-[12.5px]"
              value={version}
              maxLength={200}
              onChange={(event) => setVersion(event.target.value)}
              required
            />
          </label>
          <div className="w-full">
            <Select
              label="Link to application"
              className="w-full"
              value={applicationId}
              onValueChange={(value) => value && setApplicationId(value)}
              items={{
                none: "No application",
                ...Object.fromEntries(
                  applications.map((application) => [
                    String(application.id),
                    `${application.position} at ${application.company}`,
                  ]),
                ),
              }}
            />
          </div>
          <label className="grid gap-1.5 text-[12.5px] font-medium text-[#1d1c1a]">
            File
            <input
              id="career-document-file"
              className="h-[30px] rounded-[6px] border border-[#dad7d0] bg-white px-2.5 py-1 text-[12.5px] text-[#1d1c1a] file:mr-2.5 file:border-0 file:bg-[#f6f5f2] file:text-[11.5px] file:font-medium file:text-[#1d1c1a] file:rounded-[4px] file:px-2 file:py-0.5"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-lg bg-[#0a5c4d] hover:bg-[#07473b] active:scale-[0.98] px-3.5 text-[12.5px] font-medium text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
            disabled={!file || Boolean(validationError) || uploadDocument.isPending}
          >
            <UploadSimpleIcon className="size-3.5" />
            <span>{uploadDocument.isPending ? `Uploading ${uploadProgress ?? 0}%` : "Upload"}</span>
          </button>
        </form>

        {validationError && (
          <p className="mt-1 text-[12px] font-medium text-[#b23c30]" role="alert">
            {validationError}
          </p>
        )}

        {uploadDocument.isPending && uploadProgress !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[11.5px] font-medium text-[#57544e] mb-1">
              <span>Uploading {file?.name}...</span>
              <span className="tabular-nums">{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f6f5f2] border border-[#e9e7e2]">
              <div
                className="h-full bg-[#0a5c4d] transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* saved documents panel */}
      <section className="bg-white border border-[#e9e7e2] rounded-[10px] shadow-[0_1px_2px_rgba(28,25,20,0.04)] p-4 sm:p-5 flex flex-col gap-3" aria-labelledby="saved-documents-heading">
        <div className="flex items-center justify-between gap-3 border-b border-[#f0eeea] pb-2.5">
          <h2 id="saved-documents-heading" className="text-[14.5px] font-semibold text-[#1d1c1a]">Saved documents</h2>
          <span className="text-[12px] text-[#57544e] font-medium tabular-nums">{documents.length} files</span>
        </div>
        {isLoading ? (
          <div className="page-loading py-12"><span className="page-loader" aria-hidden="true" /><span>Loading documents</span></div>
        ) : documents.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[#dad7d0] p-8 text-center text-[#8c8880]">
            <FileTextIcon className="mx-auto mb-2 size-7 text-[#8c8880]" />
            <p className="text-[13px] text-[#57544e]">No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {documents.map((document) => (
              <article key={document.id} className="flex flex-col gap-3 rounded-[8px] border border-[#e9e7e2] p-3 hover:bg-[#fbfaf8] transition-colors sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-[6px] bg-[#e6f6f2] text-[#0a5c4d]"><FileTextIcon className="size-4" /></span>
                  <div className="min-w-0">
                    <h3 className="truncate text-[13.5px] font-semibold text-[#1d1c1a]">
                      {document.title || document.fileName}
                    </h3>
                    <p className="text-[11.5px] text-[#57544e]">
                      {documentLabel(document.type)} · {document.fileName} · {fileSize(document.sizeBytes)} · Version {document.version}
                    </p>
                    {document.applicationId !== null && (
                      <p className="truncate text-[11.5px] text-[#57544e]">
                        Linked to {applications.find((application) => application.id === document.applicationId)?.position
                          ?? "application"} at{" "}
                        {applications.find((application) => application.id === document.applicationId)?.company
                          ?? "your application"}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="h-[26px] px-2.5 rounded-[5px] border border-[#dad7d0] bg-white hover:bg-[#f6f5f2] text-[12px] font-medium text-[#1d1c1a] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    onClick={() => void download(document)}
                  >
                    <DownloadSimpleIcon className="size-3.5 text-[#57544e]" />
                    Download
                  </button>
                  <button
                    type="button"
                    className="h-[26px] px-2.5 rounded-[5px] bg-[#b23c30]/10 hover:bg-[#b23c30]/20 text-[12px] font-medium text-[#b23c30] transition-colors cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-60"
                    disabled={deleteDocument.isPending}
                    onClick={() => setDocToDelete(document)}
                  >
                    <TrashIcon className="size-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <DialogRoot open={docToDelete !== null} onOpenChange={(open) => { if (!open) setDocToDelete(null); }}>
        <Dialog size="sm" className="max-w-[420px] px-6 py-5 rounded-[12px] bg-white border border-[#e9e7e2]">
          <div className="flex items-start gap-3.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-[#b23c30]/10 text-[#b23c30]">
              <Alert02Icon size={18} />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold text-[#1d1c1a]">Delete document</DialogTitle>
              <DialogDescription className="mt-1 text-[12.5px] leading-relaxed text-[#57544e]">
                Are you sure you want to delete <strong className="text-[#1d1c1a]">{docToDelete?.fileName}</strong>? This action cannot be undone.
              </DialogDescription>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2.5 border-t border-[#e9e7e2] pt-3">
            <button
              type="button"
              className="h-[30px] px-3 rounded-lg text-[12.5px] font-medium bg-white border border-[#dad7d0] hover:bg-[#f6f5f2] text-[#1d1c1a] cursor-pointer shadow-sm transition-colors"
              onClick={() => setDocToDelete(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="inline-flex h-[30px] items-center justify-center gap-1.5 rounded-lg bg-[#b23c30] hover:bg-[#b23c30]/90 active:scale-[0.98] px-3.5 text-[12.5px] font-medium text-white transition-all cursor-pointer disabled:opacity-60 shadow-sm"
              disabled={deleteDocument.isPending}
              onClick={handleDeleteConfirm}
            >
              {deleteDocument.isPending ? "Deleting..." : "Delete document"}
            </button>
          </div>
        </Dialog>
      </DialogRoot>
    </div>
  );
}
