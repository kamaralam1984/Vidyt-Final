/**
 * Pure JWT authentication functions (no database)
 * Fully compatible with Edge Runtime (middleware)
 * Uses 'jose' for both Edge and Node.js runtimes
 */
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Validate JWT_SECRET is set
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your-secret-key-change-in-production') {
  console.warn('⚠️  JWT_SECRET is using default value. Please set a secure secret in .env.local');
}

// Create secret key for jose (Edge Runtime compatible)
const getSecretKey = () => {
  return new TextEncoder().encode(JWT_SECRET);
};

export type UserRole = 'user' | 'manager' | 'admin' | 'super-admin' | 'enterprise';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscription: 'free' | 'pro' | 'enterprise';
}

/**
 * Generate JWT token
 */
export async function generateToken(user: AuthUser): Promise<string> {
  const secretKey = getSecretKey();

  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    subscription: user.subscription,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secretKey);
}

/**
 * Verify JWT token (async - recommended)
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (!token || token.trim() === '') return null;

    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    });

    if (!payload || !payload.id) return null;

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
 * Sync-compatible version (SAFE fallback)
 * ⚠️ Returns null always in Edge (no blocking allowed)
 * 👉 Use verifyToken (async) instead
 */
export function verifyTokenSync(token: string): AuthUser | null {
  console.warn("⚠️ verifyTokenSync is deprecated. Use async verifyToken instead.");
  return null;
}

/**
 * Get user from request (Authorization header)
 */
export async function getUserFromRequest(request: { headers: { get: (name: string) => string | null } }): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  return await verifyToken(token);
}