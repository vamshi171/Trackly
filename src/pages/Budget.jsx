import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaWallet, FaPlus, FaTrash, FaExclamationTriangle } from "react-icons/fa";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Budget() {
    const [budgets, setBudgets] = useState([]);
    const [budgetStatus, setBudgetStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newBudget, setNewBudget] = useState({
        monthYear: "",
        amount: ""
    });

    useEffect(() => {
        fetchBudgets();
    }, []);

    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    };

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const res = await api.get("/budgets");
            setBudgets(res.data.data || []);
            
            // Fetch status for each budget
            for (const budget of res.data.data) {
                try {
                    const statusRes = await api.get(`/budgets/${budget.monthYear}/status`);
                    setBudgetStatus(prev => ({
                        ...prev,
                        [budget.monthYear]: statusRes.data.data
                    }));
                } catch (err) {
                    console.error("Error fetching budget status:", err);
                }
            }
        } catch (err) {
            console.error("Error fetching budgets:", err);
            toast.error("Failed to load budgets");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBudget = async (e) => {
        e.preventDefault();
        
        if (!newBudget.monthYear || !newBudget.amount) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            await api.post("/budgets", {
                monthYear: newBudget.monthYear,
                amount: newBudget.amount
            });
            
            toast.success("Budget created successfully!");
            setNewBudget({ monthYear: "", amount: "" });
            setShowAddModal(false);
            fetchBudgets();
        } catch (err) {
            console.error("Error creating budget:", err);
            toast.error(err.response?.data?.message || "Failed to create budget");
        }
    };

    const handleDeleteBudget = async (budgetId) => {
        if (window.confirm("Delete this budget?")) {
            try {
                await api.delete(`/budgets/${budgetId}`);
                toast.success("Budget deleted successfully");
                fetchBudgets();
            } catch (err) {
                console.error("Error deleting budget:", err);
                toast.error("Failed to delete budget");
            }
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage > 100) return "#ff6b6b";
        if (percentage > 80) return "#f59e0b";
        return "#10b981";
    };

    if (loading) {
        return <Layout><div className="dashboard-container"><p>Loading budgets...</p></div></Layout>;
    }

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Budgets</p>
                        <h1>Monthly Budget Management</h1>
                        <p>Set and monitor your monthly spending limits.</p>
                    </div>
                    <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                        <FaPlus /> New Budget
                    </button>
                </div>

                {/* Add Budget Modal */}
                {showAddModal && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000
                    }}>
                        <div className="panel-card" style={{ width: "90%", maxWidth: "500px" }}>
                            <h2 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                                <FaWallet /> Set Budget
                            </h2>

                            <form onSubmit={handleAddBudget} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                <div>
                                    <label>Month Year</label>
                                    <input
                                        type="month"
                                        value={newBudget.monthYear}
                                        onChange={(e) => setNewBudget({ ...newBudget, monthYear: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label>Budget Amount ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={newBudget.amount}
                                        onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                                        style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" }}
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div style={{ display: "flex", gap: "12px" }}>
                                    <button type="submit" className="primary-btn">Create Budget</button>
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Budgets Grid */}
                {budgets.length === 0 ? (
                    <div className="panel-card" style={{ textAlign: "center", padding: "40px" }}>
                        <FaWallet style={{ fontSize: "48px", color: "#999", marginBottom: "16px" }} />
                        <p style={{ color: "#999", marginBottom: "16px" }}>No budgets set yet.</p>
                        <button className="primary-btn" onClick={() => setShowAddModal(true)}>
                            <FaPlus /> Create Your First Budget
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" }}>
                        {budgets.map((budget) => {
                            const status = budgetStatus[budget.monthYear];
                            const percentage = status?.percentage ? parseFloat(status.percentage) : 0;
                            const isExceeded = status?.exceeded || false;

                            return (
                                <div
                                    key={budget.id}
                                    className="panel-card"
                                    style={{
                                        borderColor: isExceeded ? "#ff6b6b" : undefined,
                                        backgroundColor: isExceeded ? "#1a0a0a" : undefined
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: "12px", color: "#999" }}>
                                                {new Date(budget.monthYear + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                            </p>
                                            <h3 style={{ margin: "4px 0 0 0", fontSize: "20px" }}>
                                                ${budget.amount}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteBudget(budget.id)}
                                            style={{
                                                backgroundColor: "transparent",
                                                border: "none",
                                                color: "#ff6b6b",
                                                cursor: "pointer",
                                                fontSize: "16px"
                                            }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>

                                    {status ? (
                                        <>
                                            {isExceeded && (
                                                <div style={{
                                                    backgroundColor: "#ff6b6b20",
                                                    border: "1px solid #ff6b6b",
                                                    padding: "8px 12px",
                                                    borderRadius: "4px",
                                                    marginBottom: "12px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    fontSize: "12px",
                                                    color: "#ff6b6b"
                                                }}>
                                                    <FaExclamationTriangle /> Budget exceeded!
                                                </div>
                                            )}

                                            <div style={{ marginBottom: "12px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                                                    <span>Spent: ${status.totalSpent}</span>
                                                    <span>{percentage.toFixed(0)}%</span>
                                                </div>
                                                <div style={{
                                                    width: "100%",
                                                    height: "8px",
                                                    backgroundColor: "#333",
                                                    borderRadius: "4px",
                                                    overflow: "hidden"
                                                }}>
                                                    <div
                                                        style={{
                                                            width: `${Math.min(percentage, 100)}%`,
                                                            height: "100%",
                                                            backgroundColor: getProgressColor(percentage),
                                                            transition: "width 0.3s ease"
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "12px",
                                                fontSize: "12px",
                                                color: "#999"
                                            }}>
                                                <div>
                                                    <p style={{ margin: 0 }}>Remaining</p>
                                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: isExceeded ? "#ff6b6b" : "#10b981" }}>
                                                        ${status.remaining}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0 }}>Total Budget</p>
                                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#fff" }}>
                                                        ${status.budgetAmount}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ color: "#999", fontSize: "12px" }}>Loading status...</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
}
