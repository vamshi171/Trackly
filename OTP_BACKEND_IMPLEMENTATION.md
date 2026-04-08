# 📧 Email OTP Implementation Guide

## Overview
Complete Email OTP system for registration, login verification, and password reset with production-ready security.

---

## 🎯 Use Cases

| Feature | Trigger | Endpoint | Response |
|---------|---------|----------|----------|
| **Registration** | New user signs up with company email | `/auth/request-otp` → `/auth/verify-otp` → `/auth/register` | Account created with role |
| **Password Reset** | User clicks "Forgot Password" | `/auth/forgot-password` (sends OTP) → `/auth/verify-otp` → `/auth/reset-password` | Password updated |
| **Admin Verification** | Admin tries to login from new device | `/auth/request-otp` | OTP sent to email |
| **Email Change** | User updates email in settings | `/auth/request-email-change` | Verification required |

---

## 📋 Required Backend Endpoints

### 1️⃣ Request OTP for Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "user@example.com"
}

Response (200):
{
  "success": true,
  "message": "OTP sent to user@example.com",
  "expiresIn": 300  // seconds (5 minutes)
}

Response (400):
{
  "success": false,
  "message": "Email not registered"
}

Response (429):
{
  "success": false,
  "message": "Too many requests. Try again in 60 seconds."
}
```

**Backend Logic:**
1. Check if email exists in database
2. Generate random 6-digit OTP
3. Hash OTP using bcrypt (never store plain OTP)
4. Store in `otp_temp` table with expiry (5 minutes)
5. Send via email using Nodemailer/SendGrid
6. Implement rate limiting (max 3 requests per 5 minutes)
7. Clear old OTPs for this email

---

### 2️⃣ Verify OTP
```http
POST /api/auth/verify-otp?email=user@example.com&otp=123456
Content-Type: application/json

Response (200):
{
  "success": true,
  "message": "OTP verified successfully"
}

Response (400):
{
  "success": false,
  "message": "Invalid OTP" | "OTP expired" | "Too many attempts"
}

Response (429):
{
  "success": false,
  "message": "Too many verification attempts. Try again later."
}
```

**Backend Logic:**
1. Validate OTP format (6 digits)
2. Check OTP exists for email
3. Verify OTP hasn't expired
4. Compare provided OTP with stored hash using bcrypt
5. Implement attempt limit (max 5 attempts)
6. Lock account after 5 failed attempts (15 min)
7. Delete OTP from database after verification
8. Return success for next step

---

### 3️⃣ Reset Password (After OTP Verification)
```http
POST /api/auth/reset-password
Content-Type: application/json

Request:
{
  "email": "user@example.com",
  "newPassword": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "message": "Password reset successfully",
  "token": "eyJhbGciOiJIUzI1NiIs..."  // Optional: auto-login
}

Response (400):
{
  "success": false,
  "message": "Weak password" | "Email not found"
}
```

**Backend Logic:**
1. Validate email exists
2. Validate password strength (min 6 chars, recommended: 8+ with special chars)
3. Hash new password using bcrypt (10 rounds minimum)
4. Update password in database
5. Invalidate all existing tokens for this user (force re-login)
6. Clear any pending OTPs for this email
7. Log password change event for audit trail

---

### 4️⃣ Request OTP for Registration
```http
POST /api/auth/request-otp
Content-Type: application/json

Request:
{
  "email": "admin@company.com"
}

Response (200):
{
  "success": true,
  "message": "OTP sent to admin@company.com",
  "requiresVerification": true,
  "expiresIn": 300
}

Response (400):
{
  "success": false,
  "message": "Email already registered" | "Domain not approved"
}
```

**Backend Logic:**
1. Check if email is pre-approved for admin role
2. Check if email not already registered
3. Generate & send OTP (same as forgot-password)
4. Store in temporary OTP table

---

### 5️⃣ Registration (After OTP Verification)
```http
POST /api/auth/register
Content-Type: application/json

Request:
{
  "name": "John Doe",
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePassword123!"
}

Response (201):
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER" | "ADMIN"  // Backend decides based on email
  }
}

Response (400):
{
  "success": false,
  "message": "Username already taken" | "Email already registered" | "OTP not verified"
}
```

**Backend Logic:**
1. Validate OTP was verified for this email (check flag in DB)
2. Validate username unique
3. Validate email unique
4. Validate password strength
5. Hash password using bcrypt
6. Determine role:
   - If email in pre-approved admin list → ADMIN
   - Otherwise → USER
7. Create user record
8. Clear OTP verification flag
9. Generate JWT token
10. Return user data with token

---

## 🗄️ Database Schema

### OTP Temporary Storage (Expires after 5 min)
```sql
CREATE TABLE otp_temp (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    otp_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed
    created_at BIGINT NOT NULL,
    expires_at BIGINT NOT NULL,
    attempts INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    purpose ENUM('registration', 'password_reset', 'email_change') DEFAULT 'password_reset',
    created_ip VARCHAR(45),
    INDEX idx_email (email)
);

-- Auto-delete expired OTPs
-- Run every minute: DELETE FROM otp_temp WHERE expires_at < UNIX_TIMESTAMP();
```

### Failed Login Attempts (Rate Limiting)
```sql
CREATE TABLE otp_failed_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    attempt_count INT DEFAULT 0,
    last_attempt_at BIGINT NOT NULL,
    locked_until BIGINT,
    PRIMARY KEY (email)
);
```

### User Pre-Approved Emails (For Admin)
```sql
CREATE TABLE admin_approved_emails (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INT,
    status ENUM('approved', 'pending', 'rejected') DEFAULT 'approved'
);

-- Pre-populate with your company emails
INSERT INTO admin_approved_emails (email, status) VALUES
('admin@company.com', 'approved'),
('manager@company.com', 'approved');
```

---

## 🔐 Security Checklist

- [ ] **Hash OTP**: Use bcrypt (NOT plain text)
- [ ] **Rate Limiting**: Max 3 OTP requests per email per 5 min
- [ ] **Attempt Limiting**: Max 5 verification attempts, lock for 15 min after
- [ ] **Expiry**: OTP valid for 5 minutes only
- [ ] **HTTPS Only**: Never send OTP over HTTP
- [ ] **Secure Headers**: Set SameSite, HttpOnly, Secure on cookies
- [ ] **Input Validation**: Validate email format, OTP format
- [ ] **SQL Injection**: Use parameterized queries
- [ ] **Audit Logging**: Log all OTP attempts with IP address
- [ ] **Email Service**: Use verified email service (SendGrid, AWS SES, Mailgun)
- [ ] **Password Validation**: Enforce strong passwords (min 8 chars recommended)
- [ ] **Token Expiry**: Invalidate old tokens after password reset
- [ ] **CSRF Protection**: Include CSRF tokens in forms

---

## 📧 Email Service Setup

### Option 1: Gmail SMTP (Free for Testing)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Generate at https://myaccount.google.com/apppasswords
SMTP_FROM=your-email@gmail.com
```

**Steps:**
1. Enable 2-factor authentication on Gmail
2. Generate app-specific password
3. Use in SMTP_PASSWORD

### Option 2: SendGrid (Production Recommended)
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@company.com
```

### Option 3: AWS SES
```env
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
SES_FROM_EMAIL=noreply@company.com
```

---

## 💻 Node.js Implementation Example

### Install Dependencies
```bash
npm install bcryptjs nodemailer dotenv
```

### OTP Service
```javascript
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class OTPService {
    static generateOTP(length = 6) {
        return crypto
            .randomInt(0, Math.pow(10, length))
            .toString()
            .padStart(length, '0');
    }

    static async hashOTP(otp) {
        return await bcrypt.hash(otp, 10);
    }

    static async verifyOTP(otp, hash) {
        return await bcrypt.compare(otp, hash);
    }

    static async storeOTP(email, otp, expiryMinutes = 5) {
        const hashedOTP = await this.hashOTP(otp);
        const expiresAt = Date.now() + (expiryMinutes * 60 * 1000);

        await db.query(
            'INSERT INTO otp_temp (email, otp_hash, created_at, expires_at) VALUES (?, ?, ?, ?)',
            [email, hashedOTP, Date.now(), expiresAt]
        );

        return { otp, expiresAt };
    }

    static async verifyAndClearOTP(email, otp) {
        const result = await db.query(
            'SELECT otp_hash, expires_at, attempts FROM otp_temp WHERE email = ?',
            [email]
        );

        if (!result.length) {
            throw new Error('OTP not found');
        }

        const { otp_hash, expires_at, attempts } = result[0];

        // Check expiry
        if (Date.now() > expires_at) {
            await db.query('DELETE FROM otp_temp WHERE email = ?', [email]);
            throw new Error('OTP expired');
        }

        // Check attempts
        if (attempts >= 5) {
            throw new Error('Too many attempts. Try again later.');
        }

        // Verify OTP
        const isValid = await this.verifyOTP(otp, otp_hash);
        if (!isValid) {
            await db.query(
                'UPDATE otp_temp SET attempts = attempts + 1 WHERE email = ?',
                [email]
            );
            throw new Error('Invalid OTP');
        }

        // Clear OTP
        await db.query('DELETE FROM otp_temp WHERE email = ?', [email]);
        return true;
    }
}

module.exports = OTPService;
```

### Email Service
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

async function sendOTPEmail(email, otp, purpose = 'password_reset') {
    const subject = {
        'password_reset': 'Password Reset OTP',
        'registration': 'Email Verification OTP',
        'email_change': 'Email Change Verification'
    }[purpose];

    const htmlContent = `
        <h2>Your ${subject}</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #4f46e5; letter-spacing: 10px; font-family: monospace;">
            ${otp}
        </h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject,
        html: htmlContent
    });
}

module.exports = { sendOTPEmail };
```

### API Routes (Express.js)
```javascript
const express = require('express');
const router = express.Router();
const OTPService = require('../services/OTPService');
const { sendOTPEmail } = require('../services/emailService');

// Forgot Password - Request OTP
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        // Check if email exists
        const user = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (!user.length) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email not registered' 
            });
        }

        // Generate and send OTP
        const otp = OTPService.generateOTP();
        await OTPService.storeOTP(email, otp);
        await sendOTPEmail(email, otp, 'password_reset');

        res.json({
            success: true,
            message: `OTP sent to ${email}`,
            expiresIn: 300
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.query;

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and OTP required' 
            });
        }

        await OTPService.verifyAndClearOTP(email, otp);

        res.json({
            success: true,
            message: 'OTP verified successfully'
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid email and password required' 
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await db.query(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
```

---

## 🧪 Testing

### Manual Testing
1. **Request OTP**: POST `/auth/forgot-password` with email
2. **Check Email**: Look in spam folder if not in inbox
3. **Verify Code**: POST `/auth/verify-otp` with 6-digit code
4. **Reset Password**: POST `/auth/reset-password` with new password
5. **Login**: Try login with new password

### Automated Testing (Jest)
```javascript
describe('OTP System', () => {
    test('should generate 6-digit OTP', () => {
        const otp = OTPService.generateOTP();
        expect(otp).toMatch(/^\d{6}$/);
    });

    test('should reject expired OTP', async () => {
        const email = 'test@example.com';
        const otp = '123456';
        await OTPService.storeOTP(email, otp, -1); // Already expired

        expect(() => OTPService.verifyAndClearOTP(email, otp))
            .rejects.toThrow('OTP expired');
    });

    test('should lock after 5 failed attempts', async () => {
        // Test implementation
    });
});
```

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured (.env)
- [ ] Database migrations run
- [ ] Email service verified (test email)
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Logging configured
- [ ] Error monitoring setup (Sentry)
- [ ] Database backups configured
- [ ] Load testing passed

---

## 📊 Monitoring & Analytics

Track these metrics in production:

```javascript
// Log OTP metrics
analytics.log({
    event: 'otp_requested',
    email,
    timestamp: new Date(),
    source: 'password_reset' | 'registration'
});

// Track success rate
analytics.log({
    event: 'otp_verified',
    email,
    attempts: attemptCount,
    timeTaken: endTime - startTime
});
```

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| OTP not received | Check spam, verify SMTP config, check logs |
| OTP expired too quick | Increase expiry time in code (default 5 min) |
| Too many requests error | Adjust rate limit, clear `otp_failed_attempts` table |
| Can't verify OTP | Check bcrypt version, ensure OTP not modified |
| Email service failing | Test SMTP credentials, check firewall |

---

## ✅ Production Recommendations

1. **Use SendGrid/AWS SES**: More reliable than Gmail
2. **Implement Retry Logic**: Resend email if fails
3. **Add Honeypot**: Prevent bot signups
4. **Monitor Failed Attempts**: Alert on suspicious activity
5. **Implement 2FA**: Add optional TOTP for high-security accounts
6. **Keep Audit Logs**: Store all OTP-related events for compliance
7. **Set Reasonable Limits**: 3 OTP requests/5 min, 5 attempts/15 min

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review the logs: `error.log`
3. Test with simulated OTP: Use hardcoded OTP in dev mode
4. Contact your backend team

