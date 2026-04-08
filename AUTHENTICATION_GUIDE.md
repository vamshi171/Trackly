# 🔐 Authentication System Implementation Guide

## Overview
Enhanced authentication system with modern UI, admin verification via OTP, and password reset functionality.

---

## 📋 Backend Endpoints Required

### ✅ 1. **Login Endpoint** (Already Implemented)
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "john_doe",
  "password": "password123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER" or "ADMIN"
  }
}

Error (401):
{
  "success": false,
  "message": "Invalid username or password"
}
```

---

### ✅ 2. **Register Endpoint** (Needs Update)
```
POST /api/auth/register
Content-Type: application/json

Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "john_doe",
  "password": "password123",
  "role": "USER" or "ADMIN"  // NEW FIELD
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Registration successful",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "USER" or "ADMIN"
  }
}

Error (400):
{
  "success": false,
  "message": "Email already registered" | "Username already taken"
}
```

---

### 🆕 3. **Request OTP Endpoint** (NEW - Admin Registration Only)
```
POST /api/auth/request-otp
Content-Type: application/json

Trigger: User registers with role=ADMIN and email=@company.com

Request:
{
  "email": "admin@company.com"
}

Validation:
- Email must be provided
- Email must end with @company.com (configurable)
- Email should not already be registered

Response:
{
  "success": true,
  "message": "OTP sent to admin@company.com",
  "expiresIn": 300  // seconds (5 minutes)
}

Backend Logic:
1. Generate random 6-digit OTP
2. Hash OTP before storing in DB (use bcrypt)
3. Store in temporary OTP table:
   - otp_temp { email, otp_hash, created_at, expires_at, attempts: 0 }
4. Send OTP via email using Nodemailer/SendGrid
5. Clear old OTPs for this email (auto-cleanup)

Error (400):
{
  "success": false,
  "message": "Company email required (@company.com)"
}
```

---

### 🆕 4. **Verify OTP Endpoint** (NEW)
```
POST /api/auth/verify-otp
Content-Type: application/json

Request:
{
  "email": "admin@company.com",
  "otp": "123456"
}

Response:
{
  "success": true,
  "message": "OTP verified successfully",
  "verified": true
}

Backend Logic:
1. Check OTP exists and matches email
2. Verify OTP hash (using bcrypt)
3. Check if OTP is expired (< 5 minutes)
4. Check attempt count (max 3 failed attempts)
5. Mark as verified (store verification flag in session/cache)
6. Delete used OTP from DB
7. Set verification flag to allow registration completion

Error (400):
{
  "success": false,
  "message": "Invalid OTP" | "OTP expired" | "Too many attempts"
}
```

---

### 🆕 5. **Forgot Password - Request Reset** (NEW)
```
POST /api/auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset link sent to john@example.com"
}

Backend Logic:
1. Find user by email (don't reveal if exists or not)
2. If user exists:
   - Generate secure token (UUID + random base64)
   - Hash token before storing in DB
   - Store in password_reset table:
     - password_reset { user_id, token_hash, created_at, expires_at (1 hour) }
   - Send email with reset link containing token
3. If user not found, still respond with success (security)

Email Template:
---
Subject: Reset Your Password

Hi [Name],

Click the link below to reset your password:
[Frontend URL]/reset-password?token=[TOKEN]&email=[EMAIL]

Link expires in 1 hour.

If you didn't request this, ignore this email.
---

Error: None (always success for security)
```

---

### 🆕 6. **Reset Password Endpoint** (NEW)
```
POST /api/auth/reset-password
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "token": "abc123def456ghi789",
  "newPassword": "newPassword123"
}

Response:
{
  "success": true,
  "message": "Password reset successful"
}

Backend Logic:
1. Find user by email
2. Find valid reset token for this user
3. Verify token hash (using bcrypt)
4. Check if token is not expired (< 1 hour)
5. Validate new password (min 6 chars)
6. Hash new password (bcrypt)
7. Update user password
8. Delete used reset token
9. Invalidate all active JWT tokens (optional: add version field to user)

Error (400):
{
  "success": false,
  "message": "Invalid or expired token" | "Password too weak"
}
```

---

## 📧 Email Configuration (Nodemailer Example)

```javascript
// Backend: utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD  // Use app password, not actual password
  }
});

// Send OTP Email
async function sendOTPEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔐 Your Admin Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Admin Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #3b82f6; letter-spacing: 5px;">${otp}</h1>
        <p>Code expires in 5 minutes.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `
  });
}

// Send Password Reset Email
async function sendPasswordResetEmail(email, name, resetToken) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🔗 Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to reset your password:</p>
        <a href="${process.env.FRONTEND_URL}/forgot-password?step=reset&token=${resetToken}&email=${email}"
           style="display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Reset Password
        </a>
        <p>Link expires in 1 hour.</p>
        <p style="color: #999; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `
  });
}

module.exports = { sendOTPEmail, sendPasswordResetEmail };
```

---

## 🗄️ Database Schema (JPA Entities)

### OTP Table
```java
@Entity
@Table(name = "otp_temp")
public class OTPVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String email;
    
    @Column(columnDefinition = "LONGTEXT")
    private String otpHash; // bcrypt hash of OTP
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    private Integer failedAttempts = 0;
    
    private Boolean verified = false;
    
    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        expiresAt = LocalDateTime.now().plusMinutes(5);
    }
}
```

### Password Reset Token Table
```java
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(unique = true, columnDefinition = "LONGTEXT")
    private String tokenHash; // bcrypt hash of token
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    
    private Boolean used = false;
    
    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        expiresAt = LocalDateTime.now().plusHours(1);
    }
}
```

---

## 🔒 Security Checklist

✅ **Password Hashing**: Use BCrypt with salt rounds ≥ 10
✅ **OTP Hashing**: Hash OTP before storing (never store plain OTP)
✅ **Token Expiration**: OTP (5 min), Reset Token (1 hour)
✅ **Rate Limiting**: Limit OTP/reset requests to 3/hour per email
✅ **Failed Attempts**: Lock after 3 invalid OTP attempts
✅ **CORS**: Configure CORS for frontend domain only
✅ **HTTPS**: Always use HTTPS in production
✅ **Environment Variables**: Store email config in .env
✅ **Input Validation**: Validate email format, password strength
✅ **SQL Injection**: Use parameterized queries (JPA handles this)

---

## 🚀 Implementation Steps

### Step 1: Update User Entity
- Add `role` field (USER/ADMIN enum)
- Ensure password field is properly hashed

### Step 2: Create OTP Service
```java
@Service
public class OTPService {
    @Autowired private OTPRepository otpRepo;
    @Autowired private EmailService emailService;
    @Autowired private PasswordEncoder encoder;
    
    public void generateAndSendOTP(String email) {
        String otp = generateRandomOTP(); // 6 digits
        String otpHash = encoder.encode(otp);
        
        OTPVerification otpEntity = new OTPVerification();
        otpEntity.setEmail(email);
        otpEntity.setOtpHash(otpHash);
        otpRepo.save(otpEntity);
        
        emailService.sendOTPEmail(email, otp);
    }
    
    public boolean verifyOTP(String email, String otp) {
        OTPVerification otpEntity = otpRepo.findByEmail(email)
            .orElseThrow(() -> new Exception("OTP not found"));
            
        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new Exception("OTP expired");
        }
        
        if (otpEntity.getFailedAttempts() >= 3) {
            throw new Exception("Too many failed attempts");
        }
        
        if (!encoder.matches(otp, otpEntity.getOtpHash())) {
            otpEntity.setFailedAttempts(otpEntity.getFailedAttempts() + 1);
            otpRepo.save(otpEntity);
            throw new Exception("Invalid OTP");
        }
        
        otpEntity.setVerified(true);
        otpRepo.save(otpEntity);
        return true;
    }
}
```

### Step 3: Create Password Reset Service
```java
@Service
public class PasswordResetService {
    @Autowired private PasswordResetTokenRepository tokenRepo;
    @Autowired private PasswordEncoder encoder;
    @Autowired private EmailService emailService;
    
    public void generateResetToken(User user) {
        String token = UUID.randomUUID().toString();
        String tokenHash = encoder.encode(token);
        
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setTokenHash(tokenHash);
        tokenRepo.save(resetToken);
        
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }
    
    public void resetPassword(String email, String token, String newPassword) {
        User user = userRepo.findByEmail(email)
            .orElseThrow(() -> new Exception("User not found"));
            
        PasswordResetToken resetToken = tokenRepo.findByUser(user)
            .orElseThrow(() -> new Exception("Token not found"));
            
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new Exception("Token expired");
        }
        
        if (!encoder.matches(token, resetToken.getTokenHash())) {
            throw new Exception("Invalid token");
        }
        
        user.setPassword(encoder.encode(newPassword));
        userRepo.save(user);
        
        resetToken.setUsed(true);
        tokenRepo.save(resetToken);
    }
}
```

---

## 📝 Environment Variables

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_SERVICE=gmail

# Frontend
FRONTEND_URL=http://localhost:5173

# OTP Config
OTP_EXPIRY_MINUTES=5
MAX_OTP_ATTEMPTS=3

# Admin Email Domain
ADMIN_EMAIL_DOMAIN=@company.com

# JWT Secret
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h
```

---

## ✅ Testing Checklist

- [ ] User registration (USER role) - works without OTP
- [ ] Admin registration (ADMIN role) - requires @company.com email
- [ ] OTP sent to admin email
- [ ] OTP verification with valid code
- [ ] OTP rejection with invalid code
- [ ] OTP expiration (5 minutes)
- [ ] Failed attempts lockout (3 attempts)
- [ ] Password reset request sent
- [ ] Password reset with valid token
- [ ] Password reset failure with invalid token
- [ ] Password reset failure with expired token
- [ ] Login with new password after reset
- [ ] Remember me checkbox saves username
- [ ] Show/hide password toggle works
- [ ] Responsive design on mobile/tablet

---

Generated: 2026-04-07
Updated for: ExpenseTracker v2.0
