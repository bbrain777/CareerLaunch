import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { ExpenseTrackingPage } from "./ExpenseTrackingPage";
import { useAuth } from "../lib/auth";

// Mock the authentication hook
vi.mock("../lib/auth", () => ({
  useAuth: vi.fn(),
}));

describe("ExpenseTrackingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ token: "mock-jwt-token" });

    // Mock global fetch for API calls
    global.fetch = vi.fn((url) => {
      if (url.toString().includes("/summary")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ total: 250, byCategory: { TRAVEL: 250 } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            amount: 250,
            category: "TRAVEL",
            date: "2026-10-10",
            description: "Conference Flight",
            applicationId: null,
          }
        ]),
      });
    }) as any;
  });

  it("renders loading state initially", () => {
    render(<ExpenseTrackingPage />);
    expect(screen.getByText(/Loading expenses/i)).toBeInTheDocument();
  });

  it("loads and displays expenses and summary totals", async () => {
    render(<ExpenseTrackingPage />);

    // Wait for the mock fetch to resolve and render data
    await waitFor(() => {
      expect(screen.getAllByText("Conference Flight")[0]).toBeInTheDocument();
    });

    // Check summary total across cards and table
    expect(screen.getAllByText("$250.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Total Spending")[0]).toBeInTheDocument();
  });

  it("filters expenses by search term", async () => {
    render(<ExpenseTrackingPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Conference Flight")[0]).toBeInTheDocument();
    });

    const searchInput = screen.getAllByPlaceholderText("Search description...")[0];
    fireEvent.change(searchInput, { target: { value: "Uber" } });

    // Safely assert that all instances of the filtered-out text are gone
    expect(screen.queryAllByText("Conference Flight")).toHaveLength(0);
    expect(screen.getByText(/No expenses match your criteria/i)).toBeInTheDocument();
  });
});