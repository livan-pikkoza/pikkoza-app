import { NextResponse } from 'next/server';
import { enforceRateLimit, readJson } from '@/lib/api-security';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { requestMatchesFirebaseIdentity, verifyFirebaseIdToken } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'auth-google', 10, 15 * 60 * 1000);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { email, firebaseUid, idToken } = body;
    const identity = await verifyFirebaseIdToken(idToken);
    if (!identity || !requestMatchesFirebaseIdentity({ email, firebaseUid }, identity)) {
      return NextResponse.json({ error: 'Invalid Firebase identity' }, { status: 401 });
    }

    const includeProfiles = { profile: true, tutorProfile: true } as const;
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

    let user = userByUid || userByEmail;
    if (user && (user.email.toLowerCase() !== identity.email || (user.firebaseUid && user.firebaseUid !== identity.uid))) {
      return NextResponse.json({ error: 'Firebase identity does not match this account' }, { status: 401 });
    }

    if (!user) {
      // New Google user — requires role selection (Student vs Tutor)
      return NextResponse.json({
        isNewUser: true,
        email: identity.email,
        name: identity.name || 'Google User',
        firebaseUid: identity.uid,
        photoURL: identity.photoURL,
      });
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended by the platform administrator.' },
        { status: 403 }
      );
    }

    // Existing active user found — link firebaseUid if missing and update avatar if provided
    if (!user.firebaseUid || (identity.photoURL && !user.avatar)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: user.firebaseUid || identity.uid,
          avatar: user.avatar || identity.photoURL || null,
        },
        include: includeProfiles,
      });
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

    const response = NextResponse.json({ isNewUser: false, success: true, user: userObj });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Google Auth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}
