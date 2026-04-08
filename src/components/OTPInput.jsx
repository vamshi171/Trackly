import { useState, useRef, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
import "../styles/OTPInput.css";

/**
 * Reusable OTP Input Component
 * Provides secure 6-digit OTP entry with auto-focus navigation
 * 
 * Props:
 * - length: number of OTP digits (default: 6)
 * - onComplete: callback when all digits are entered
 * - onChange: callback on each digit change
 * - loading: boolean to show loading state
 * - disabled: boolean to disable input
 * - error: error message to display
 */
export default function OTPInput({ 
    length = 6, 
    onComplete, 
    onChange, 
    loading = false, 
    disabled = false,
    error = ""
}) {
    const [otp, setOtp] = useState(Array(length).fill(""));
    const inputRefs = useRef([]);

    const handleChange = (value, index) => {
        if (!/^\d*$/.test(value)) return; // Only allow digits

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // Keep only last digit
        setOtp(newOtp);

        // Notify parent component
        const otpString = newOtp.join("");
        onChange?.(otpString);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Trigger callback when complete
        if (otpString.length === length && otpString.every(d => d !== "")) {
            onComplete?.(otpString);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs.current[index - 1]?.focus();
        }

        // Allow arrow keys
        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowRight" && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").slice(0, length);
        
        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = pastedData.split("");
        setOtp(newOtp);
        
        const otpString = newOtp.join("");
        onChange?.(otpString);

        if (otpString.length === length) {
            onComplete?.(otpString);
            inputRefs.current[length - 1]?.focus();
        }
    };

    const handleClear = () => {
        setOtp(Array(length).fill(""));
        onChange?.("");
        inputRefs.current[0]?.focus();
    };

    return (
        <div className="otp-container">
            <div className="otp-inputs" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        disabled={loading || disabled}
                        className={`otp-input ${error ? "otp-input-error" : ""}`}
                        placeholder="•"
                    />
                ))}
            </div>

            {error && <div className="otp-error-message">{error}</div>}

            <div className="otp-actions">
                {loading && (
                    <span className="otp-loading">
                        <FaSpinner className="spinner" />
                        Verifying...
                    </span>
                )}
                {!loading && otp.join("").length > 0 && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="otp-clear-btn"
                    >
                        Clear
                    </button>
                )}
            </div>

            <div className="otp-hint">
                Enter the 6-digit code sent to your email
            </div>
        </div>
    );
}
