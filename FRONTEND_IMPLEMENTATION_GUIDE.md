# 🔐 Frontend Role-Based Access Control - Complete Implementation Guide

## Overview

This document explains how the frontend implements role-based access control in coordination with the backend JWT authentication system.

---

## 1. Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Action                              │
│              (Login / Register Button)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              API Call to Backend                            │
│  POST /api/auth/login or /api/auth/register                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│          Backend Validates & Returns JWT                    │
│         Token includes: username, role, userId             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│         Frontend Stores Token in localStorage              │
│   localStorage.setItem('token', token)                    │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│        Frontend Decodes Token to Extract Role              │
│    const decoded = jwtDecode(token)                        │
│    const role = decoded.role  // USER or ADMIN             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│       Redirect Based on Role                               │
│   USER  → /dashboard                                        │
│   ADMIN → /admin                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. User Files & Their Purposes

### **A. Utility Files**

#### `src/utils/tokenUtils.js` (NEW)
**Purpose**: Centralized JWT token handling

**Key Functions**:
```javascript
decodeToken(token)              // Decode JWT
getCurrentRole()                // Get user's role
getCurrentUserId()              // Get user's ID
getCurrentUsername()            // Get username
isTokenExpired()                // Check token expiry
hasRole(requiredRole)           // Check if user has role
isAuthenticated()               // Check auth status
logout()                        // Clear all auth data
```

**Usage**:
```javascript
import { getCurrentRole, hasRole, isAuthenticated } from '../utils/tokenUtils';

const role = getCurrentRole();  // "USER" or "ADMIN"
if (hasRole("ADMIN")) {
  // Show admin features
}
```

---

### **B. Component Files**

#### `src/components/ProtectedRoute.jsx` (UPDATED)
**Purpose**: Guard routes based on authentication and role

**Props**:
```jsx
<ProtectedRoute 
  element={<Component />}        // Component to render
  requiredRole="ADMIN"           // "USER" or "ADMIN"
/>
```

**Logic**:
1. Check if token exists and not expired
2. Extract role from token
3. Check if user has required role
4. ADMIN can access all routes
5. USER can access USER routes only
6. Unauthorized → redirect to `/dashboard` or `/login`

**Example Usage**:
```jsx
// User route (USER + ADMIN can access)
<Route 
  path="/expenses" 
  element={<ProtectedRoute element={<Expenses />} requiredRole="USER" />} 
/>

// Admin route (ADMIN ONLY)
<Route 
  path="/admin" 
  element={<ProtectedRoute element={<AdminDashboard />} requiredRole="ADMIN" />} 
/>
```

#### `src/components/AdminLayout.jsx` (NEW)
**Purpose**: Special layout for admin pages with admin-specific sidebar

**Features**:
- Admin-exclusive sidebar menu
- Navigation to admin pages
- User info + logout button
- Responsive design for mobile
- Toggle sidebar on small screens

**Menu Items**:
- Dashboard
- Users (user management)
- All Expenses (global)
- System Analytics
- Settings

**Usage**:
```jsx
function AdminDashboard() {
  return (
    <AdminLayout>
      <h1>Welcome Admin!</h1>
      {/* Admin dashboard content */}
    </AdminLayout>
  );
}
```

---

### **C. Page Files (UPDATED)**

#### `src/pages/Login.jsx` (UPDATED)
**Changes**:
- Decodes JWT after login
- Extracts role from token (not from response)
- Redirects based on role:
  - ADMIN → `/admin`
  - USER → `/dashboard`
- Stores token + userdata in localStorage

**Key Code**:
```javascript
const decoded = decodeToken(token);
const userRole = decoded?.role;

if (userRole === "ADMIN") {
  navigate("/admin");
} else {
  navigate("/dashboard");
}
```

#### `src/pages/Register.jsx` (UPDATED)
**Changes**:
- Removed role selection from form
- `register/admin` endpoint only validates email
- Uses server's role decision (not user's choice)
- Shows appropriate message based on server's role assignment

**Key Code**:
```javascript
// Backend decides role based on email
const endpoint = form.role === "ADMIN" 
  ? "/auth/register/admin"  // Validates email
  : "/auth/register";        // Always USER

const assignedRole = res.data?.role;  // Trust server
navigate(assignedRole === "ADMIN" ? "/admin" : "/dashboard");
```

---

### **D. App Routes (UPDATED)**

#### `src/App.jsx` (UPDATED)
**Changes**:
- All protected routes now use new ProtectedRoute format
- Added role specifications
- Separated USER and ADMIN routes

**Route Structure**:
```jsx
{/* 🔓 PUBLIC */}
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />

{/* 🔒 USER ROUTES (USER + ADMIN) */}
<Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} requiredRole="USER" />} />
<Route path="/expenses" element={<ProtectedRoute element={<Expenses />} requiredRole="USER" />} />

{/* 🔒 ADMIN ROUTES (ADMIN ONLY) */}
<Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} requiredRole="ADMIN" />} />
```

---

## 3. Authentication Flow (Step-by-Step)

### **Scenario 1: User Registration**

```
1. User fills register form
   ├─ name: "John Doe"
   ├─ email: "john@gmail.com"
   ├─ username: "johndoe"
   ├─ password: "password123"
   └─ role selection: "User" (frontend may show, but backend controls)

2. Frontend sends POST /api/auth/register
   └─ Backend: Sets role = USER, creates user

3. Backend returns:
   ├─ token: "eyJhb..." (contains role: USER)
   ├─ role: "USER"
   └─ other user data

4. Frontend:
   ├─ Stores token in localStorage
   ├─ Decodes token to extract role
   ├─ Confirms role = "USER"
   └─ Redirects to /dashboard

5. Component Rendering:
   ├─ User dashboard loads
   ├─ Shows USER-specific UI
   └─ Hides admin features
```

### **Scenario 2: Admin Registration (Company Email)**

```
1. User fills register form
   ├─ name: "Admin User"
   ├─ email: "admin@company.com" ← Company email
   ├─ username: "adminuser"
   ├─ password: "password123"
   └─ role selection: "Admin"

2. Frontend sends POST /api/auth/register/admin
   └─ Backend: Validates email

3. Backend checks:
   ├─ Email = "admin@company.com" ✓
   └─ Sets role = ADMIN, creates user

4. Backend returns:
   ├─ token: "eyJhb..." (contains role: ADMIN)
   ├─ role: "ADMIN"
   └─ other user data

5. Frontend:
   ├─ Stores token
   ├─ Decodes token → role = "ADMIN"
   ├─ Confirms role = "ADMIN"
   └─ Redirects to /admin

6. Component Rendering:
   ├─ Admin dashboard loads with AdminLayout
   ├─ Shows admin sidebar + admin features
   └─ Admin-only navigation available
```

### **Scenario 3: Admin Registration (Non-Company Email)**

```
1. User fills register form
   ├─ email: "user@gmail.com" ← NOT company email
   └─ role selection: "Admin"

2. Frontend sends POST /api/auth/register/admin
   └─ Backend: Validates email

3. Backend checks:
   ├─ Email ≠ company domain
   └─ Falls back: Sets role = USER (no error, no rejection)

4. Backend returns:
   ├─ token: "eyJhb..." (contains role: USER)
   ├─ role: "USER"
   └─ message: "Note: Admin role requires company email"

5. Frontend:
   ├─ Stores token
   ├─ Decodes token → role = "USER"
   ├─ Shows message
   └─ Redirects to /dashboard (not /admin)

6. Result:
   ├─ User created as regular USER
   └─ No admin access available
```

### **Scenario 4: Login**

```
1. User enters credentials
   ├─ username: "adminuser"
   └─ password: "password123"

2. Frontend sends POST /api/auth/login
   └─ Backend: Validates credentials

3. Backend returns:
   ├─ token: "eyJhb..." (contains role: ADMIN)
   ├─ role: "ADMIN"
   └─ other user data

4. Frontend:
   ├─ Stores token
   ├─ Decodes: role = "ADMIN"
   ├─ Checks: hasRole("ADMIN") = true
   └─ Redirects to /admin

5. Protected Route Check:
   ├─ <ProtectedRoute element={<AdminDashboard />} requiredRole="ADMIN" />
   ├─ Checks: isAuthenticated() = true ✓
   ├─ Checks: getCurrentRole() = "ADMIN" ✓
   └─ Renders: <AdminDashboard /> ✓

6. AdminLayout renders:
   ├─ Admin sidebar with admin menu
   ├─ User profile showing role = ADMIN
   └─ Admin-exclusive features visible
```

---

## 4. Protected Route Logic (Detailed)

### **How ProtectedRoute Works**

```javascript
export default function ProtectedRoute({ element, requiredRole = "USER" }) {
    const isAuth = isAuthenticated();      // Check token exists & not expired
    const userRole = getCurrentRole();      // Extract role from token

    // Not authenticated → login
    if (!isAuth) {
        return <Navigate to="/login" replace />;
    }

    // ADMIN can access all routes
    if (userRole === "ADMIN") {
        return element;
    }

    // Check role-based access
    if (requiredRole === "ADMIN" && userRole !== "ADMIN") {
        // Regular user trying to access admin route
        return <Navigate to="/dashboard" replace />;
    }

    // All checks passed → render component
    return element;
}
```

### **Scenario: Regular User Accessing `/admin`**

```
1. User (role=USER) navigates to /admin
2. ProtectedRoute evaluates:
   ├─ isAuth = true ✓
   ├─ userRole = "USER"
   ├─ requiredRole = "ADMIN"
   ├─ Check: USER === ADMIN? NO
   └─ Result: Redirect to /dashboard
3. User sees: Dashboard, not admin panel
```

### **Scenario: ADMIN Accessing `/expenses` (USER route)**

```
1. Admin (role=ADMIN) navigates to /expenses
2. ProtectedRoute evaluates:
   ├─ isAuth = true ✓
   ├─ userRole = "ADMIN"
   ├─ Check: ADMIN can access all = YES ✓
   └─ Result: Render expenses
3. Admin sees: Expenses page + might see admin-specific options
```

---

## 5. Token Decoding (Safe Client-Side)

### **Why Safe to Decode Client-Side?**

```
✓ Token is signed by backend
✓ Backend already verified signature
✓ We're not verifying, just reading
✓ No sensitive data exposed (no passwords)
✓ Quickly extract role for UI decisions
```

### **Token Structure**

```
JWT = Header.Payload.Signature

Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (what we decode):
{
  "sub": "johndoe",          // username
  "role": "USER",             // Role
  "userId": 1,                // User ID
  "iat": 1704067200,         // Issued at
  "exp": 1704153600          // Expires
}

Signature: Backend verified ✓
```

### **Decoding Implementation**

```javascript
function decodeToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Payload is middle part, base64 encoded
    const decoded = JSON.parse(atob(parts[1]));
    return decoded;
}

// Usage
const token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWI..."
const decoded = decodeToken(token);
console.log(decoded.role);  // "ADMIN" or "USER"
```

---

## 6. LocalStorage Management

### **What's Stored**

```javascript
// After successful login/register:

localStorage.token          // JWT token
// Format: "eyJhbGciOiJIUzI1NiJ9.eyJzdWI..."

localStorage.user          // User metadata (optional, for quick access)
// Format: { userId, username, email, role, name }

localStorage.savedCredentials  // For "Remember Me" feature
// Format: { username: "johndoe", rememberMe: true }
```

### **On Logout**

```javascript
localStorage.removeItem('token');
localStorage.removeItem('user');
localStorage.removeItem('savedCredentials');
```

---

## 7. API Integration

### **Axios Configuration**

```javascript
// src/api/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api'
});

// Add token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401/403 responses
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Clear auth and redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

---

## 8. Conditional UI Rendering

### **Example: Admin-Only Feature**

```javascript
import { hasRole, getCurrentRole } from '../utils/tokenUtils';

function Dashboard() {
    const role = getCurrentRole();
    
    return (
        <div>
            <h1>Dashboard</h1>
            
            {/* Show to all users */}
            <DashboardStats />
            
            {/* Show only to ADMIN */}
            {hasRole("ADMIN") && (
                <AdminPanel>
                    <UserManagement />
                    <SystemAnalytics />
                </AdminPanel>
            )}
            
            {/* Show only to regular USER */}
            {role === "USER" && (
                <UserOnlySection>
                    <MyExpenses />
                </UserOnlySection>
            )}
        </div>
    );
}
```

---

## 9. Error Handling

### **Common Scenarios**

```javascript
// Scenario 1: Token expired
if (isTokenExpired()) {
    logout();
    navigate('/login');
    toast.error('Session expired. Please login again.');
}

// Scenario 2: Unauthorized API call (403)
api.post('/api/admin/users').catch(err => {
    if (err.response?.status === 403) {
        toast.error('You do not have permission to access this resource');
    }
});

// Scenario 3: User manually modifies localStorage role
// Solution: Backend validates all requests, frontend role is only for UI
const decodedRole = decodeToken(token).role;
if (decodedRole !== localStorage.getItem('user')?.role) {
    logout();  // Suspicious activity
}
```

---

## 10. Complete Flow Example: Login → Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User on Login Page (/login)                              │
│    - Not authenticated (no token)                           │
│    - Can access public pages                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 2. Enter Credentials → POST /api/auth/login                │
│    {                                                         │
│      "username": "johndoe",                                 │
│      "password": "password123"                              │
│    }                                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 3. Backend Validates & Returns JWT                          │
│    {                                                         │
│      "token": "eyJhbGciOiJIUzI1NiJ9...",                  │
│      "role": "USER",                                        │
│      "userId": 1,                                           │
│      "username": "johndoe",                                 │
│      "email": "john@gmail.com"                             │
│    }                                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 4. Frontend Stores Data                                      │
│    localStorage.token = "eyJhbGciOiJIUzI1NiJ9..."          │
│    localStorage.user = {                                     │
│      "userId": 1,                                           │
│      "username": "johndoe",                                 │
│      "role": "USER",                                        │
│      "email": "john@gmail.com"                             │
│    }                                                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 5. Decode Token & Extract Role                              │
│    const decoded = decodeToken(token)                       │
│    const role = decoded.role  // "USER"                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 6. Redirect Based on Role                                   │
│    if (role === "ADMIN") navigate("/admin")                 │
│    else navigate("/dashboard")                              │
│                                                              │
│    → Navigate to /dashboard                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 7. Route Protection Check                                   │
│    <ProtectedRoute element={<Dashboard />} requiredRole="USER" />
│                                                              │
│    ✓ isAuthenticated() = true                              │
│    ✓ getCurrentRole() = "USER"                             │
│    ✓ requiredRole = "USER"                                 │
│    → RENDER Dashboard                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ 8. Dashboard Renders                                        │
│    - Shows user's own expenses                             │
│    - Shows user's own categories                           │
│    - Hides admin features (if checked with hasRole)        │
│    - API calls include Authorization header with token    │
│                                                              │
│    → User fully authenticated and viewing dashboard         │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Testing Checklist

- [ ] User registration as USER (email: any@any.com)
- [ ] Admin registration with company email (admin@company.com)
- [ ] Admin registration with non-company email (falls back to USER)
- [ ] Login as USER → redirects to /dashboard
- [ ] Login as ADMIN → redirects to /admin
- [ ] USER accessing /admin → redirects to /dashboard
- [ ] ADMIN accessing /dashboard → works fine (can access everything)
- [ ] Token expired → automatic logout + redirect to login
- [ ] Logout → clears all localStorage data
- [ ] "Remember Me" functionality works
- [ ] Role-based UI rendering (admin features hidden from USER)
- [ ] API calls include Authorization header
- [ ] 403 Forbidden responses handled gracefully
- [ ] Navigation sidebar shows different options based on role

---

## 12. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| User not redirected after login | Token not stored | Check localStorage after login |
| Role always undefined | Token not decoded correctly | Verify token structure in devtools |
| ProtectedRoute shows blank page | Component not rendering | Check console for errors |
| ADMIN can't access admin routes | Role extraction failed | Verify JwtUtil.generateToken includes role |
| API calls fail with 401 | Token not in Authorization header | Check axios interceptor |
| Remember Me doesn't work | localStorage cleared | Check browser's localStorage settings |
| Role changes not reflected | Frontend caching | Clear localStorage and re-login |

---

## 13. Security Considerations

✅ **Safe**
- Decoding JWT client-side (already verified by backend)
- Storing JWT in localStorage (vulnerable but acceptable for SPAs)
- Extracting role for UI decisions

⚠️ **Caution**
- Don't trust frontend role for backend validation
- Always validate on backend
- Don't expose sensitive data in token

❌ **Never Do**
- Trust client-side role verification for sensitive operations
- Store passwords in localStorage
- Send credentials in URL parameters
- Log JWT tokens to console in production

---

## 14. Future Enhancements

1. **Refresh Tokens**: 24-hour tokens are short-lived. Add refresh token mechanism.
2. **Role Caching**: Cache decoded token to reduce decoding overhead
3. **XRP Token Rotation**: Update token with each request
4. **Two-Factor Authentication**: Add 2FA for admin accounts
5. **Session Management**: Track active sessions, allow logout all devices
6. **Audit Logging**: Log admin actions with timestamps
7. **API Rate Limiting**: Prevent brute force attacks
8. **Claim-Based Auth**: Use more granular claims than just role

