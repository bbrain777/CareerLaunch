import { type FormEvent, useMemo, useState } from "react";
import {
  PencilSimpleIcon,
  PlusIcon,
  ReceiptIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import {
  Button,
  DatePickerField,
  Field,
  Input,
  Select,
  Table,
} from "../components/ui";
import {
  useApplicationsQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useExpensesQuery,
  useExpenseSummaryQuery,
  useUpdateExpenseMutation,
} from "../hooks/queries";
import type { Expense, ExpenseCategory, ExpenseInput } from "../types";

const categories: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "TRAVEL", label: "Travel" },
  { value: "PRINTING", label: "Printing" },
  { value: "TRAINING", label: "Training" },
  {
    value: "PROFESSIONAL_SERVICES",
    label: "Professional services",
  },
];

const categorySelectItems: Record<string, string> = {
  TRAVEL: "Travel",
  PRINTING: "Printing",
  TRAINING: "Training",
  PROFESSIONAL_SERVICES: "Professional services",
};

const emptyForm = (): ExpenseInput => ({
  amount: 0,
  category: "TRAVEL",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  applicationId: null,
});

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

function categoryLabel(category: ExpenseCategory) {
  return (
    categories.find((item) => item.value === category)?.label ?? category
  );
}

export function ExpenseTrackingPage() {
  const {
    data: expenses = [],
    isLoading,
    error: loadError,
  } = useExpensesQuery();

  const { data: summary } = useExpenseSummaryQuery();

  const { data: applications = [] } = useApplicationsQuery();

  const createExpense = useCreateExpenseMutation();
  const updateExpense = useUpdateExpenseMutation();
  const deleteExpense = useDeleteExpenseMutation();

  const [form, setForm] = useState<ExpenseInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    ExpenseCategory | ""
  >("");
  const [formError, setFormError] = useState("");

  const applicationSelectItems = useMemo(
    () => ({
      none: "No related application",
      ...Object.fromEntries(
        applications.map((app) => [
          String(app.id),
          `${app.company} — ${app.position}`,
        ])
      ),
    }),
    [applications]
  );

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter(
      (expense) =>
        (!categoryFilter || expense.category === categoryFilter) &&
        (!query ||
          expense.description.toLowerCase().includes(query)),
    );
  }, [categoryFilter, expenses, search]);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setFormError("");
  }

  function edit(expense: Expense) {
    setEditingId(expense.id);

    setForm({
      amount: expense.amount,
      category: expense.category,
      date: expense.date.slice(0, 10),
      description: expense.description,
      applicationId: expense.applicationId,
    });

    setFormError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");

    try {
      if (editingId) {
        await updateExpense.mutateAsync({
          id: editingId,
          changes: form,
        });
      } else {
        await createExpense.mutateAsync(form);
      }

      resetForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save the expense",
      );
    }
  }

  const saving =
    createExpense.isPending || updateExpense.isPending;

  return (
    <>
      <header className="mb-6">
        <span className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">
          Job-search costs
        </span>

        <h1>Expense tracking</h1>

        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Record and review costs connected to your career search.
        </p>
      </header>

      <section
        className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
        aria-label="Expense summary"
      >
        <article className="rounded-2xl bg-emerald-50 p-5 lg:col-span-1">
          <span className="text-xs font-medium text-emerald-700">
            Total spending
          </span>

          <strong className="mt-2 block text-2xl text-emerald-950">
            {money.format(summary?.total ?? 0)}
          </strong>
        </article>

        {categories.map((category) => (
          <article
            key={category.value}
            className="rounded-2xl bg-white p-5"
          >
            <span className="text-xs font-medium text-gray-500">
              {category.label}
            </span>

            <strong className="mt-2 block text-lg text-gray-900">
              {money.format(
                summary?.byCategory[category.value] ?? 0,
              )}
            </strong>
          </article>
        ))}
      </section>

      <section
        className="mb-6 rounded-2xl bg-white p-5 sm:p-6"
        aria-labelledby="expense-form-heading"
      >
        <div className="flex items-center justify-between gap-3">
          <h2
            id="expense-form-heading"
            className="text-lg font-semibold"
          >
            {editingId ? "Edit expense" : "Log an expense"}
          </h2>

          {editingId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetForm}
              className="!h-[30px] !px-3 !text-[12.5px] !font-medium !rounded-lg"
            >
              <XIcon className="size-3.5" />
              <span>Cancel</span>
            </Button>
          )}
        </div>

        {formError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError}
          </p>
        )}

        <form
          className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6"
          onSubmit={submit}
        >
          <div className="xl:col-span-1">
            <Input
              label="Amount (£)"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={form.amount || ""}
              onChange={(event) =>
                setForm({
                  ...form,
                  amount: Number(event.target.value),
                })
              }
            />
          </div>

          <div className="xl:col-span-1">
            <Select
              label="Category"
              className="w-full"
              value={form.category}
              onValueChange={(val) =>
                val &&
                setForm({
                  ...form,
                  category: val as ExpenseCategory,
                })
              }
              items={categorySelectItems}
            />
          </div>

          <div className="xl:col-span-2">
            <DatePickerField
              label="Date"
              value={form.date}
              onValueChange={(val) =>
                val &&
                setForm({
                  ...form,
                  date: val,
                })
              }
            />
          </div>

          <div className="md:col-span-2 xl:col-span-2">
            <Input
              label="Description"
              maxLength={200}
              required
              placeholder="Train to an interview"
              value={form.description}
              onChange={(event) =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
              }
            />
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <Select
              label="Related application (optional)"
              className="w-full"
              value={form.applicationId ? String(form.applicationId) : "none"}
              onValueChange={(val) =>
                setForm({
                  ...form,
                  applicationId: val && val !== "none" ? Number(val) : null,
                })
              }
              items={applicationSelectItems}
            />
          </div>

          <div className="flex items-end md:col-span-2 xl:col-span-2">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="!h-[30px] !px-3.5 !text-[12.5px] !font-medium !rounded-lg w-full sm:w-auto bg-[#0a5c4d] hover:bg-[#07473b] text-white border-0 shadow-sm inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusIcon className="size-3.5" />
              <span>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Add expense"}
              </span>
            </Button>
          </div>
        </form>
      </section>

      <section
        className="rounded-2xl bg-white p-5 sm:p-6"
        aria-labelledby="expense-history-heading"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="expense-history-heading"
              className="text-lg font-semibold"
            >
              Expense history
            </h2>

            <p className="text-sm text-gray-500">
              {expenses.length} recorded expenses
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              aria-label="Search expenses"
              placeholder="Search description"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <Select
              aria-label="Filter expenses by category"
              value={categoryFilter || "All"}
              onValueChange={(val) =>
                setCategoryFilter(
                  val === "All" ? "" : (val as ExpenseCategory)
                )
              }
              items={{
                All: "All categories",
                ...categorySelectItems,
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="page-loading">
            <span
              className="page-loader"
              aria-hidden="true"
            />
            <span>Loading expenses</span>
          </div>
        ) : loadError ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            Unable to load expenses.
          </p>
        ) : filteredExpenses.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
            <ReceiptIcon className="mx-auto mb-3 size-8" />
            <p>No expenses match your filters.</p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <Table className="min-w-[680px]">
              <Table.Header>
                <Table.Row>
                  <Table.Head className="p-3">Date</Table.Head>
                  <Table.Head className="p-3">Description</Table.Head>
                  <Table.Head className="p-3">Category</Table.Head>
                  <Table.Head className="p-3">Amount</Table.Head>
                  <Table.Head className="p-3 text-right">Actions</Table.Head>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {filteredExpenses.map((expense) => (
                  <Table.Row key={expense.id}>
                    <Table.Cell className="whitespace-nowrap">
                      {new Intl.DateTimeFormat("en-GB").format(
                        new Date(expense.date),
                      )}
                    </Table.Cell>

                    <Table.Cell className="font-medium text-gray-900">
                      {expense.description}
                    </Table.Cell>

                    <Table.Cell>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-800">
                        {categoryLabel(expense.category)}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="font-semibold text-gray-900">
                      {money.format(expense.amount)}
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => edit(expense)}
                        >
                          <PencilSimpleIcon className="size-4" />
                          Edit
                        </Button>

                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={deleteExpense.isPending}
                          onClick={() =>
                            void deleteExpense.mutateAsync(
                              expense.id,
                            )
                          }
                        >
                          <TrashIcon className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}