import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ExpenseTrackingPage } from "./ExpenseTrackingPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockExpenses = [
  {
    id: 1,
    amount: 250,
    category: "TRAVEL" as const,
    date: "2026-10-10",
    description: "Conference Flight",
    applicationId: null,
  },
];

const mockSummary = {
  total: 250,
  byCategory: {
    TRAVEL: 250,
    PRINTING: 0,
    TRAINING: 0,
    PROFESSIONAL_SERVICES: 0,
  },
};

vi.mock("../hooks/queries", () => ({
  useExpensesQuery: vi.fn(() => ({
    data: mockExpenses,
    isLoading: false,
    error: null,
  })),

  useExpenseSummaryQuery: vi.fn(() => ({
    data: mockSummary,
    isLoading: false,
    error: null,
  })),

  useApplicationsQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),

  useCreateExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),

  useUpdateExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),

  useDeleteExpenseMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ExpenseTrackingPage />
    </QueryClientProvider>,
  );
}

describe("ExpenseTrackingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the expense page", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Expense tracking" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Expense history"),
    ).toBeInTheDocument();
  });

  it("loads and displays expenses and summary totals", async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Conference Flight"),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Total spending"),
    ).toBeInTheDocument();

    expect(
      screen.getAllByText("£250.00").length,
    ).toBeGreaterThan(0);
  });

  it("filters expenses by search term", async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText("Conference Flight"),
      ).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "Search description",
    );

    fireEvent.change(searchInput, {
      target: { value: "Uber" },
    });

    expect(
      screen.queryByText("Conference Flight"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("No expenses match your filters."),
    ).toBeInTheDocument();
  });
});