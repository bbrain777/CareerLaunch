import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { InterviewPrepEditor } from "./InterviewPrepEditor";

vi.mock("../components/ui", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
  DatePickerField: ({ label, value, onValueChange }: {
    label: string;
    value: string | null;
    onValueChange: (value: string | null) => void;
  }) => (
    <label>
      {label}
      <input
        aria-label={label}
        type="date"
        value={value ?? ""}
        onChange={(event) => onValueChange(event.target.value || null)}
      />
    </label>
  ),
  Dialog: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogDescription: ({ children }: React.PropsWithChildren) => <p>{children}</p>,
  DialogRoot: ({ open, children }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div>{children}</div> : null,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  Field: ({ label, children }: React.PropsWithChildren<{ label: string }>) => (
    <label>
      {label}
      {children}
    </label>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  InputArea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
  Select: ({ label, value, onValueChange, items }: {
    label: string;
    value: string;
    onValueChange: (value: string | null) => void;
    items: Record<string, string>;
  }) => (
    <label>
      {label}
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {Object.entries(items).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select>
    </label>
  ),
}));

function renderEditor(onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <InterviewPrepEditor
      applications={[]}
      open
      saving={false}
      deleting={false}
      onOpenChange={vi.fn()}
      onSave={onSave}
    />,
  );
  return onSave;
}

describe("InterviewPrepEditor", () => {
  it("saves interview preparation fields as trimmed values and line-based lists", async () => {
    const onSave = renderEditor();

    fireEvent.change(screen.getByLabelText("Company"), { target: { value: " Acme " } });
    fireEvent.change(screen.getByLabelText("Role / Position"), { target: { value: " Engineer " } });
    fireEvent.change(screen.getByLabelText("Target Responsibilities (one per line)"), {
      target: { value: " Build features \n\n Review code " },
    });
    fireEvent.change(screen.getByLabelText("Practice Questions (one per line)"), {
      target: { value: " Tell me about yourself. \nWhy this role?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add interview prep" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      company: "Acme",
      role: "Engineer",
      responsibilities: ["Build features", "Review code"],
      practiceQuestions: ["Tell me about yourself.", "Why this role?"],
    })));
  });

  it("rejects resource links that are not HTTP or HTTPS URLs", async () => {
    const onSave = renderEditor();
    fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Acme" } });
    fireEvent.change(screen.getByLabelText("Role / Position"), { target: { value: "Engineer" } });
    fireEvent.change(screen.getByLabelText("Resources & URLs (one per line)"), {
      target: { value: "javascript:alert(1)" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add interview prep" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("must be a valid HTTP or HTTPS URL");
    expect(onSave).not.toHaveBeenCalled();
  });
});
