import { NavLink, useNavigate } from "react-router-dom";
import { IoBarChart, IoCash, IoFolder, IoLogOut, IoWallet, IoSettingsSharp, IoShieldCheckmark } from "react-icons/io5";
import { FaChartLine, FaChevronDown, FaUsers, FaList } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Sidebar() {

    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);
    const [adminMenuOpen, setAdminMenuOpen] = useState(true);

    useEffect(() => {
        fetchUserRole();
    }, []);

    const fetchUserRole = async () => {
        try {
            const res = await api.get("/users/me");
            setUserRole(res.data.data?.role);
        } catch (err) {
            console.error("Error fetching user role:", err);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    return (
        <div className="sidebar">

            <h3 className="sidebar-brand"><IoWallet className="sidebar-logo" /> ExpenseTracker</h3>

            <nav>

                {/* USER SECTION */}
                {userRole !== "ADMIN" && (
                    <>
                        <div style={{ color: "#666", fontSize: "12px", padding: "12px", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600" }}>
                            Dashboard
                        </div>

                        <NavLink to="/dashboard" className="nav-item">
                            <IoBarChart className="nav-icon" /> Dashboard
                        </NavLink>

                        <NavLink to="/expenses" className="nav-item">
                            <IoCash className="nav-icon" /> Expenses
                        </NavLink>

                        <NavLink to="/categories" className="nav-item">
                            <IoFolder className="nav-icon" /> Categories
                        </NavLink>

                        <NavLink to="/reports" className="nav-item">
                            <FaChartLine className="nav-icon" /> Reports
                        </NavLink>

                        <NavLink to="/budget" className="nav-item">
                            <FaChartLine className="nav-icon" /> Budget
                        </NavLink>

                        <NavLink to="/settings" className="nav-item">
                            <IoSettingsSharp className="nav-icon" /> Settings
                        </NavLink>
                    </>
                )}

                {/* ADMIN SECTION */}
                {userRole === "ADMIN" && (
                    <>
                        <div style={{ color: "#666", fontSize: "12px", padding: "12px", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600" }}>
                            Administration
                        </div>

                        <NavLink to="/admin" className="nav-item">
                            <IoShieldCheckmark className="nav-icon" /> Dashboard
                        </NavLink>

                        <NavLink to="/admin/users" className="nav-item">
                            <FaUsers className="nav-icon" /> Users
                        </NavLink>

                        <NavLink to="/admin/expenses" className="nav-item">
                            <FaList className="nav-icon" /> All Expenses
                        </NavLink>

                        <NavLink to="/settings" className="nav-item">
                            <IoSettingsSharp className="nav-icon" /> Settings
                        </NavLink>

                        <div style={{ color: "#666", fontSize: "12px", padding: "12px", marginTop: "16px", marginBottom: "8px", textTransform: "uppercase", fontWeight: "600" }}>
                            User Access
                        </div>

                        <NavLink to="/dashboard" className="nav-item" style={{ opacity: 0.7 }}>
                            <IoBarChart className="nav-icon" /> My Dashboard
                        </NavLink>

                        <NavLink to="/expenses" className="nav-item" style={{ opacity: 0.7 }}>
                            <IoCash className="nav-icon" /> My Expenses
                        </NavLink>
                    </>
                )}

            </nav>

            <button className="logout-btn" onClick={logout}>
                <IoLogOut className="nav-icon" /> Logout
            </button>

        </div>
    );
}