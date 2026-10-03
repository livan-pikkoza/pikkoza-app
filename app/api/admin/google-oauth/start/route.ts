import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createGoogleOAuthClient, GOOGLE_CALENDAR_SCOPE } from '@/lib/google-oauth';
import { enforceRateLimit } from '@/lib/api-security';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const limited = await enforceRateLimit(request, 'admin-oauth-start', 5, 15 * 60 * 1000, admin.id);
  if (limited) return limited;

  try {
    const state = randomBytes(32).toString('base64url');
    const authorizationUrl = createGoogleOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: ['openid', 'email', GOOGLE_CALENDAR_SCOPE],
      state,
    });

    const response = NextResponse.redirect(authorizationUrl);
    response.cookies.set('pikkoza_google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60,
      path: '/api/admin/google-oauth/callback',
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/admin/settings?googleCalendar=configuration-error', request.url));
  }
}
