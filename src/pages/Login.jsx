import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaSpinner } from "react-icons/fa";
import { decodeToken, getCurrentRole } from "../utils/tokenUtils";
import "../styles/Auth.css";

export default function Login() {
    const [credentials, setCredentials] = useState({
        username: "",
        password: ""
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    // Load saved credentials if "Remember Me" was checked
    useState(() => {
        const saved = localStorage.getItem("savedCredentials");
        if (saved) {
            const { username, rememberMe: wasRemembered } = JSON.parse(saved);
            if (wasRemembered) {
                setCredentials(prev => ({ ...prev, username }));
                setRememberMe(true);
            }
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        if (!credentials.username || !credentials.password) {
            setError("Please fill in all fields");
            toast.error("Please fill in all fields");
            return;
        }

        try {
            setLoading(true);
            const res = await api.post("/auth/login", credentials);
            const token = res.data?.token;

            if (!token) throw new Error("Token not received");

            // 🔥 Store token and decode it to extract role
            localStorage.setItem("token", token);
            
            // Decode token to get role
            const decoded = decodeToken(token);
            const userRole = decoded?.role;
            
            const userData = {
                userId: res.data?.userId,
                username: res.data?.username,
                email: res.data?.email,
                role: userRole,
                name: res.data?.name
            };
            localStorage.setItem("user", JSON.stringify(userData));

            // Save credentials if "Remember Me" is checked
            if (rememberMe) {
                localStorage.setItem("savedCredentials", JSON.stringify({
                    username: credentials.username,
                    rememberMe: true
                }));
            } else {
                localStorage.removeItem("savedCredentials");
            }

            toast.success("Login successful! Welcome back!");
            
            // 🔥 Redirect based on role from JWT
            if (userRole === "ADMIN") {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid username or password";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                {/* Left Section - Illustration */}
                <div className="auth-illustration">
                    <div className="illustration-content">
                        <div className="icon-large" style={{ fontSize: "120px", marginBottom: "20px" }}>
                            💳
                        </div>
                        <h1>Welcome Back</h1>
                        <p>Track your expenses with ease and take control of your finances</p>
                        <div className="feature-list">
                            <div className="feature-item">✓ Real-time expense tracking</div>
                            <div className="feature-item">✓ Smart budgeting tools</div>
                            <div className="feature-item">✓ Detailed analytics</div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Login Form */}
                <div className="auth-form-container">
                    <div className="auth-card">
                        <h2>Login</h2>
                        <p className="auth-subtitle">Sign in to your account</p>

                        {error && <div className="error-banner">{error}</div>}

                        <form onSubmit={handleLogin}>
                            {/* Username */}
                            <div className="form-group">
                                <label>Username or Email</label>
                                <div className="input-wrapper">
                                    <FaEnvelope className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Enter your username"
                                        value={credentials.username}
                                        onChange={(e) =>
                                            setCredentials({ ...credentials, username: e.target.value })
                                        }
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-wrapper">
                                    <FaLock className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={credentials.password}
                                        onChange={(e) =>
                                            setCredentials({ ...credentials, password: e.target.value })
                                        }
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="form-options">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) => setRememberMe(e.target.checked)}
                                    />
                                    <span>Remember me</span>
                                </label>
                                <Link to="/forgot-password" className="forgot-link">
                                    Forgot password?
                                </Link>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="auth-button primary"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="spinner" /> Logging in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>

                        {/* Register Link */}
                        <p className="auth-footer">
                            Don't have an account?{" "}
                            <Link to="/register" className="auth-link">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}