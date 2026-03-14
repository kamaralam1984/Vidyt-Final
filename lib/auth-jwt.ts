/**
 * Pure JWT authentication functions (no database)
 * Can be used in Edge Runtime (middleware)
 * Uses 'jose' for Edge Runtime compatibility, 'jsonwebtoken' for Node.js runtime
 */
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';

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

export type UserRole = 'user' | 'manager' | 'admin' | 'super-admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscription: 'free' | 'pro' | 'enterprise';
}

/**
 * Generate JWT token (Node.js runtime - uses jsonwebtoken)
 * For API routes that run in Node.js runtime
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscription: user.subscription,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token (Edge Runtime compatible - uses jose)
 * For middleware that runs in Edge Runtime
 */
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (!token || token.trim() === '') {
      console.warn('Empty token provided');
      return null;
    }

    // Use jose for Edge Runtime compatibility
    // HS256 is the default algorithm used by jsonwebtoken
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    });
    
    if (!payload || !payload.id) {
      console.warn('Invalid token payload');
      return null;
    }

    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name as string) || '',
      role: (payload.role as UserRole) || 'user',
      subscription: (payload.subscription as 'free' | 'pro' | 'enterprise') || 'free',
    };
  } catch (error: any) {
    // Log specific error types for debugging
    if (error.code === 'ERR_JWT_EXPIRED') {
      console.warn('Token expired');
    } else if (error.code === 'ERR_JWT_INVALID') {
      console.warn('Invalid token format:', error.message);
    } else {
      console.warn('Token verification error:', error.message);
    }
    return null;
  }
}

/**
 * Verify JWT token (synchronous version for Node.js runtime)
 * Falls back to jsonwebtoken for API routes
 */
export function verifyTokenSync(token: string): AuthUser | null {
  try {
    if (!token || token.trim() === '') {
      console.warn('Empty token provided');
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!decoded || !decoded.id) {
      console.warn('Invalid token payload');
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || '',
      role: (decoded.role as UserRole) || 'user',
      subscription: decoded.subscription || 'free',
    };
  } catch (error: any) {
    // Log specific error types for debugging
    if (error.name === 'TokenExpiredError') {
      console.warn('Token expired:', error.expiredAt);
    } else if (error.name === 'JsonWebTokenError') {
      console.warn('Invalid token format:', error.message);
    } else if (error.name === 'NotBeforeError') {
      console.warn('Token not active yet:', error.date);
    } else {
      console.warn('Token verification error:', error.message);
    }
    return null;
  }
}

/**
 * Get user from request (from Authorization header)
 * Edge Runtime compatible - no database calls
 */
export async function getUserFromRequest(request: { headers: { get: (name: string) => string | null } }): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return await verifyToken(token);
}
