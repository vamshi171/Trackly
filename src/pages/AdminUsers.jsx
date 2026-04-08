import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaUsers, FaTrash, FaArrowLeft, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    const PAGE_SIZE = 10;

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/users?page=${page}&size=${PAGE_SIZE}`);
            
            const usersData = res.data?.data?.content || [];
            const totalPages = res.data?.data?.totalPages || 1;
            
            setUsers(usersData);
            setTotalPages(totalPages);
        } catch (err) {
            console.error("Error fetching users:", err);
            if (err.response?.status === 403) {
                toast.error("Access denied. Admin privileges required.");
                navigate("/dashboard");
            } else {
                toast.error("Failed to load users");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Delete user "${username}"? This will remove all their data and cannot be undone.`)) {
            try {
                await api.delete(`/admin/users/${userId}`);
                toast.success(`User "${username}" deleted successfully`);
                setUsers(users.filter(u => u.id !== userId));
                if (users.length === 1 && page > 0) {
                    setPage(page - 1);
                }
            } catch (err) {
                console.error("Error deleting user:", err);
                toast.error(err.response?.data?.message || "Failed to delete user");
            }
        }
    };

    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <Layout><div className="dashboard-container"><p>Loading users...</p></div></Layout>;
    }

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Administration</p>
                        <h1>User Management</h1>
                        <p>View and manage all users in the system.</p>
                    </div>
                    <button className="secondary-btn" onClick={() => navigate("/admin")}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                </div>

                {/* Search Bar */}
                <div className="panel-card" style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <FaSearch style={{ color: "#666" }} />
                        <input
                            type="text"
                            placeholder="Search by username, email, or name..."
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
                        <span style={{ color: "#666", fontSize: "14px" }}>
                            Total: {users.length}
                        </span>
                    </div>
                </div>

                {/* Users Table */}
                <div className="panel-card">
                    {filteredUsers.length > 0 ? (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "2px solid #333" }}>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>ID</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>Name</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>Username</th>
                                        <th style={{ textAlign: "left", padding: "12px", color: "#999", fontWeight: "600" }}>Email</th>
                                        <th style={{ textAlign: "center", padding: "12px", color: "#999", fontWeight: "600" }}>Role</th>
                                        <th style={{ textAlign: "center", padding: "12px", color: "#999", fontWeight: "600" }}>Joined</th>
                                        <th style={{ textAlign: "center", padding: "12px", color: "#999", fontWeight: "600" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user, idx) => (
                                        <tr key={idx} style={{ borderBottom: "1px solid #222", hover: "backgroundColor: #1e293b" }}>
                                            <td style={{ padding: "12px", color: "#aaa", fontSize: "14px" }}>{user.id}</td>
                                            <td style={{ padding: "12px" }}>{user.name || "-"}</td>
                                            <td style={{ padding: "12px", color: "#3b82f6" }}>{user.username}</td>
                                            <td style={{ padding: "12px", color: "#aaa", fontSize: "14px" }}>{user.email}</td>
                                            <td style={{ padding: "12px", textAlign: "center" }}>
                                                <span style={{
                                                    padding: "4px 12px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    backgroundColor: user.role === "ADMIN" ? "#1e3a1f" : "#1e293b",
                                                    color: user.role === "ADMIN" ? "#10b981" : "#94a3b8"
                                                }}>
                                                    {user.role === "ADMIN" ? "👑 ADMIN" : "👤 USER"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center" }}>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "4px",
                                                        border: "none",
                                                        backgroundColor: "#7f1d1d",
                                                        color: "#fca5a5",
                                                        cursor: "pointer",
                                                        fontSize: "12px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px"
                                                    }}
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ color: "#666", textAlign: "center", padding: "20px" }}>
                            {searchTerm ? `No users match "${searchTerm}"` : "No users found"}
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
