import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FaDownload, FaMoon, FaSun } from "react-icons/fa";
import { IoAddCircle, IoFolderSharp, IoAnalytics, IoSettingsSharp } from "react-icons/io5";
import { useTheme } from "../context/ThemeContext";
import { exportToCSV, getMonthlyAnalytics, getCategoryBreakdown, getIncomeExpenseSummary } from "../utils/analyticsHelper";
import Layout from "../components/Layout";
import api from "../api/axios";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const { isDark, toggleTheme } = useTheme();
    const [stats, setStats] = useState({
        totalExpenses: 0,
        totalIncome: 0,
        monthlyExpenses: 0,
        categoriesCount: 0,
        recentExpenses: [],
        allExpenses: []
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [incomeExpenseData, setIncomeExpenseData] = useState([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const [expensesRes, categoriesRes] = await Promise.all([
                    api.get("/expenses"),
                    api.get("/categories")
                ]);

                // Handle Page object response from backend
                let expenses = [];
                if (expensesRes.data.data?.content) {
                    // Backend returns Page<ExpenseDTO> with content array
                    expenses = expensesRes.data.data.content;
                } else if (Array.isArray(expensesRes.data.data)) {
                    // Direct array response
                    expenses = expensesRes.data.data;
                }
                
                const categories = Array.isArray(categoriesRes.data.data) ? categoriesRes.data.data : [];

                // Normalize expenses
                const normalized = expenses.map((exp) => ({
                    ...exp,
                    categoryName: exp.categoryName || exp.category?.name || exp.category || "General"
                }));

                const totalExpenses = normalized
                    .filter((exp) => exp.type !== "INCOME" && exp.type !== "income")
                    .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

                const totalIncome = normalized
                    .filter((exp) => exp.type === "INCOME" || exp.type === "income")
                    .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const monthlyExpenses = normalized
                    .filter((exp) => {
                        const expDate = new Date(exp.date);
                        return (
                            expDate.getMonth() === currentMonth &&
                            expDate.getFullYear() === currentYear &&
                            exp.type !== "INCOME" &&
                            exp.type !== "income"
                        );
                    })
                    .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

                const recentExpenses = normalized
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);

                // Calculate analytics
                const monthly = getMonthlyAnalytics(normalized);
                const categories_breakdown = getCategoryBreakdown(normalized);
                const incomeExpense = [
                    { name: "Income", value: totalIncome },
                    { name: "Expense", value: totalExpenses }
                ];

                setStats({
                    totalExpenses,
                    totalIncome,
                    monthlyExpenses,
                    categoriesCount: categories.length,
                    recentExpenses,
                    allExpenses: normalized
                });
                setMonthlyData(monthly);
                setCategoryData(categories_breakdown);
                setIncomeExpenseData(incomeExpense);
            } catch (err) {
                toast.error("Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, []);

const taskItems = [
    { label: "Total income", value: `₹${stats.totalIncome.toLocaleString()}` },
    { label: "Total expenses", value: `₹${stats.totalExpenses.toLocaleString()}` },
    { label: "Net balance", value: `₹${(stats.totalIncome - stats.totalExpenses).toLocaleString()}` },
    { label: "Categories", value: stats.categoriesCount },
    { label: "This month", value: `₹${stats.monthlyExpenses.toLocaleString()}` }
];

const handleExportCSV = () => {
    exportToCSV(stats.allExpenses, `expenses-${new Date().toISOString().split('T')[0]}.csv`);
};

if (loading) return <div>Loading...</div>;
return (
    <Layout>
        <div className="dashboard-container">
            <div className="page-head">
                <div>
                    <p className="eyebrow">Dashboard</p>
                    <h1>Track spending with analytics</h1>
                    <p>Monitor income, expenses, and trends with real-time charts and insights.</p>
                </div>
                <button className="primary-btn" onClick={toggleTheme} title="Toggle theme">
                    {isDark ? <FaSun /> : <FaMoon />} Theme
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Income</h3>
                    <p>₹{stats.totalIncome.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Expenses</h3>
                    <p>₹{stats.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="stat-card">
                    <h3>Net Balance</h3>
                    <p style={{ color: stats.totalIncome - stats.totalExpenses >= 0 ? "#10b981" : "#ef4444" }}>
                        ₹{(stats.totalIncome - stats.totalExpenses).toLocaleString()}
                    </p>
                </div>
                <div className="stat-card">
                    <h3>This Month</h3>
                    <p>₹{stats.monthlyExpenses.toLocaleString()}</p>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h2>Income vs Expenses</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeExpenseData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                            <XAxis dataKey="name" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip contentStyle={{ backgroundColor: "rgba(8, 16, 40, 0.95)", border: "1px solid rgba(59, 130, 246, 0.3)" }} />
                            <Bar dataKey="value" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h2>Top Categories</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ₹${entry.value.toLocaleString()}`}
                                outerRadius={80}
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
                </div>
            </div>

            <div className="chart-card full-width">
                <h2>Monthly Trends (Last 12 Months)</h2>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.1)" />
                        <XAxis dataKey="month" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(8, 16, 40, 0.95)", border: "1px solid rgba(59, 130, 246, 0.3)" }} />
                        <Legend />
                        <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                        <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Expense" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="panel-grid">
                <section className="panel-card">
                    <div className="panel-header">
                        <h2>Quick Stats</h2>
                        <button className="secondary-btn" onClick={handleExportCSV} title="Export to CSV">
                            <FaDownload /> Export
                        </button>
                    </div>
                    <ul className="task-list">
                        {taskItems.map((item) => (
                            <li key={item.label}>
                                <strong>{item.label}</strong>
                                <span>{item.value}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="panel-card">
                    <div className="panel-header">
                        <h2>Recent entries</h2>
                        <button className="secondary-btn" onClick={() => navigate("/expenses")}>All expenses</button>
                    </div>
                    {stats.recentExpenses.length > 0 ? (
                        stats.recentExpenses.map((expense) => (
                            <div key={expense.id} className="table-row" style={{ padding: "18px 0", borderBottom: "1px solid rgba(148, 163, 184, 0.12)" }}>
                                <div className="details-col">
                                    <h4>{expense.title}</h4>
                                    <p>{new Date(expense.date).toLocaleDateString()}</p>
                                </div>
                                <div>{expense.categoryName}</div>
                                <div>₹{parseFloat(expense.amount || 0).toLocaleString()}</div>
                                <div className={`status-pill ${expense.type === "INCOME" ? "submitted" : "pending"}`}>
                                    {expense.type === "INCOME" ? "Income" : "Expense"}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ color: "#94a3b8", padding: "30px 0" }}>No recent entries yet.</div>
                    )}
                </section>
            </div>

            <div className="quick-actions">
                <div className="quick-card" onClick={() => navigate("/expenses")}>
                    <IoAddCircle className="quick-icon" />
                    <h3>New expense</h3>
                    <p>Create a fresh entry in seconds.</p>
                </div>
                <div className="quick-card" onClick={() => navigate("/categories")}>
                    <IoFolderSharp className="quick-icon" />
                    <h3>Categories</h3>
                    <p>Organize spending by category.</p>
                </div>
                <div className="quick-card" onClick={() => navigate("/reports")}>
                    <IoAnalytics className="quick-icon" />
                    <h3>Reports</h3>
                    <p>Review monthly totals and budgets.</p>
                </div>
                <div className="quick-card" onClick={() => navigate("/settings")}>
                    <IoSettingsSharp className="quick-icon" />
                    <h3>Settings</h3>
                    <p>Manage app preferences and theme.</p>
                </div>
            </div>
        </div>
    </Layout>
);
}