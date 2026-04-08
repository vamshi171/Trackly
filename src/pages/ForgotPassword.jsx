import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEnvelope, FaLock, FaSpinner, FaArrowLeft } from "react-icons/fa";
import OTPInput from "../components/OTPInput";
import { 
    storeOTPSendTime, 
    getOTPTimerText, 
    checkOTPResendCooldown 
} from "../utils/otpHelper";
import "../styles/Auth.css";

export default function ForgotPassword() {
    const [step, setStep] = useState("email"); // email, otp-verify, reset-password
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [timerText, setTimerText] = useState("Code expires in 5:00");
    const [canResend, setCanResend] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

    // Update timer display every second
    useEffect(() => {
        if (step !== "otp-verify") return;

        const interval = setInterval(() => {
            const sendTime = parseInt(sessionStorage.getItem(`otp_sent_${email}`) || "0");
            if (sendTime) {
                setTimerText(getOTPTimerText(sendTime));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [step, email]);

    // Check resend cooldown
    useEffect(() => {
        if (step !== "otp-verify") return;

        const interval = setInterval(() => {
            const lastSent = parseInt(sessionStorage.getItem(`otp_last_sent_${email}`) || "0");
            if (lastSent) {
                const { canResend } = checkOTPResendCooldown(lastSent);
                setCanResend(canResend);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [step, email]);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Please enter your email");
            toast.error("Please enter your email");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            toast.error("Please enter a valid email address");
            return;
        }

        try {
            setLoading(true);
            await api.post("/auth/forgot-password", { email });
            storeOTPSendTime(email);
            sessionStorage.setItem(`otp_last_sent_${email}`, Math.floor(Date.now() / 1000));
            setCanResend(false);
            setStep("otp-verify");
            toast.success("✅ OTP sent to your email! Check your inbox.");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to send OTP";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setError("");
        
        try {
            setLoading(true);
            await api.post("/auth/forgot-password", { email });
            storeOTPSendTime(email);
            sessionStorage.setItem(`otp_last_sent_${email}`, Math.floor(Date.now() / 1000));
            setOtp("");
            setCanResend(false);
            toast.success("✅ New OTP sent! Check your email.");
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to resend OTP";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (verifiedOtp) => {
        setError("");
        setOtp(verifiedOtp);

        if (verifiedOtp.length !== 6) return;

        try {
            setLoading(true);
            await api.post(`/auth/verify-otp?email=${email}&otp=${verifiedOtp}`);
            setStep("reset-password");
            toast.success("✅ Email verified! Now set your new password.");
        } catch (err) {
            const msg = err.response?.data?.message || "Invalid OTP";
            setError(msg);
            toast.error(msg);
            setOtp("");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError("");

        if (!newPassword || newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            await api.post("/auth/reset-password", {
                email,
                newPassword
            });
            toast.success("✅ Password reset successful! Redirecting to login...");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to reset password";
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-wrapper">
                {/* Left Section */}
                <div className="auth-illustration">
                    <div className="illustration-content">
                        <div className="icon-large" style={{ fontSize: "120px", marginBottom: "20px" }}>
                            🔐
                        </div>
                        <h1>Secure Access</h1>
                        <p>Reset your password safely and securely</p>
                        <div className="feature-list">
                            <div className="feature-item">✓ Email verification</div>
                            <div className="feature-item">✓ OTP verification</div>
                            <div className="feature-item">✓ Back to your account</div>
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div className="auth-form-container">
                    <div className="auth-card">
                        {/* Step 1: Email Input */}
                        {step === "email" && (
                            <>
                                <Link to="/login" className="back-button">
                                    <FaArrowLeft /> Back to login
                                </Link>
                                <h2>Reset Password</h2>
                                <p className="auth-subtitle">Enter your email to receive a verification code</p>

                                {error && <div className="error-banner">{error}</div>}

                                <form onSubmit={handleEmailSubmit}>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-wrapper">
                                            <FaEnvelope className="input-icon" />
                                            <input
                                                type="email"
                                                placeholder="Enter your registered email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                autoComplete="email"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="auth-button primary"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="spinner" /> Sending OTP...
                                            </>
                                        ) : (
                                            "Send Verification Code"
                                        )}
                                    </button>
                                </form>
                            </>
                        )}

                        {/* Step 2: OTP Verification */}
                        {step === "otp-verify" && (
                            <>
                                <Link to="/login" className="back-button">
                                    <FaArrowLeft /> Back to login
                                </Link>
                                <h2>Verify Email</h2>
                                <p className="auth-subtitle">Enter the 6-digit code sent to <strong>{email}</strong></p>

                                {error && <div className="error-banner">{error}</div>}

                                <div style={{ marginBottom: "20px" }}>
                                    <OTPInput
                                        length={6}
                                        onComplete={handleVerifyOTP}
                                        onChange={(val) => setOtp(val)}
                                        loading={loading}
                                        error={error}
                                    />
                                </div>

                                <div style={{ 
                                    fontSize: "13px", 
                                    textAlign: "center", 
                                    color: "#6b7280",
                                    marginBottom: "15px"
                                }}>
                                    {timerText}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setStep("email")}
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
                                    {canResend ? "Resend Code" : "Resend Code"}
                                </button>
                            </>
                        )}

                        {/* Step 3: Reset Password */}
                        {step === "reset-password" && (
                            <>
                                <h2>Create New Password</h2>
                                <p className="auth-subtitle">Enter your new password</p>

                                {error && <div className="error-banner">{error}</div>}

                                <form onSubmit={handlePasswordReset}>
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <div className="input-wrapper">
                                            <FaLock className="input-icon" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <div className="input-wrapper">
                                            <FaLock className="input-icon" />
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm your new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="auth-button primary"
                                    >
                                        {loading ? (
                                            <>
                                                <FaSpinner className="spinner" /> Resetting...
                                            </>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
