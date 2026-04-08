import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaSearch, FaFilter, FaEdit, FaTrash, FaReceipt, FaDownload } from "react-icons/fa";
import { exportToCSV } from "../utils/analyticsHelper";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Expenses() {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        title: "",
        amount: "",
        categoryId: "",
        type: "EXPENSE",
        note: "",
        date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [editingExpense, setEditingExpense] = useState(null);

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await api.get("/expenses");
            const expensesData = Array.isArray(res.data.data) ? res.data.data : [];
            const normalized = expensesData.map((expense) => ({
                ...expense,
                categoryName: expense.categoryName || "General"
            }));
            setExpenses(normalized);
        } catch (err) {
            console.error("Error fetching expenses:", err);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get("/categories");
            const cats = Array.isArray(res.data.data) ? res.data.data : [];
            console.log("✅ Categories fetched from backend:", cats);
            cats.forEach((cat) => {
                console.log(`  - ID: ${cat.id} (${typeof cat.id}), Name: ${cat.name}`);
            });
            setCategories(cats);
        } catch (err) {
            console.error("❌ Error fetching categories:", err);
            if (err.response?.status === 403) {
                setError("Access denied. Please log in again.");
            }
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        
        console.log("🔍 Form data before submission:", {
            title: newExpense.title,
            amount: newExpense.amount,
            categoryId: newExpense.categoryId,
            categories: categories
        });
        
        if (!newExpense.title || !newExpense.amount || !newExpense.categoryId) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        setError("");
        try {
            // ✅ Validate categoryId
            const categoryIdNum = parseInt(newExpense.categoryId, 10);
            if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
                const err = "Category ID is invalid. Please select a valid category.";
                setError(err);
                toast.error(err);
                setLoading(false);
                return;
            }

            const category = categories.find((cat) => String(cat.id) === String(newExpense.categoryId));
            const payload = {
                title: newExpense.title,
                amount: parseFloat(newExpense.amount),
                categoryId: categoryIdNum, // ✅ Use validated number
                type: newExpense.type,
                note: newExpense.note,
                date: newExpense.date
            };

            console.log("📤 Sending expense payload:", JSON.stringify(payload, null, 2));

            if (editingExpense) {
                await api.put(`/expenses/${editingExpense.id}`, payload);
                toast.success("Expense updated successfully!");
            } else {
                await api.post("/expenses", payload);
                toast.success("Expense added successfully!");
            }
            setShowAddModal(false);
            setNewExpense({
                title: "",
                amount: "",
                categoryId: "",
                type: "EXPENSE",
                note: "",
                date: new Date().toISOString().split('T')[0]
            });
            setEditingExpense(null);
            fetchExpenses();
        } catch (err) {
            console.error("Error saving expense:", err);
            console.error("Response data:", err.response?.data);
            
            const responseData = err.response?.data;
            let message = "Failed to save expense";
            
            // ✅ Extract detailed validation errors from backend
            if (responseData?.data && typeof responseData.data === 'object') {
                // Validation errors are in the data field as a Map
                const errors = responseData.data;
                message = Object.entries(errors)
                    .map(([field, msg]) => `${field}: ${msg}`)
                    .join(", ");
            } else if (responseData?.message) {
                message = responseData.message;
            } else if (responseData?.error) {
                message = responseData.error;
            } else if (typeof responseData === "string") {
                message = responseData;
            }
            
            setError(message);
            toast.error(`Failed to save expense: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Delete this expense?")) return;

        try {
            await api.delete(`/expenses/${id}`);
            toast.success("Expense deleted successfully!");
            fetchExpenses();
        } catch (err) {
            toast.error("Failed to delete expense");
        }
    };

    const handleEditExpense = (expense) => {
        setNewExpense({
            title: expense.title,
            amount: expense.amount,
            categoryId: expense.categoryId || expense.category?.id || expense.categoryId || "",
            type: expense.type || "EXPENSE",
            note: expense.note || "",
            date: expense.date
        });
        setEditingExpense(expense);
        setShowAddModal(true);
    };

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !filterCategory || expense.categoryName === filterCategory || expense.category === filterCategory;
        const matchesDate = !filterDate || expense.date.startsWith(filterDate);
        return matchesSearch && matchesCategory && matchesDate;
    });

    const getStatus = (expense) => {
        if (expense?.status) return expense.status;
        if (parseFloat(expense?.amount || 0) > 500) return "Submitted";
        return "Pending";
    };

    const getStatusClass = (status) => {
        if (status === "Submitted") return "submitted";
        if (status === "Pending") return "pending";
        return "draft";
    };

    const categoryOptions = categories.length > 0 ? categories : [
        { id: 0, name: "⏳ Loading categories..." },
    ];

    const totalAmount = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Expenses</p>
                        <h1>Expense ledger</h1>
                        <p>Review your expense rows in a cleaner table-style layout that uses your blue accent palette.</p>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                        <button className="primary-btn" onClick={() => setShowAddModal(true)}><FaPlus /> New expense</button>
                        <button className="secondary-btn" onClick={() => exportToCSV(expenses, `expenses-${new Date().toISOString().split('T')[0]}.csv`)}><FaDownload /> Export</button>
                    </div>
                </div>

                <div className="panel-card" style={{ marginBottom: "24px" }}>
                    <div className="expense-filters">
                        <div className="filter-item">
                            <FaSearch style={{ marginRight: "8px" }} />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
                            />
                        </div>
                        <div className="filter-item">
                            <FaFilter style={{ marginRight: "8px" }} />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
                            >
                                <option value="">All Categories</option>
                                {categoryOptions.map((cat) => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-item">
                            <input
                                type="month"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
                            />
                        </div>
                    </div>
                    <div className="panel-header">
                        <div>
                            <h2 style={{ margin: 0 }}>Overview</h2>
                            <p style={{ margin: 0, color: "#9ca3af", fontSize: "0.95rem" }}>Total expenses across all records</p>
                        </div>
                        <span className="mini-pill">₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>

                <div className="table-card panel-card">
                    <div className="table-row table-header">
                        <div>Details</div>
                        <div>Category</div>
                        <div>Amount</div>
                        <div>Date</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>

                    {filteredExpenses.length > 0 ? (
                        filteredExpenses.map((expense) => {
                            const status = getStatus(expense);
                            return (
                                <div key={expense.id} className="table-row" style={{ paddingTop: "16px", paddingBottom: "16px" }}>
                                    <div className="details-col">
                                        <h4>{expense.title}</h4>
                                        <p>{expense.note || expense.merchant || expense.categoryName || "Unknown details"}</p>
                                    </div>
                                    <div>{expense.categoryName || "General"}</div>
                                    <div>₹{parseFloat(expense.amount || 0).toLocaleString()}</div>
                                    <div>{new Date(expense.date).toLocaleDateString()}</div>
                                    <div className={
                                        `status-pill ${getStatusClass(status)}`
                                    }>{status}</div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            className="secondary-btn"
                                            style={{ width: "auto", padding: "6px 10px", marginTop: 0 }}
                                            onClick={() => handleEditExpense(expense)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary-btn"
                                            style={{ width: "auto", padding: "6px 10px", marginTop: 0 }}
                                            onClick={() => handleDeleteExpense(expense.id)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
                            <FaReceipt size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
                            <h3>No expenses found</h3>
                            <p>Start tracking your expenses by adding your first one.</p>
                            <button className="primary-btn" onClick={() => setShowAddModal(true)} style={{ marginTop: "16px" }}>
                                <FaPlus /> Add your first expense
                            </button>
                        </div>
                    )}
                </div>

                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingExpense ? "Edit expense" : "New expense"}</h2>
                                <button className="close-button" onClick={() => setShowAddModal(false)}>×</button>
                            </div>

                            {error && <div style={{ color: "red", marginBottom: "16px" }}>{error}</div>}

                            <form onSubmit={handleAddExpense}>
                                <div className="form-group">
                                    <label>Subject</label>
                                    <input
                                        type="text"
                                        value={newExpense.title}
                                        onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                                        placeholder="Expense subject"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newExpense.amount}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        placeholder="Enter amount"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={newExpense.categoryId}
                                        onChange={(e) => setNewExpense({ ...newExpense, categoryId: e.target.value })}
                                        disabled={categories.length === 0}
                                        required
                                    >
                                        <option value="">{categories.length === 0 ? "Loading categories..." : "Select category"}</option>
                                        {categoryOptions.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {categories.length === 0 && <p style={{color: "#9ca3af", fontSize: "0.85rem", marginTop: "4px"}}>⏳ Fetching categories from server...</p>}
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={newExpense.type}
                                        onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                                        required
                                    >
                                        <option value="EXPENSE">Expense</option>
                                        <option value="INCOME">Income</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Note</label>
                                    <input
                                        type="text"
                                        value={newExpense.note}
                                        onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                                        placeholder="Optional note"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={newExpense.date}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading || categories.length === 0} className="primary-btn">
                                    {categories.length === 0 ? "Loading categories..." : (loading ? "Saving..." : (editingExpense ? "Update" : "Save"))}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
} 