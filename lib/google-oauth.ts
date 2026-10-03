import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events.owned';
const ORGANIZER_CREDENTIAL_ID = 'organizer';

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri || !process.env.GOOGLE_ORGANIZER_EMAIL) {
    throw new Error('Google OAuth is not configured.');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getEncryptionKey(): Buffer {
  const encodedKey = process.env.GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!encodedKey) throw new Error('Google OAuth token encryption is not configured.');

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new Error('Google OAuth token encryption key must decode to 32 bytes.');
  return key;
}

function encryptRefreshToken(refreshToken: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(refreshToken, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString('base64url')}:${authTag.toString('base64url')}:${ciphertext.toString('base64url')}`;
}

function decryptRefreshToken(encryptedValue: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext] = encryptedValue.split(':');
  if (version !== 'v1' || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error('Stored Google OAuth credential has an unsupported format.');
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(encodedIv, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function createGoogleOAuthClient(): OAuth2Client {
  getEncryptionKey();
  return getOAuthClient();
}

export async function saveOrganizerRefreshToken(refreshToken: string): Promise<void> {
  const encryptedRefreshToken = encryptRefreshToken(refreshToken);
  await prisma.googleOAuthCredential.upsert({
    where: { id: ORGANIZER_CREDENTIAL_ID },
    create: { id: ORGANIZER_CREDENTIAL_ID, encryptedRefreshToken },
    update: { encryptedRefreshToken },
  });
}

export async function hasOrganizerGoogleAuthorization(): Promise<boolean> {
  const credential = await prisma.googleOAuthCredential.findUnique({
    where: { id: ORGANIZER_CREDENTIAL_ID },
    select: { encryptedRefreshToken: true },
  });
  if (!credential) return false;

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: decryptRefreshToken(credential.encryptedRefreshToken) });
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) return false;
  const tokenInfo = await client.getTokenInfo(accessToken.token);
  return tokenInfo.scopes.includes(GOOGLE_CALENDAR_SCOPE);
}

export async function getOrganizerGoogleOAuthClient(): Promise<OAuth2Client> {
  const credential = await prisma.googleOAuthCredential.findUnique({
    where: { id: ORGANIZER_CREDENTIAL_ID },
    select: { encryptedRefreshToken: true },
  });

  if (!credential) throw new Error('Google organizer account has not been connected.');

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: decryptRefreshToken(credential.encryptedRefreshToken) });
  return client;
}
