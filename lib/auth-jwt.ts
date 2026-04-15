/**
 * Pure JWT authentication functions (no database)
 * Fully compatible with Edge Runtime (middleware)
 * Uses 'jose' for both Edge and Node.js runtimes
 *
 * Token strategy:
 *   - Access token:  15 minutes — sent in Authorization header
 *   - Refresh token: 30 days   — stored in httpOnly cookie "refresh_token"
 */
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret-change-in-production';

// Access token: 15 min (short-lived, stateless revocation via short TTL)
const ACCESS_TOKEN_TTL = '15m';
// Refresh token: 30 days (stored httpOnly, rotated on each refresh)
const REFRESH_TOKEN_TTL = '30d';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('⚠️  JWT_SECRET is using default value. Set a secure secret in .env.local');
}

const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);
const getRefreshKey = () => new TextEncoder().encode(REFRESH_SECRET);

export type UserRole = 'user' | 'manager' | 'admin' | 'super-admin' | 'enterprise';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscription: 'free' | 'pro' | 'enterprise';
}

/**
 * Generate short-lived access token (15 min)
 */
export async function generateToken(user: AuthUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscription: user.subscription,
    type: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecretKey());
}

/**
 * Generate long-lived refresh token (30 days)
 * Only contains userId — no sensitive claims
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ id: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getRefreshKey());
}

/**
 * Verify access token
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (!token || token.trim() === '') return null;
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ['HS256'] });
    if (!payload?.id) return null;
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      role: (payload.role as UserRole) || 'user',
      subscription: (payload.subscription as 'free' | 'pro' | 'enterprise') || 'free',
    };
  } catch {
    return null;
  }
}

/**
 * Verify refresh token — returns userId only
 */
export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    if (!token?.trim()) return null;
    const { payload } = await jwtVerify(token, getRefreshKey(), { algorithms: ['HS256'] });
    if (!payload?.id || payload.type !== 'refresh') return null;
    return payload.id as string;
  } catch {
    return null;
  }
}

/**
 * Sync-compatible version (SAFE fallback)
 * @deprecated Use async verifyToken instead
 */
export function verifyTokenSync(_token: string): AuthUser | null {
  console.warn('⚠️ verifyTokenSync is deprecated. Use async verifyToken instead.');
  return null;
}

/**
 * Get user from request (Authorization header)
 */
export async function getUserFromRequest(
  request: { headers: { get: (name: string) => string | null } }
): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return verifyToken(authHeader.substring(7));
}
