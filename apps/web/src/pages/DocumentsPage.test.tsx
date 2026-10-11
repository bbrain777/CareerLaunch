import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DocumentsPage } from "./DocumentsPage";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../hooks/queries", () => ({
  useApplicationsQuery: () => ({
    data: [{ id: 12, company: "Acme", position: "Engineer" }],
  }),
  useDocumentsQuery: () => ({
    data: [{
      id: 8,
      type: "RESUME",
      fileName: "resume.pdf",
      title: "Engineer Resume",
      version: "v2",
      applicationId: 12,
      contentType: "application/pdf",
      sizeBytes: 100,
      createdAt: "2026-10-10T00:00:00Z",
      downloadUrl: "/api/documents/8/download",
    }],
    isLoading: false,
  }),
  useUploadDocumentMutation: () => ({
    mutateAsync: mocks.upload,
    isPending: false,
  }),
  useDeleteDocumentMutation: () => ({
    mutateAsync: mocks.remove,
    isPending: false,
  }),
}));

vi.mock("../components/ui", () => ({
  Select: ({ label, value, onValueChange, items }: {
    label: string;
    value: string;
    onValueChange: (value: string | null) => void;
    items: Record<string, string>;
  }) => (
    <label>
      {label}
      <select aria-label={label} value={value} onChange={(event) => onValueChange(event.target.value)}>
        {Object.entries(items).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select>
    </label>
  ),
  DialogRoot: ({ open, children }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
}));

describe("DocumentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upload.mockResolvedValue({ document: { id: 9 } });
    mocks.remove.mockResolvedValue(undefined);
  });

  it("shows version and job-application association for saved documents", () => {
    render(<DocumentsPage />);

    expect(screen.getByText("Engineer Resume")).toBeInTheDocument();
    expect(screen.getByText(/Version v2/)).toBeInTheDocument();
    expect(screen.getByText(/Linked to Engineer at Acme/)).toBeInTheDocument();
  });

  it("uploads a private document with a title, version, and selected application", async () => {
    render(<DocumentsPage />);
    const file = new File(["sample"], "resume.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText("Document title"), { target: { value: "Senior Engineer Resume" } });
    fireEvent.change(screen.getByLabelText("Version"), { target: { value: "v3" } });
    fireEvent.change(screen.getByLabelText("Link to application"), { target: { value: "12" } });
    fireEvent.submit(screen.getByRole("button", { name: "Upload" }).closest("form")!);

    await waitFor(() => expect(mocks.upload).toHaveBeenCalledWith(expect.objectContaining({
      file,
      type: "RESUME",
      title: "Senior Engineer Resume",
      version: "v3",
      applicationId: 12,
      onProgress: expect.any(Function),
    })));
  });

  it("blocks unsupported file types and keeps the validation message visible", () => {
    render(<DocumentsPage />);
    const file = new File(["image"], "portrait.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("File"), { target: { files: [file] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Unsupported file format");
    expect(screen.getByRole("button", { name: "Upload" })).toBeDisabled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("confirms deletion before removing one version", async () => {
    render(<DocumentsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("heading", { name: "Delete document" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete document" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith(8));
  });
});
