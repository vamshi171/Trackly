/**
 * 🔐 JWT Token Decoder Utility
 * Decodes JWT token to extract role, userId, and other claims
 * Safe client-side decoding (no verification needed - backend verified it)
 */

/**
 * Decode JWT token without verification
 * Token is already verified by backend - we just extract claims
 * @param {string} token JWT token
 * @returns {object} Decoded token payload
 */
export const decodeToken = (token) => {
    if (!token) return null;

    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const decoded = JSON.parse(atob(parts[1]));
        return decoded;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

/**
 * Get role from current token
 * @returns {string|null} Role (USER or ADMIN) or null
 */
export const getCurrentRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded = decodeToken(token);
    return decoded?.role || null;
};

/**
 * Get userId from current token
 * @returns {number|null} User ID or null
 */
export const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded = decodeToken(token);
    return decoded?.userId || null;
};

/**
 * Get username from current token
 * @returns {string|null} Username or null
 */
export const getCurrentUsername = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const decoded = decodeToken(token);
    return decoded?.sub || null;
};

/**
 * Check if token is expired
 * @returns {boolean} true if expired, false otherwise
 */
export const isTokenExpired = () => {
    const token = localStorage.getItem('token');
    if (!token) return true;

    const decoded = decodeToken(token);
    if (!decoded?.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    const expirationTime = decoded.exp * 1000;
    return Date.now() >= expirationTime;
};

/**
 * Check if user has a specific role
 * @param {string} requiredRole Role to check (USER or ADMIN)
 * @returns {boolean}
 */
export const hasRole = (requiredRole) => {
    const role = getCurrentRole();
    if (!role) return false;

    if (requiredRole === 'ADMIN') {
        return role === 'ADMIN';
    } else if (requiredRole === 'USER') {
        // USER role can access USER routes
        return role === 'USER' || role === 'ADMIN'; // ADMIN can access all
    }

    return false;
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token && !isTokenExpired();
};

/**
 * Logout user (clear localStorage)
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('savedCredentials');
};
