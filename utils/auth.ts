/**
 * Client-side authentication utilities
 */

/**
 * Get authentication token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Set authentication token
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

/**
 * Remove authentication token
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

/**
 * Decode JWT token payload (client-side, no network call, no signature verification)
 * Returns null if token is missing, malformed or expired
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Add padding if missing
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const payload = JSON.parse(atob(base64));
    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Check if token is valid and not expired (no network call)
 */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  return decodeToken(token) !== null;
}

/**
 * Check if user is authenticated (basic check)
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Get axios config with auth header
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}
