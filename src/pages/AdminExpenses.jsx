import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaChartBar, FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AdminExpenses() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("ALL");
    const navigate = useNavigate();

    const PAGE_SIZE = 20;

    useEffect(() => {
        fetchExpenses();
    }, [page]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/expenses?page=${page}&size=${PAGE_SIZE}`);
            
            const expensesData = res.data?.data?.content || [];
            const totalPages = res.data?.data?.totalPages || 1;
            
            setExpenses(expensesData);
            setTotalPages(totalPages);
        } catch (err) {
            console.error("Error fetching expenses:", err);
            if (err.response?.status === 403) {
                toast.error("Access denied. Admin privileges required.");
                navigate("/dashboard");
            } else {
                toast.error("Failed to load expenses");
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = 
            exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.user?.username?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === "ALL" || exp.type === filterType;
        
        return matchesSearch && matchesType;
    });

    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const expenseAmount = filteredExpenses
        .filter(e => e.type !== "INCOME" && e.type !== "income")
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const incomeAmount = filteredExpenses
        .filter(e => e.type === "INCOME" || e.type === "income")
        .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    if (loading) {
        return <Layout><div className="dashboard-container"><p>Loading expenses...</p></div></Layout>;
    }

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Administration</p>
                        <h1>All Expenses</h1>
                        <p>View all system-wide expenses across all users.</p>
                    </div>
                    <button className="secondary-btn" onClick={() => navigate("/admin")}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                </div>

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Total Income</h3>
                        <p style={{ fontSize: "24px", fontWeight: "bold", color: "#10b981", margin: 0 }}>
                            ₹{incomeAmount.toLocaleString()}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Total Expenses</h3>
                        <p style={{ fontSize: "24px", fontWeight: "bold", color: "#ef4444", margin: 0 }}>
                            ₹{expenseAmount.toLocaleString()}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Net</h3>
                        <p style={{ fontSize: "24px", fontWeight: "bold", color: incomeAmount - expenseAmount >= 0 ? "#10b981" : "#ef4444", margin: 0 }}>
                            ₹{(incomeAmount - expenseAmount).toLocaleString()}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Total Count</h3>
                        <p style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6", margin: 0 }}>
                            {filteredExpenses.length}
                        </p>
                    </div>
                </div>

                {/* Search & Filters */}
                <div className="panel-card" style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "12px", flex: 1, minWidth: "300px", alignItems: "center" }}>
                            <FaSearch style={{ color: "#666" }} />
                            <input
                                type="text"
                                placeholder="Search by expense title, category, or username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "10px 12px",
                                    borderRadius: "6px",
                                    border: "1px solid #333",
                                    backgroundColor: "#1e293b",
                                    color: "#fff",
                                    fontSize: "14px"
                                }}
                            />
                        </div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{
                                padding: "10px 12px",
                                borderRadius: "6px",
                                border: "1px solid #333",
                                backgroundColor: "#1e293b",
                                color: "#fff",
                                fontSize: "14px",
                                cursor: "pointer"
                            }}
                        >
                            <option value="ALL">All Types</option>
                            <option value="EXPENSE">Expenses Only</option>
                            <option value="INCOME">Income Only</option>
                        </select>
                    </div>
                </div>

                {/* Expenses Table */}
                <div className="panel-card">
                    {filteredExpenses.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid #333" }}>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>Date</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>Title</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>User</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>Category</th>
                                        <th style={{ textAlign: "right", padding: "12px", color: "#999", fontWeight: "600" }}>Amount</th>
                                        <th style={{ textAlign: "center", padding: "12px", color: "#999", fontWeight: "600" }}>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.map((exp, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #222" }}>
                                            <td style={{ padding: "12px", color: "#aaa", fontSize: "14px" }}>
                                                {new Date(exp.date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "12px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {exp.title}
                                            </td>
                                            <td style={{ padding: "12px", color: "#3b82f6" }}>
                                                {exp.user?.username || "Unknown"}
                                            </td>
                                            <td style={{ padding: "12px", color: "#aaa", fontSize: "14px" }}>
                                                {exp.categoryName || exp.category?.name || "-"}
                                            </td>
                                            <td style={{
                                                textAlign: "right",
                                                padding: "12px",
                                                color: exp.type === "INCOME" || exp.type === "income" ? "#10b981" : "#ef4444",
                                                fontWeight: "600"
                                            }}>
                                                {exp.type === "INCOME" || exp.type === "income" ? "+" : "-"}₹{parseFloat(exp.amount || 0).toLocaleString()}
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center" }}>
                                                <span style={{
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    fontSize: "12px",
                                                    backgroundColor: exp.type === "INCOME" || exp.type === "income" ? "#1e3a1f" : "#3a1f1f",
                                                    color: exp.type === "INCOME" || exp.type === "income" ? "#10b981" : "#ef4444"
                                                }}>
                                                    {exp.type === "INCOME" || exp.type === "income" ? "💰 Income" : "💸 Expense"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
                            {searchTerm || filterType !== "ALL" ? "No expenses match your filters" : "No expenses found"}
                        </p>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "20px" }}>
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            className="secondary-btn primary-color-btn"
                            style={{ opacity: page === 0 ? 0.5 : 1 }}
                        >
                            Previous
                        </button>
                        <span style={{ color: "#666", alignSelf: "center" }}>
                            Page {page + 1} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page === totalPages - 1}
                            className="secondary-btn primary-color-btn"
                            style={{ opacity: page === totalPages - 1 ? 0.5 : 1 }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
