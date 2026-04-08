import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FaDownload, FaCalendar } from "react-icons/fa";
import Layout from "../components/Layout";
import api from "../api/axios";
import { getMonthlyAnalytics, getCategoryBreakdown } from "../utils/analyticsHelper";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Reports() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/expenses");
            
            // Handle Page object response from backend
            let expensesData = [];
            if (res.data.data?.content) {
                // Backend returns Page<ExpenseDTO> with content array
                expensesData = res.data.data.content;
            } else if (Array.isArray(res.data.data)) {
                // Direct array response
                expensesData = res.data.data;
            }
            
            // Normalize data
            const normalized = expensesData.map((exp) => ({
                ...exp,
                categoryName: exp.categoryName || exp.category?.name || exp.category || "General",
                amount: parseFloat(exp.amount || 0)
            }));

            setExpenses(normalized);

            // Calculate analytics
            const monthly = getMonthlyAnalytics(normalized);
            const categories = getCategoryBreakdown(normalized);

            setMonthlyData(monthly);
            setCategoryData(categories);
        } catch (err) {
            console.error("Error loading reports:", err);
            toast.error("Failed to load report data");
        } finally {
            setLoading(false);
        }
    };

    const getMonthData = () => {
        return expenses.filter(exp => {
            const expDate = exp.date.slice(0, 7);
            return expDate === selectedMonth;
        });
    };

    const monthExpenses = getMonthData();
    const monthTotal = monthExpenses
        .filter(e => e.type !== "INCOME" && e.type !== "income")
        .reduce((sum, e) => sum + e.amount, 0);
    const monthIncome = monthExpenses
        .filter(e => e.type === "INCOME" || e.type === "income")
        .reduce((sum, e) => sum + e.amount, 0);

    const handleExport = () => {
        const csv = [
            ["Date", "Title", "Category", "Amount", "Type"],
            ...monthExpenses.map(e => [
                e.date,
                e.title,
                e.categoryName,
                e.amount,
                e.type
            ])
        ]
            .map(row => row.join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `report-${selectedMonth}.csv`;
        a.click();
    };

    if (loading) {
        return <Layout><div className="dashboard-container"><p>Loading reports...</p></div></Layout>;
    }

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Reports</p>
                        <h1>Review your spending trends</h1>
                        <p>Get a clean overview of totals, progress, and budget insights for each month.</p>
                    </div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            style={{
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #444",
                                backgroundColor: "#1e293b",
                                color: "#fff",
                                fontSize: "14px"
                            }}
                        />
                        <button className="primary-btn" onClick={handleExport} title="Export to CSV">
                            <FaDownload /> Export
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Income</h3>
                        <p style={{ fontSize: "28px", fontWeight: "bold", color: "#10b981", margin: 0 }}>
                            ₹{monthIncome.toLocaleString()}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Expenses</h3>
                        <p style={{ fontSize: "28px", fontWeight: "bold", color: "#ef4444", margin: 0 }}>
                            ₹{monthTotal.toLocaleString()}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Net</h3>
                        <p style={{ fontSize: "28px", fontWeight: "bold", color: monthIncome - monthTotal >= 0 ? "#10b981" : "#ef4444", margin: 0 }}>
                            ₹{(monthIncome - monthTotal).toLocaleString()}
                        </p>
                    </div>
                    <div className="stat-card">
                        <h3 style={{ fontSize: "14px", color: "#999", marginBottom: "8px" }}>Transactions</h3>
                        <p style={{ fontSize: "28px", fontWeight: "bold", color: "#3b82f6", margin: 0 }}>
                            {monthExpenses.length}
                        </p>
                    </div>
                </div>

                {/* Charts */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                    {/* 12-Month Trend */}
                    <div className="panel-card">
                        <h3 style={{ marginBottom: "16px" }}>12-Month Trend</h3>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="month" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none" }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ color: "#666" }}>No data available</p>
                        )}
                    </div>

                    {/* Category Breakdown */}
                    <div className="panel-card">
                        <h3 style={{ marginBottom: "16px" }}>Category Breakdown</h3>
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, value }) => `${name}: ₹${value.toLocaleString()}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ color: "#666" }}>No data available</p>
                        )}
                    </div>
                </div>

                {/* Month Details Table */}
                <div className="panel-card">
                    <h3 style={{ marginBottom: "16px" }}>Transactions for {selectedMonth}</h3>
                    {monthExpenses.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid #333" }}>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999" }}>Date</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999" }}>Title</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999" }}>Category</th>
                                        <th style={{ textAlign: "right", padding: "12px", color: "#999" }}>Amount</th>
                                        <th style={{ textAlign: "center", padding: "12px", color: "#999" }}>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthExpenses.map((exp, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #222" }}>
                                            <td style={{ padding: "12px" }}>{exp.date}</td>
                                            <td style={{ padding: "12px" }}>{exp.title}</td>
                                            <td style={{ padding: "12px" }}>{exp.categoryName}</td>
                                            <td style={{ textAlign: "right", padding: "12px", color: exp.type === "INCOME" || exp.type === "income" ? "#10b981" : "#ef4444" }}>
                                                ₹{exp.amount.toLocaleString()}
                                            </td>
                                            <td style={{ textAlign: "center", padding: "12px" }}>
                                                <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", backgroundColor: exp.type === "INCOME" || exp.type === "income" ? "#1e3a1f" : "#3a1f1f", color: exp.type === "INCOME" || exp.type === "income" ? "#10b981" : "#ef4444" }}>
                                                    {exp.type === "INCOME" || exp.type === "income" ? "Income" : "Expense"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: "#666" }}>No transactions for {selectedMonth}</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}
