import { type FormEvent, useState } from "react";
import { DownloadSimpleIcon, FileTextIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "../components/ui";
import { useDeleteDocumentMutation, useDocumentsQuery, useUploadDocumentMutation } from "../hooks/queries";
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
  const uploadDocument = useUploadDocumentMutation();
  const deleteDocument = useDeleteDocumentMutation();
  const [type, setType] = useState<CareerDocument["type"]>("RESUME");
  const [file, setFile] = useState<File | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension) || file.size > MAX_BYTES) {
      appToastManager.add({
        title: "File not allowed",
        description: "Choose a PDF, DOC, or DOCX file no larger than 5 MB.",
        variant: "error",
      });
      return;
    }
    await uploadDocument.mutateAsync({ file, type });
    setFile(null);
    const input = document.getElementById("career-document-file") as HTMLInputElement | null;
    if (input) input.value = "";
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

  return (
    <>
      <header className="mb-6">
        <span className="mb-0.5 block text-[12px] font-medium text-[var(--text-muted)]">Application materials</span>
        <h1>Documents</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Store resumes and cover letters in private, owner-only storage.</p>
      </header>

      <section className="mb-6 rounded-2xl bg-white p-5 sm:p-6" aria-labelledby="upload-document-heading">
        <h2 id="upload-document-heading" className="text-lg font-semibold">Upload a document</h2>
        <p className="mt-1 text-sm text-gray-500">PDF, DOC, or DOCX only. Maximum file size: 5 MB.</p>
        <form className="mt-5 grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end" onSubmit={submit}>
          <label className="grid gap-1.5 text-sm font-medium">
            Document type
            <select
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm"
              value={type}
              onChange={(event) => setType(event.target.value as CareerDocument["type"])}
            >
              <option value="RESUME">Resume</option>
              <option value="COVER_LETTER">Cover letter</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            File
            <input
              id="career-document-file"
              className="h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-transparent file:font-medium"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          <Button type="submit" variant="primary" disabled={!file || uploadDocument.isPending}>
            <UploadSimpleIcon className="size-4" />
            {uploadDocument.isPending ? "Uploading" : "Upload"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 sm:p-6" aria-labelledby="saved-documents-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="saved-documents-heading" className="text-lg font-semibold">Saved documents</h2>
          <span className="text-sm text-gray-500">{documents.length} files</span>
        </div>
        {isLoading ? (
          <div className="page-loading"><span className="page-loader" aria-hidden="true" /><span>Loading documents</span></div>
        ) : documents.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
            <FileTextIcon className="mx-auto mb-3 size-8" />
            <p>No documents uploaded yet.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {documents.map((document) => (
              <article key={document.id} className="flex flex-col gap-3 rounded-xl border border-gray-100 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><FileTextIcon className="size-5" /></span>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{document.fileName}</h3>
                    <p className="text-xs text-gray-500">{documentLabel(document.type)} · {fileSize(document.sizeBytes)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => void download(document)}><DownloadSimpleIcon className="size-4" />Download</Button>
                  <Button variant="secondary" size="sm" disabled={deleteDocument.isPending} onClick={() => void deleteDocument.mutateAsync(document.id)}><TrashIcon className="size-4" />Delete</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
