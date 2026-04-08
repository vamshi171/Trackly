import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaUsers, FaChartBar, FaCogs, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { logout, getCurrentUsername, getCurrentRole } from "../utils/tokenUtils";
import "../styles/AdminLayout.css";

/**
 * 🔐 Admin Layout Component
 * - Admin-only navigation
 * - Different sidebar from regular users
 * - Admin-specific menu items
 */
export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const navigate = useNavigate();
    const username = getCurrentUsername();
    const role = getCurrentRole();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="admin-layout">
            {/* Admin Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? "open" : "closed"}`}>
                <div className="admin-brand">
                    <div className="brand-icon">⚙️</div>
                    <span className="brand-text">Admin Panel</span>
                </div>

                <nav className="admin-nav">
                    <div className="nav-section">
                        <h5 className="nav-title">DASHBOARD</h5>
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate("/admin"); }}
                            className="nav-link"
                        >
                            <FaHome /> Dashboard
                        </a>
                    </div>

                    <div className="nav-section">
                        <h5 className="nav-title">MANAGEMENT</h5>
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate("/admin/users"); }}
                            className="nav-link"
                        >
                            <FaUsers /> Users
                        </a>
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate("/admin/expenses"); }}
                            className="nav-link"
                        >
                            <FaChartBar /> All Expenses
                        </a>
                    </div>

                    <div className="nav-section">
                        <h5 className="nav-title">ANALYTICS</h5>
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate("/admin/analytics"); }}
                            className="nav-link"
                        >
                            <FaChartBar /> System Analytics
                        </a>
                    </div>

                    <div className="nav-section">
                        <h5 className="nav-title">SYSTEM</h5>
                        <a 
                            href="#" 
                            onClick={(e) => { e.preventDefault(); navigate("/admin/settings"); }}
                            className="nav-link"
                        >
                            <FaCogs /> Settings
                        </a>
                    </div>
                </nav>

                <div className="admin-footer">
                    <div className="user-info">
                        <div className="user-avatar">👤</div>
                        <div className="user-details">
                            <p className="user-name">{username}</p>
                            <p className="user-role">{role}</p>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout} title="Logout">
                        <FaSignOutAlt />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main">
                {/* Admin Header */}
                <header className="admin-header">
                    <button 
                        className="toggle-sidebar"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                    <h1>Admin Dashboard</h1>
                    <div className="header-actions">
                        <span className="admin-badge">🔒 ADMIN</span>
                    </div>
                </header>

                {/* Content Area */}
                <main className="admin-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
