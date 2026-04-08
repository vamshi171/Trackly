import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaSpinner, FaArrowLeft } from "react-icons/fa";
import OTPInput from "../components/OTPInput";
import { storeOTPSendTime, getOTPTimerText } from "../utils/otpHelper";
import "../styles/Auth.css";

export default function Register() {
    const [step, setStep] = useState("basic"); // basic, otp-verify
    const [form, setForm] = useState({
        name: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: ""
    });
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [requiresOTP, setRequiresOTP] = useState(false);
    const [timerText, setTimerText] = useState("Code expires in 5:00");
    const [canResend, setCanResend] = useState(false);
    const navigate = useNavigate();

    // Update timer display every second
    useEffect(() => {
        if (step !== "otp-verify") return;

        const interval = setInterval(() => {
            const sendTime = parseInt(sessionStorage.getItem(`otp_sent_${form.email}`) || "0");
            if (sendTime) {
                setTimerText(getOTPTimerText(sendTime));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [step, form.email]);

    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
    const validatePassword = (password) => password.length >= 6;
    
    const isCompanyEmail = (email) => {
        const emailLower = email.toLowerCase();
        return emailLower.endsWith("@company.com") ||
               emailLower.endsWith("@admin.com") ||
               emailLower.endsWith("@staff.company.com");
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        // Validation
        if (!form.name || !form.email || !form.username || !form.password) {
            setError("Please fill in all required fields");
            toast.error("Please fill in all required fields");
            return;
        }

        if (!validateEmail(form.email)) {
            setError("Please enter a valid email address");
            toast.error("Please enter a valid email address");
            return;
        }

        if (!validatePassword(form.password)) {
            setError("Password must be at least 6 characters");
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            toast.error("Passwords do not match");
            return;
        }

        // 🔥 Check if company email - if yes, require OTP verification
        if (isCompanyEmail(form.email)) {
            setRequiresOTP(true);
            await requestOTP();
        } else {
            // Regular user - direct registration
            await completeRegistration();
        }
    };

    const requestOTP = async () => {
        try {
            setLoading(true);
            setError("");
            await api.post(`/auth/request-otp?email=${form.email}`);
            storeOTPSendTime(form.email);
            sessionStorage.setItem(`otp_last_sent_${form.email}`, Math.floor(Date.now() / 1000));
            setStep("otp-verify");
            setCanResend(false);
            toast.success("✅ OTP sent to your email!");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send OTP";
            setError(msg);
            toast.error(msg);
            setRequiresOTP(false);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError("");
        
        try {
            setLoading(true);
            await api.post(`/auth/request-otp?email=${form.email}`);
            storeOTPSendTime(form.email);
            sessionStorage.setItem(`otp_last_sent_${form.email}`, Math.floor(Date.now() / 1000));
            setOtp("");
            setCanResend(false);
            toast.success("✅ New OTP sent!");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to resend OTP";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (verifiedOtp) => {
        setError("");
        setOtp(verifiedOtp);

        if (verifiedOtp.length !== 6) return;

        try {
            setLoading(true);
            await api.post(`/auth/verify-otp?email=${form.email}&otp=${verifiedOtp}`);
            await completeRegistration();
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid OTP";
            setError(msg);
            toast.error(msg);
            setOtp("");
        } finally {
            setLoading(false);
        }
    };

    const completeRegistration = async () => {
        try {
            setLoading(true);
            setError("");

            const payload = {
                name: form.name,
                email: form.email,
                username: form.username,
                password: form.password
                // 🔥 DO NOT SEND ROLE - Backend controls role assignment
            };

            // 🔥 Always use /auth/register - backend decides role based on pre-approved list
            const res = await api.post("/auth/register", payload);
            
            const token = res.data?.token;
            const assignedRole = res.data?.role;  // Backend-determined role
            const userData = {
                userId: res.data?.userId,
                username: res.data?.username,
                email: res.data?.email,
                role: assignedRole,  // Use server's role decision
                name: res.data?.name
            };

            if (!token) throw new Error("Token not received");

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            
            // Show appropriate message and redirect
            if (assignedRole === "ADMIN") {
                toast.success("🎉 Admin account created successfully!");
                navigate("/admin");
            } else {
                toast.success("🎉 Registration successful! Welcome aboard!");
                navigate("/dashboard");
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed";
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
                            🚀
                        </div>
                        <h1>Get Started</h1>
                        <p>Join thousands of users managing their finances smarter</p>
                        <div className="feature-list">
                            <div className="feature-item">✓ Free account creation</div>
                            <div className="feature-item">✓ Instant access to dashboard</div>
                            <div className="feature-item">✓ Secure & encrypted data</div>
                        </div>
                    </div>
                </div>

                {/* Right Section - Register Form */}
                <div className="auth-form-container">
                    <div className="auth-card">
                        {step === "basic" ? (
                            <>
                                <h2>Create Account</h2>
                                <p className="auth-subtitle">Join our community today</p>

                                {error && <div className="error-banner">{error}</div>}

                                <form onSubmit={handleRegister}>
                                    {/* Full Name */}
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <div className="input-wrapper">
                                            <FaUser className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Enter your full name"
                                                value={form.name}
                                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                autoComplete="name"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="form-group">
                                        <label>Email</label>
                                        <div className="input-wrapper">
                                            <FaEnvelope className="input-icon" />
                                            <input
                                                type="email"
                                                placeholder="Enter your email"
                                                value={form.email}
                                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                autoComplete="email"
                                            />
                                        </div>
                                    </div>

                                    {/* Username */}
                                    <div className="form-group">
                                        <label>Username</label>
                                        <div className="input-wrapper">
                                            <FaUser className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Choose a username"
                                                value={form.username}
                                                onChange={(e) => setForm({ ...form, username: e.target.value })}
                                                autoComplete="username"
                                            />
                                        </div>
                                    </div>

                                    {/* Info about admin registration */}
                                    <div className="info-banner" style={{backgroundColor: "#1e3c72", borderLeft: "4px solid #4facfe", padding: "12px", borderRadius: "6px", marginBottom: "16px"}}>
                                        <p style={{margin: 0, fontSize: "14px", color: "#e0e0e0"}}>
                                            ℹ️ <strong>Admin access</strong> is automatically granted to authorized company email addresses only.
                                        </p>
                                    </div>

                                    {/* Password */}
                                    <div className="form-group">
                                        <label>Password</label>
                                        <div className="input-wrapper">
                                            <FaLock className="input-icon" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a strong password"
                                                value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                autoComplete="new-password"
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

                                    {/* Confirm Password */}
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <div className="input-wrapper">
                                            <FaLock className="input-icon" />
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                placeholder="Confirm your password"
                                                value={form.confirmPassword}
                                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                            >
                                                {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="auth-button primary"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="spinner" /> Processing...
                                            </>
                                        ) : (
                                            "Create Account"
                                        )}
                                    </button>
                                </form>

                                <p className="auth-footer">
                                    Already have an account?{" "}
                                    <Link to="/login" className="auth-link">
                                        Sign in here
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="back-button" style={{ marginBottom: "20px" }}>
                                    <FaArrowLeft /> Back
                                </Link>
                                <h2>Verify Email</h2>
                                <p className="auth-subtitle">Enter the 6-digit code sent to <strong>{form.email}</strong></p>

                                {error && <div className="error-banner">{error}</div>}

                                <div style={{ marginBottom: "20px", marginTop: "30px" }}>
                                    <OTPInput
                                        length={6}
                                        onComplete={verifyOTP}
                                        onChange={(val) => setOtp(val)}
                                        loading={loading}
                                        error={error}
                                    />
                                </div>

                                <div style={{ 
                                    fontSize: "13px", 
                                    textAlign: "center", 
                                    color: "#6b7280",
                                    marginBottom: "20px"
                                }}>
                                    {timerText}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep("basic");
                                        setOtp("");
                                        setError("");
                                        sessionStorage.removeItem(`otp_sent_${form.email}`);
                                    }}
                                    className="auth-button secondary"
                                    style={{ marginBottom: "10px" }}
                                >
                                    Use different email
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={!canResend || loading}
                                    className="auth-button tertiary"
                                >
                                    Resend Code
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}