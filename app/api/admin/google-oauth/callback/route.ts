import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/admin-auth';
import { createGoogleOAuthClient, GOOGLE_CALENDAR_SCOPE, saveOrganizerRefreshToken } from '@/lib/google-oauth';

export const runtime = 'nodejs';

function settingsRedirect(request: NextRequest, result: string) {
  const response = NextResponse.redirect(new URL(`/admin/settings?googleCalendar=${result}`, request.url));
  response.cookies.set('pikkoza_google_oauth_state', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/api/admin/google-oauth/callback',
  });
  return response;
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return settingsRedirect(request, 'admin-required');

  const query = request.nextUrl.searchParams;
  const returnedState = query.get('state') || '';
  const storedState = request.cookies.get('pikkoza_google_oauth_state')?.value || '';
  const stateMatches = returnedState.length === storedState.length
    && returnedState.length > 0
    && timingSafeEqual(Buffer.from(returnedState), Buffer.from(storedState));

  if (!stateMatches) return settingsRedirect(request, 'state-error');
  if (query.has('error')) return settingsRedirect(request, 'authorization-denied');

  const code = query.get('code');
  if (!code) return settingsRedirect(request, 'authorization-error');

  try {
    const oauthClient = createGoogleOAuthClient();
    const { tokens } = await oauthClient.getToken(code);
    if (!tokens.refresh_token) return settingsRedirect(request, 'refresh-token-missing');

    if (!tokens.id_token) return settingsRedirect(request, 'identity-missing');
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const identity = ticket.getPayload();
    const expectedEmail = process.env.GOOGLE_ORGANIZER_EMAIL?.trim().toLowerCase();
    if (!identity?.email || !identity.email_verified || identity.email.toLowerCase() !== expectedEmail) {
      return settingsRedirect(request, 'wrong-account');
    }

    if (!tokens.access_token) return settingsRedirect(request, 'calendar-scope-missing');
    const tokenInfo = await oauthClient.getTokenInfo(tokens.access_token);
    if (!tokenInfo.scopes.includes(GOOGLE_CALENDAR_SCOPE)) {
      return settingsRedirect(request, 'calendar-scope-missing');
    }

    await saveOrganizerRefreshToken(tokens.refresh_token);
    return settingsRedirect(request, 'connected');
  } catch (error) {
    const apiError = error as { code?: number | string; response?: { status?: number; data?: { error?: { code?: number; errors?: Array<{ reason?: string }> } } } };
    console.error('Google organizer authorization failed.', {
      httpStatus: apiError.response?.status,
      googleCode: apiError.response?.data?.error?.code ?? apiError.code,
      reason: apiError.response?.data?.error?.errors?.[0]?.reason,
    });
    return settingsRedirect(request, 'authorization-error');
  }
}
