/**
 * Shared server-side authentication utilities.
 * Import from here — never duplicate JWT_SECRET logic in individual routes.
 */
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

/** Reads JWT_SECRET from environment. Returns null if unconfigured without using any fallback string. */
function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('SERVER ERROR: JWT_SECRET environment variable is missing.');
    return null;
  }
  return secret;
}

export type AuthUser = {
  id: string;
  name?: string;
  email: string;
  role: string;
};

/**
 * Reads the HTTP-only 'token' cookie and verifies the JWT.
 * Returns the decoded user payload or null if unauthenticated/invalid.
 */
export async function getUserFromCookies(): Promise<AuthUser | null> {
  try {
    const secret = getJwtSecret();
    if (!secret) return null;
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;
    const tokenUser = jwt.verify(token, secret) as AuthUser;
    if (!tokenUser.id) return null;

    // Check current account status so deactivation invalidates existing JWTs.
    const currentUser = await prisma.user.findUnique({
      where: { id: tokenUser.id },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    if (!currentUser || currentUser.status !== 'ACTIVE') return null;

    return {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role.toLowerCase(),
    };
  } catch {
    return null;
  }
}

/**
 * Requires authentication. Returns the user or throws a 401 payload.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getUserFromCookies();
  if (!user) {
    throw { status: 401, message: 'Unauthorized' };
  }
  return user;
}

/**
 * Signs a new JWT for the given payload.
 */
export function signToken(payload: object, expiresIn = '7d'): string {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error('Server configuration error: JWT_SECRET environment variable is not set.');
  }
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}
