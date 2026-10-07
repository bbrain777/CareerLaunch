import { type FormEvent, useMemo, useState } from "react";
import { PencilSimpleIcon, PlusIcon, ReceiptIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "../components/ui";
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
  { value: "PROFESSIONAL_SERVICES", label: "Professional services" },
];

const emptyForm = (): ExpenseInput => ({
  amount: 0,
  category: "TRAVEL",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  applicationId: null,
});

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

function categoryLabel(category: ExpenseCategory) {
  return categories.find((item) => item.value === category)?.label ?? category;
}

export function ExpenseTrackingPage() {
  const { data: expenses = [], isLoading, error: loadError } = useExpensesQuery();
  const { data: summary } = useExpenseSummaryQuery();
  const { data: applications = [] } = useApplicationsQuery();
  const createExpense = useCreateExpenseMutation();
  const updateExpense = useUpdateExpenseMutation();
  const deleteExpense = useDeleteExpenseMutation();
  const [form, setForm] = useState<ExpenseInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");
  const [formError, setFormError] = useState("");

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return expenses.filter((expense) =>
      (!categoryFilter || expense.category === categoryFilter) &&
      (!query || expense.description.toLowerCase().includes(query)),
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    try {
      if (editingId) await updateExpense.mutateAsync({ id: editingId, changes: form });
      else await createExpense.mutateAsync(form);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to save the expense");
    }
  }

  const saving = createExpense.isPending || updateExpense.isPending;

  return (
    <>
      <header className="mb-6">
        <span className="mb-0.5 block text-xs font-medium text-[var(--text-muted)]">Job-search costs</span>
        <h1>Expense tracking</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Record and review costs connected to your career search.</p>
      </header>

      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Expense summary">
        <article className="rounded-2xl bg-emerald-50 p-5 lg:col-span-1">
          <span className="text-xs font-medium text-emerald-700">Total spending</span>
          <strong className="mt-2 block text-2xl text-emerald-950">{money.format(summary?.total ?? 0)}</strong>
        </article>
        {categories.map((category) => (
          <article key={category.value} className="rounded-2xl bg-white p-5">
            <span className="text-xs font-medium text-gray-500">{category.label}</span>
            <strong className="mt-2 block text-lg text-gray-900">{money.format(summary?.byCategory[category.value] ?? 0)}</strong>
          </article>
        ))}
      </section>

      <section className="mb-6 rounded-2xl bg-white p-5 sm:p-6" aria-labelledby="expense-form-heading">
        <div className="flex items-center justify-between gap-3">
          <h2 id="expense-form-heading" className="text-lg font-semibold">{editingId ? "Edit expense" : "Log an expense"}</h2>
          {editingId && <Button variant="secondary" size="sm" onClick={resetForm}><XIcon className="size-4" />Cancel</Button>}
        </div>
        {formError && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
        <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6" onSubmit={submit}>
          <label className="grid gap-1.5 text-sm font-medium">
            Amount (£)
            <input className="h-10 rounded-xl border border-gray-200 px-3" type="number" min="0.01" step="0.01" required value={form.amount || ""} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Category
            <select className="h-10 rounded-xl border border-gray-200 bg-white px-3" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as ExpenseCategory })}>
              {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Date
            <input className="h-10 rounded-xl border border-gray-200 px-3" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium xl:col-span-2">
            Description
            <input className="h-10 rounded-xl border border-gray-200 px-3" maxLength={200} required placeholder="Train to an interview" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium md:col-span-2 xl:col-span-3">
            Related application (optional)
            <select className="h-10 rounded-xl border border-gray-200 bg-white px-3" value={form.applicationId ?? ""} onChange={(event) => setForm({ ...form, applicationId: event.target.value ? Number(event.target.value) : null })}>
              <option value="">No related application</option>
              {applications.map((application) => <option key={application.id} value={application.id}>{application.company} — {application.position}</option>)}
            </select>
          </label>
          <div className="flex items-end md:col-span-2 xl:col-span-3">
            <Button type="submit" variant="primary" disabled={saving}><PlusIcon className="size-4" />{saving ? "Saving" : editingId ? "Save changes" : "Add expense"}</Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-5 sm:p-6" aria-labelledby="expense-history-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 id="expense-history-heading" className="text-lg font-semibold">Expense history</h2><p className="text-sm text-gray-500">{expenses.length} recorded expenses</p></div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="h-10 rounded-xl border border-gray-200 px-3 text-sm" aria-label="Search expenses" placeholder="Search description" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm" aria-label="Filter expenses by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as ExpenseCategory | "")}>
              <option value="">All categories</option>
              {categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
            </select>
          </div>
        </div>
        {isLoading ? (
          <div className="page-loading"><span className="page-loader" aria-hidden="true" /><span>Loading expenses</span></div>
        ) : loadError ? (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">Unable to load expenses.</p>
        ) : filteredExpenses.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500"><ReceiptIcon className="mx-auto mb-3 size-8" /><p>No expenses match your filters.</p></div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-500"><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Category</th><th className="p-3">Amount</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody>{filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-50 last:border-0">
                  <td className="p-3 whitespace-nowrap">{new Intl.DateTimeFormat("en-GB").format(new Date(expense.date))}</td>
                  <td className="p-3 font-medium text-gray-900">{expense.description}</td>
                  <td className="p-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">{categoryLabel(expense.category)}</span></td>
                  <td className="p-3 font-semibold">{money.format(expense.amount)}</td>
                  <td className="p-3"><div className="flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => edit(expense)}><PencilSimpleIcon className="size-4" />Edit</Button><Button variant="secondary" size="sm" disabled={deleteExpense.isPending} onClick={() => void deleteExpense.mutateAsync(expense.id)}><TrashIcon className="size-4" />Delete</Button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
