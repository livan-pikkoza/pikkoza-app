import { NextResponse } from 'next/server';
import { enforceRateLimit, readJson } from '@/lib/api-security';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { requestMatchesFirebaseIdentity, verifyFirebaseIdToken } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'auth-login', 10, 15 * 60 * 1000);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { email, password, firebaseUid, idToken } = body;
    const includeProfiles = { profile: true, tutorProfile: true } as const;
    let normalizedEmail = '';
    let user;

    if (idToken !== undefined) {
      const identity = await verifyFirebaseIdToken(idToken);
      if (!identity || !requestMatchesFirebaseIdentity({ email, firebaseUid }, identity)) {
        return NextResponse.json({ error: 'Invalid Firebase identity' }, { status: 401 });
      }

      normalizedEmail = identity.email;
      const userByUid = await prisma.user.findUnique({
        where: { firebaseUid: identity.uid },
        include: includeProfiles,
      });
      const userByEmail = await prisma.user.findUnique({
        where: { email: identity.email },
        include: includeProfiles,
      });

      if (userByUid && userByEmail && userByUid.id !== userByEmail.id) {
        return NextResponse.json({ error: 'Firebase identity does not match this account' }, { status: 401 });
      }
      user = userByUid || userByEmail;
      if (
        user &&
        (user.email.toLowerCase() !== identity.email || (user.firebaseUid && user.firebaseUid !== identity.uid))
      ) {
        return NextResponse.json({ error: 'Firebase identity does not match this account' }, { status: 401 });
      }
      if (user && !user.firebaseUid) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid: identity.uid },
          include: includeProfiles,
        });
      }
    } else {
      // Firebase UIDs are never accepted as proof. This branch is only for legacy
      // PostgreSQL password accounts that have not yet been linked to Firebase.
      if (firebaseUid !== undefined || typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 401 });
      }
      normalizedEmail = email.toLowerCase().trim();
      user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: includeProfiles,
      });
      if (user && !(await bcrypt.compare(password, user.password))) {
        user = null;
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email address or password' },
        { status: 401 }
      );
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended by the platform administrator.' },
        { status: 403 }
      );
    }

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
    });

    const userObj = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      avatar: user.avatar || undefined,
      firebaseUid: user.firebaseUid || undefined,
      role: user.role.toLowerCase() as 'student' | 'tutor' | 'admin',
      status: user.status.toLowerCase() as 'active' | 'suspended',
      verificationStatus: user.verificationStatus?.toLowerCase() as 'pending' | 'approved' | 'rejected',
      grade: user.profile?.grade || undefined,
      stream: user.profile?.stream || undefined,
      targetExam: user.profile?.targetExam || undefined,
      qualifications: user.tutorProfile?.qualifications || undefined,
      hourlyRate: user.tutorProfile?.hourlyRate || undefined,
      createdAt: user.createdAt.toISOString(),
    };

    const response = NextResponse.json({ success: true, user: userObj });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
