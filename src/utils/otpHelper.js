/**
 * OTP Helper Utilities
 * Handles OTP validation, formatting, and timing
 */

/**
 * Validate OTP format
 * @param {string} otp - The OTP to validate
 * @param {number} length - Expected OTP length (default: 6)
 * @returns {boolean}
 */
export const validateOTP = (otp, length = 6) => {
    if (!otp || typeof otp !== "string") return false;
    return otp.length === length && /^\d+$/.test(otp);
};

/**
 * Format OTP input - remove non-numeric characters
 * @param {string} input - Raw input
 * @returns {string}
 */
export const formatOTPInput = (input) => {
    return input.replace(/\D/g, "").slice(0, 6);
};

/**
 * Calculate remaining time for OTP expiry
 * @param {number} sentTime - Timestamp when OTP was sent (in seconds)
 * @param {number} expirySeconds - OTP expiry time in seconds (default: 300 = 5 min)
 * @returns {object} { remaining, isExpired, minutes, seconds }
 */
export const getOTPExpiryTime = (sentTime, expirySeconds = 300) => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = expirySeconds - (now - sentTime);
    const isExpired = remaining <= 0;
    
    return {
        remaining: Math.max(0, remaining),
        isExpired,
        minutes: Math.floor(Math.max(0, remaining) / 60),
        seconds: Math.max(0, remaining) % 60,
        formatted: `${Math.floor(Math.max(0, remaining) / 60)}:${String(Math.max(0, remaining) % 60).padStart(2, "0")}`
    };
};

/**
 * Generate display text for OTP timer
 * @param {number} sentTime - Timestamp when OTP was sent
 * @param {number} expirySeconds - OTP expiry time in seconds
 * @returns {string}
 */
export const getOTPTimerText = (sentTime, expirySeconds = 300) => {
    const { isExpired, formatted } = getOTPExpiryTime(sentTime, expirySeconds);
    if (isExpired) {
        return "Code expired - request a new one";
    }
    return `Code expires in ${formatted}`;
};

/**
 * Enable/disable resend button based on cooldown
 * @param {number} lastSentTime - Timestamp of last OTP send (in seconds)
 * @param {number} cooldownSeconds - Cooldown period (default: 30 seconds)
 * @returns {object} { canResend, cooldownRemaining, formatted }
 */
export const checkOTPResendCooldown = (lastSentTime, cooldownSeconds = 30) => {
    const now = Math.floor(Date.now() / 1000);
    const cooldownRemaining = cooldownSeconds - (now - lastSentTime);
    const canResend = cooldownRemaining <= 0;
    
    return {
        canResend,
        cooldownRemaining: Math.max(0, cooldownRemaining),
        formatted: String(Math.max(0, cooldownRemaining))
    };
};

/**
 * Log OTP attempt (for security)
 * @param {string} otp - The OTP that was attempted
 * @param {string} email - Email address
 * @param {boolean} success - Whether verification succeeded
 */
export const logOTPAttempt = (otp, email, success) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[OTP] ${timestamp} | Email: ${email} | Status: ${success ? "✅ SUCCESS" : "❌ FAILED"}`;
    console.log(logMessage);
    
    // In production, send to analytics service
    // analytics.logEvent("otp_attempt", { email, success, timestamp });
};

/**
 * Store OTP send time in sessionStorage
 * @param {string} email - Email address
 */
export const storeOTPSendTime = (email) => {
    const sendTime = Math.floor(Date.now() / 1000);
    sessionStorage.setItem(`otp_sent_${email}`, sendTime);
};

/**
 * Get stored OTP send time
 * @param {string} email - Email address
 * @returns {number|null}
 */
export const getOTPSendTime = (email) => {
    const sendTime = sessionStorage.getItem(`otp_sent_${email}`);
    return sendTime ? parseInt(sendTime) : null;
};

/**
 * Clear stored OTP send time
 * @param {string} email - Email address
 */
export const clearOTPSendTime = (email) => {
    sessionStorage.removeItem(`otp_sent_${email}`);
};

/**
 * Check if OTP is still valid (not expired)
 * @param {string} email - Email address
 * @param {number} expirySeconds - OTP expiry time in seconds
 * @returns {boolean}
 */
export const isOTPStillValid = (email, expirySeconds = 300) => {
    const sendTime = getOTPSendTime(email);
    if (!sendTime) return false;
    
    const { isExpired } = getOTPExpiryTime(sendTime, expirySeconds);
    return !isExpired;
};

/**
 * Get complete OTP status object
 * @param {string} email - Email address
 * @param {number} expirySeconds - OTP expiry time in seconds
 * @returns {object}
 */
export const getOTPStatus = (email, expirySeconds = 300) => {
    const sendTime = getOTPSendTime(email);
    
    if (!sendTime) {
        return {
            sent: false,
            valid: false,
            expired: false,
            remaining: 0,
            formattedTime: "—"
        };
    }
    
    const { isExpired, remaining, formatted } = getOTPExpiryTime(sendTime, expirySeconds);
    
    return {
        sent: true,
        valid: !isExpired,
        expired: isExpired,
        remaining,
        formattedTime: formatted,
        sentAt: new Date(sendTime * 1000).toLocaleTimeString()
    };
};
