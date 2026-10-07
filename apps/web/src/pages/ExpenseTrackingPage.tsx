import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "../lib/auth";

type Expense = {
  id: number;
  amount: number;
  category: string;
  date: string;
  description: string;
  applicationId: number | null;
};

type Summary = {
  total: number;
  byCategory: Record<string, number>;
};

const CATEGORIES = ["TRAVEL", "PRINTING", "TRAINING", "PROFESSIONAL_SERVICES"];
const API_BASE = "/api/expenses";

export function ExpenseTrackingPage() {
  const { token } = useAuth();
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, byCategory: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    category: "TRAVEL",
    date: new Date().toISOString().split("T")[0],
    description: "",
    applicationId: "",
  });

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [expRes, sumRes] = await Promise.all([
        fetch(API_BASE, { headers }),
        fetch(`${API_BASE}/summary`, { headers })
      ]);
      
      if (!expRes.ok || !sumRes.ok) throw new Error("Failed to fetch data");
      
      setExpenses(await expRes.json());
      setSummary(await sumRes.json());
      setError(null);
    } catch (err) {
      setError("Failed to load expenses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      ...formData,
      amount: Number(formData.amount),
      applicationId: formData.applicationId ? Number(formData.applicationId) : null,
    };

    try {
      const url = isEditing ? `${API_BASE}/${isEditing}` : API_BASE;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Operation failed");
      }

      resetForm();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed to delete");
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (exp: Expense) => {
    setIsEditing(exp.id);
    setFormData({
      amount: String(exp.amount),
      category: exp.category,
      date: new Date(exp.date).toISOString().split("T")[0],
      description: exp.description,
      applicationId: exp.applicationId ? String(exp.applicationId) : "",
    });
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({ amount: "", category: "TRAVEL", date: new Date().toISOString().split("T")[0], description: "", applicationId: "" });
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? exp.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) return <div className="p-8 text-center">Loading expenses...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Expense Tracking</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded shadow-sm border border-blue-100">
          <h2 className="text-lg font-semibold text-blue-800">Total Spending</h2>
          <p className="text-3xl font-bold text-blue-900">${summary.total.toFixed(2)}</p>
        </div>
        <div className="md:col-span-2 bg-gray-50 p-4 rounded shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Spending by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map(cat => (
              <div key={cat}>
                <div className="text-xs text-gray-500 uppercase">{cat.replace("_", " ")}</div>
                <div className="font-medium">${(summary.byCategory[cat] || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Expense" : "Log New Expense"}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium mb-1">Amount ($)</label>
            <input type="number" step="0.01" min="0.01" required value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded p-2" />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="w-full border rounded p-2">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium mb-1">Date</label>
            <input type="date" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full border rounded p-2" />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded p-2" />
          </div>
          <div className="lg:col-span-1 flex items-end gap-2">
            <button type="submit" className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700">
              {isEditing ? "Update" : "Save"}
            </button>
            {isEditing && (
              <button type="button" onClick={resetForm} className="w-full bg-gray-200 text-gray-800 rounded p-2 hover:bg-gray-300">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <h2 className="text-xl font-semibold">Expense History</h2>
          <div className="flex gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="border rounded p-2 text-sm w-full sm:w-48" />
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border rounded p-2 text-sm w-full sm:w-40">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>
        
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No expenses match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-sm">
                  <th className="p-3 border-b">Date</th>
                  <th className="p-3 border-b">Description</th>
                  <th className="p-3 border-b">Category</th>
                  <th className="p-3 border-b">Amount</th>
                  <th className="p-3 border-b text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                    <td className="p-3">{exp.description}</td>
                    <td className="p-3 text-xs">
                      <span className="bg-gray-200 px-2 py-1 rounded">{exp.category.replace("_", " ")}</span>
                    </td>
                    <td className="p-3 font-medium">${Number(exp.amount).toFixed(2)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => handleEdit(exp)} className="text-blue-600 hover:underline mr-3 text-sm">Edit</button>
                      <button onClick={() => handleDelete(exp.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}