export interface VerifiedFirebaseIdentity {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  photoURL?: string;
}

/** Rejects browser-supplied identity metadata that conflicts with verified claims. */
export function requestMatchesFirebaseIdentity(
  body: { email?: unknown; firebaseUid?: unknown },
  identity: VerifiedFirebaseIdentity
): boolean {
  if (body.email !== undefined) {
    if (typeof body.email !== 'string' || body.email.trim().toLowerCase() !== identity.email) return false;
  }
  if (body.firebaseUid !== undefined) {
    if (typeof body.firebaseUid !== 'string' || body.firebaseUid !== identity.uid) return false;
  }
  return true;
}
