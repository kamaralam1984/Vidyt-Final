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
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
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
      subscription: user.subscription as any,
    };
  } catch (error) {
    // Fallback to JWT data if DB fails
    return jwtUser;
  }
}

/**
 * Register new user
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  companyName?: string,
  phone?: string,
  loginPin?: string
): Promise<{ user: AuthUser; token: string; uniqueId?: string }> {
  await connectDB();

  // Check if user exists (including temporary users created during OTP flow)
  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.password) {
    throw new Error('User already exists');
  }

  // If temporary user exists (from OTP flow), update it; otherwise create new
  let user;
  if (existingUser && !existingUser.password) {
    // Update temporary user
    user = existingUser;
    if (!user.uniqueId) {
      user.uniqueId = await generateUniqueNumericId();
    }
    user.password = await hashPassword(password);
    user.name = name;
    if (companyName) user.companyName = companyName;
    if (phone) user.phone = phone;
    if (loginPin) user.loginPin = loginPin;
    user.role = 'user';
    user.subscription = 'free';
    await user.save();
  } else {
    // Create new user
    user = new User({
      uniqueId: await generateUniqueNumericId(),
      email,
      password: await hashPassword(password),
      name,
      companyName: companyName || undefined,
      phone: phone || undefined,
      loginPin: loginPin || undefined,
      role: 'user',
      subscription: 'free',
      emailVerified: false, // Will be verified via OTP before payment
      createdAt: new Date(),
    });
    await user.save();
  }


  const authUser: AuthUser = {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role as any,
    subscription: user.subscription as any,
  };

  const token = generateToken(authUser);

  return { user: authUser, token, uniqueId: user.uniqueId };
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
  user.lastLogin = new Date();
  user.role = role;
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
  user.lastLogin = new Date();
  user.role = role;
  await user.save();

  return { user: authUser, token };
}

/**
 * Get role from plan: Free → user, Pro → manager, Enterprise → admin. Super-admin is always preserved.
 */
export function getRoleFromPlanAndUser(user: { role?: string; subscription?: string; subscriptionPlan?: { planId?: string } }): 'user' | 'admin' | 'manager' | 'super-admin' {
  if (user.role === 'super-admin') return 'super-admin';
  const plan = (user.subscriptionPlan?.planId || user.subscription || 'free').toLowerCase();
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
