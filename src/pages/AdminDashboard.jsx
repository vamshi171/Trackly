import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaUsers, FaChartBar, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.get("/admin/analytics");
            setAnalytics(res.data.data);
        } catch (err) {
            console.error("Error fetching analytics:", err);
            if (err.response?.status === 403) {
                toast.error("Access denied. Admin privileges required.");
                navigate("/dashboard");
            } else {
                toast.error("Failed to load analytics");
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Layout><div className="dashboard-container"><p>Loading admin dashboard...</p></div></Layout>;
    }

    const adminMenuItems = [
        { label: "Users", icon: "👥", description: "Manage all system users", action: () => navigate("/admin/users"), count: analytics?.totalUsers },
        { label: "All Expenses", icon: "💰", description: "View system-wide expenses", action: () => navigate("/admin/expenses"), count: analytics?.totalExpenses },
    ];

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Administration</p>
                        <h1>Admin Dashboard</h1>
                        <p>System overview and quick access to admin features.</p>
                    </div>
                </div>

                {/* System Analytics Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "32px" }}>
                    <div className="panel-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <FaUsers style={{ fontSize: "24px", color: "#3b82f6" }} />
                            <h3 style={{ margin: 0, fontSize: "14px", color: "#999" }}>Total Users</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#fff" }}>
                            {analytics?.totalUsers || 0}
                        </p>
                        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Registered users</p>
                    </div>

                    <div className="panel-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <FaChartBar style={{ fontSize: "24px", color: "#10b981" }} />
                            <h3 style={{ margin: 0, fontSize: "14px", color: "#999" }}>Total Expenses</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#fff" }}>
                            {analytics?.totalExpenses || 0}
                        </p>
                        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>System-wide entries</p>
                    </div>

                    <div className="panel-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <FaChartBar style={{ fontSize: "24px", color: "#f59e0b" }} />
                            <h3 style={{ margin: 0, fontSize: "14px", color: "#999" }}>Total Amount</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#fff" }}>
                            ₹{(analytics?.totalAmount || 0).toLocaleString()}
                        </p>
                        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>All expenses</p>
                    </div>

                    <div className="panel-card">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                            <FaChartBar style={{ fontSize: "24px", color: "#8b5cf6" }} />
                            <h3 style={{ margin: 0, fontSize: "14px", color: "#999" }}>Avg per User</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#fff" }}>
                            ₹{(analytics?.averageExpensePerUser || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#666" }}>Per user</p>
                    </div>
                </div>

                {/* Quick Access Menu */}
                <div style={{ marginBottom: "32px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "16px", color: "#f8fafc" }}>Quick Access</h2>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
                        {adminMenuItems.map((item, idx) => (
                            <div
                                key={idx}
                                className="panel-card"
                                onClick={item.action}
                                style={{
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "space-between"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#1e293b";
                                    e.currentTarget.style.borderColor = "#0ea5e9";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "";
                                    e.currentTarget.style.borderColor = "";
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>{item.icon}</div>
                                    <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "600", color: "#f8fafc" }}>
                                        {item.label}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
                                        {item.description}
                                    </p>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
                                    <span style={{ fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>
                                        {item.count || 0}
                                    </span>
                                    <FaArrowRight style={{ color: "#3b82f6", fontSize: "18px" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Info */}
                <div className="panel-card">
                    <h3 style={{ marginBottom: "16px" }}>System Information</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div>
                            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>Users</p>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}>
                                {analytics?.totalUsers || 0}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>Total Transactions</p>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#10b981" }}>
                                {analytics?.totalExpenses || 0}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#666" }}>System-wide Total</p>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: "bold", color: "#f59e0b" }}>
                                ₹{(analytics?.totalAmount || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #333" }}>
                        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                            Access the menu above to manage users, view all expenses, and monitor system activity.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
