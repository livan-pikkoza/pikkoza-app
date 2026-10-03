import 'server-only';

import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { VerifiedFirebaseIdentity } from '@/lib/firebase-identity';

export { requestMatchesFirebaseIdentity } from '@/lib/firebase-identity';

const ADMIN_APP_NAME = 'pikkoza-firebase-admin';

function getFirebaseAdminApp() {
  const existingApp = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existingApp) return getApp(ADMIN_APP_NAME);

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('Firebase Admin project ID is not configured.');
  }
  if (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    && process.env.FIREBASE_ADMIN_PROJECT_ID
    && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('Firebase client and Admin project IDs do not match.');
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new Error('Firebase Admin service-account credentials are incomplete.');
  }

  const credential = clientEmail && privateKey
    ? cert({ projectId, clientEmail, privateKey })
    : applicationDefault();

  return initializeApp({ projectId, credential }, ADMIN_APP_NAME);
}

/** Verifies signature, expiry, project audience and (optionally) token revocation. */
export async function verifyFirebaseIdToken(
  idToken: unknown,
  requireVerifiedEmail = true
): Promise<VerifiedFirebaseIdentity | null> {
  if (typeof idToken !== 'string' || !idToken.trim()) return null;

  let decoded;
  try {
    decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken, true);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if ([
      'auth/argument-error',
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/invalid-id-token',
      'auth/user-disabled',
      'auth/user-not-found',
    ].includes(code || '')) {
      return null;
    }
    throw error;
  }
  const email = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : '';
  if (!decoded.uid || !email || (requireVerifiedEmail && decoded.email_verified !== true)) {
    return null;
  }

  return {
    uid: decoded.uid,
    email,
    emailVerified: decoded.email_verified === true,
    name: typeof decoded.name === 'string' ? decoded.name : undefined,
    photoURL: typeof decoded.picture === 'string' ? decoded.picture : undefined,
  };
}
