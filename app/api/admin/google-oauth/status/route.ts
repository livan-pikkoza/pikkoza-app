import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { hasOrganizerGoogleAuthorization } from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const connected = await hasOrganizerGoogleAuthorization();
    return NextResponse.json({ connected });
  } catch {
    return NextResponse.json({ error: 'Unable to check Google Calendar connection.' }, { status: 500 });
  }
}
