/**
 * Database-dependent authentication functions
 * Only use in API routes (not middleware/Edge Runtime)
 */
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import { generateToken, type AuthUser } from './auth-jwt';
import { getPlanLimits } from '@/lib/planLimits';

export const VALID_PLANS = ['free', 'starter', 'pro', 'enterprise', 'custom', 'owner'] as const;

export function normalizePlan(plan: string | undefined | null): typeof VALID_PLANS[number] {
  if (!plan) return 'free';
  const normalized = plan.toLowerCase().trim();
  return VALID_PLANS.includes(normalized as any) ? normalized as any : 'free';
}

/**
 * Generate a unique 6-digit numeric ID for user login
 */
export async function generateUniqueNumericId(): Promise<string> {
  while (true) {
    const candidate = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const existing = await User.findOne({ uniqueId: candidate });
    if (!existing) return candidate;
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Get user from request (from Authorization header)
 * Database version - fetches full user data
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  let token: string | null = null;
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else {
    // Fallback to cookie for direct browser navigation (e.g. OAuth redirects)
    const cookieToken = request.cookies.get('token')?.value;
    if (cookieToken) {
      token = cookieToken;
    }
  }

  if (!token) {
    // Middleware-provided identity: if Next middleware verified the JWT,
    // it injects x-user-* headers. This avoids relying on Authorization/cookies
    // being forwarded correctly by every client/runtime.
    const userId = request.headers.get('x-user-id');
    if (userId) {
      const role = request.headers.get('x-user-role') || 'user';
      const subscriptionRaw = request.headers.get('x-user-subscription') || 'free';
      return {
        id: userId,
        email: '',
        name: '',
        role: role as any,
        subscription: normalizePlan(subscriptionRaw) as any,
      };
    }
    return null;
  }

  // Use JWT verification first (no DB call)
  // For Node.js runtime (API routes), use sync version
  const { verifyTokenSync } = await import('./auth-jwt');
  const jwtUser = verifyTokenSync(token);

  if (!jwtUser) {
    return null;
  }

  // Optionally fetch fresh user data from DB
  try {
    await connectDB();
    const user = await User.findById(jwtUser.id);
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role as any,
      subscription: normalizePlan(user.subscription) as any,
    };
  } catch (error) {
    // Fallback to JWT data if DB fails
    return jwtUser;
  }
}



/**
 * Login user with unique ID and PIN
 */
export async function loginUserWithPin(
  uniqueId: string,
  loginPin: string
): Promise<{ user: AuthUser; token: string }> {
  await connectDB();

  // Find user by unique ID
  const user = await User.findOne({ uniqueId });
  if (!user) {
    throw new Error('Invalid unique ID or PIN');
  }

  // Verify PIN (PIN works only with unique ID)
  if (!user.loginPin || user.loginPin !== loginPin) {
    throw new Error('Invalid unique ID or PIN');
  }

  // Role by plan: super-admin preserved; else Free→user, Pro→manager, Enterprise→admin
  const role = getRoleFromPlanAndUser(user);

  const authUser: AuthUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: role,
    subscription: user.subscription as any,
  };

  const token = generateToken(authUser);

  // Update last login and role in DB
  const normalizedPlan = normalizePlan(user.subscription);
  user.lastLogin = new Date();
  user.role = role;
  user.subscription = normalizedPlan; // Ensure normalized on login
  await user.save();

  return { user: authUser, token };
}

/**
 * Login user (legacy - email + password)
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  await connectDB();

  // Find user
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // Role by plan: super-admin preserved; else Free→user, Pro→manager, Enterprise→admin
  const role = getRoleFromPlanAndUser(user);

  const authUser: AuthUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: role,
    subscription: user.subscription as any,
  };

  const token = generateToken(authUser);

  // Update last login and role in DB
  const normalizedPlan = normalizePlan(user.subscription);
  user.lastLogin = new Date();
  user.role = role;
  user.subscription = normalizedPlan; // Ensure normalized on login
  await user.save();

  return { user: authUser, token };
}

/**
 * Get role from plan: Free → user, Pro → manager, Enterprise → admin. Super-admin is always preserved.
 */
export function getRoleFromPlanAndUser(user: { role?: string; subscription?: string; subscriptionPlan?: { planId?: string } }): 'user' | 'admin' | 'manager' | 'super-admin' {
  if (user.role === 'super-admin' || user.role === 'superadmin') return 'super-admin';
  const rawPlan = user.subscriptionPlan?.planId || user.subscription || 'free';
  const plan = normalizePlan(rawPlan);
  if (plan === 'enterprise') return 'admin';
  if (plan === 'pro') return 'manager';
  return 'user';
}

/**
 * Check if user has permission
 */
export function hasPermission(user: AuthUser | null, requiredRole: 'user' | 'admin' | 'manager'): boolean {
  if (!user) return false;
  if (user.role === 'super-admin') return true;
  const roleHierarchy: Record<string, number> = { user: 1, manager: 2, admin: 3 };
  return (roleHierarchy[user.role] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
}

/**
 * Check subscription limits (plan allows feature; actual usage check is in usageCheck.checkAnalysisLimit).
 */
export function checkSubscriptionLimit(
  user: AuthUser | null,
  feature: 'videos' | 'analyses' | 'competitors'
): boolean {
  if (!user) return false;
  const limits = getPlanLimits(user.subscription);
  const limit =
    feature === 'analyses' || feature === 'videos'
      ? limits.analysesLimit
      : limits.competitorsTracked;
  return limit === -1 || limit > 0;
}
