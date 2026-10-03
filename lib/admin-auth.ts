import { getUserFromCookies } from '@/lib/auth';

/**
 * Verifies the request is from an authenticated admin.
 * Returns the decoded JWT payload or null.
 */
export async function verifyAdmin() {
  const user = await getUserFromCookies();
  if (!user || user.role !== 'admin') return null;
  return user;
}
