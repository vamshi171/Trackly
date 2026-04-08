import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaUser, FaLock, FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Layout from "../components/Layout";

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [passwordMode, setPasswordMode] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: ""
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get("/users/me");
            const userData = res.data.data;
            setUser(userData);
            setFormData({
                name: userData.name,
                email: userData.email
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching user profile:", err);
            toast.error("Failed to load profile");
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put("/users/me", formData);
            setUser(res.data.data);
            setEditMode(false);
            toast.success("Profile updated successfully");
        } catch (err) {
            console.error("Error updating profile:", err);
            toast.error("Failed to update profile");
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            await api.post("/users/change-password", {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setPasswordMode(false);
            toast.success("Password changed successfully");
        } catch (err) {
            console.error("Error changing password:", err);
            toast.error(err.response?.data?.message || "Failed to change password");
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
            try {
                await api.delete("/users/me");
                localStorage.removeItem("token");
                toast.success("Account deleted successfully");
                navigate("/login");
            } catch (err) {
                console.error("Error deleting account:", err);
                toast.error("Failed to delete account");
            }
        }
    };

    if (loading) {
        return <Layout><div className="dashboard-container"><p>Loading...</p></div></Layout>;
    }

    return (
        <Layout>
            <div className="dashboard-container">
                <div className="page-head">
                    <div>
                        <p className="eyebrow">Account Settings</p>
                        <h1>Profile & Security</h1>
                        <p>Manage your account information and security settings.</p>
                    </div>
                    <button className="secondary-btn" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Back
                    </button>
                </div>

                {/* Profile Section */}
                <div className="panel-card" style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                            <FaUser /> User Profile
                        </h2>
                        {!editMode && (
                            <button className="primary-btn" onClick={() => setEditMode(true)}>
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {editMode ? (
                        <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" }}
                                    required
                                />
                            </div>
                            <div>
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" }}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="submit" className="primary-btn">Save Changes</button>
                                <button type="button" className="secondary-btn" onClick={() => setEditMode(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div>
                                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#999" }}>Full Name</p>
                                <p style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>{user?.name}</p>
                            </div>
                            <div>
                                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#999" }}>Email</p>
                                <p style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>{user?.email}</p>
                            </div>
                            <div>
                                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#999" }}>Username</p>
                                <p style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>{user?.username}</p>
                            </div>
                            <div>
                                <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#999" }}>Role</p>
                                <p style={{ margin: 0, fontSize: "16px", fontWeight: "500" }}>
                                    <span style={{ 
                                        display: "inline-block", 
                                        padding: "4px 12px", 
                                        borderRadius: "4px",
                                        backgroundColor: user?.role === "ADMIN" ? "#ff6b6b" : "#40c057",
                                        color: "white",
                                        fontSize: "12px"
                                    }}>
                                        {user?.role}
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Security Section */}
                <div className="panel-card" style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                            <FaLock /> Security
                        </h2>
                        {!passwordMode && (
                            <button className="primary-btn" onClick={() => setPasswordMode(true)}>
                                Change Password
                            </button>
                        )}
                    </div>

                    {passwordMode ? (
                        <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.oldPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" }}
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div>
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" }}
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div>
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #444", backgroundColor: "#1a1a1a", color: "#fff" }}
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button type="submit" className="primary-btn">Change Password</button>
                                <button type="button" className="secondary-btn" onClick={() => setPasswordMode(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p>Password is securely stored and encrypted. Click "Change Password" to update it.</p>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="panel-card" style={{ backgroundColor: "#fff3f3", borderColor: "#ffcccc" }}>
                    <h2 style={{ color: "#ff6b6b", marginBottom: "12px" }}>Danger Zone</h2>
                    <p style={{ color: "#666", marginBottom: "16px" }}>
                        Deleting your account will permanently remove all your data. This action cannot be undone.
                    </p>
                    <button 
                        className="primary-btn" 
                        onClick={handleDeleteAccount}
                        style={{ backgroundColor: "#ff6b6b", borderColor: "#ff6b6b" }}
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </Layout>
    );
}
