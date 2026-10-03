import { NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/api-security';

/** Self-service account deletion is disabled; account access is managed by admins. */
export async function DELETE(req: Request) {
  const authUser = await getUserFromCookies();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const limited = await enforceRateLimit(req, 'account-sensitive', 3, 60 * 60 * 1000, authUser.id);
  if (limited) return limited;

  return NextResponse.json(
    { error: 'Self-service account deletion is disabled. Contact an administrator to manage account access.' },
    { status: 403 }
  );
}
