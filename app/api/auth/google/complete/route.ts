import { NextResponse } from 'next/server';
import { enforceRateLimit, readJson } from '@/lib/api-security';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { requestMatchesFirebaseIdentity, verifyFirebaseIdToken } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'auth-google-complete', 5, 15 * 60 * 1000);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { email, firebaseUid, idToken, role = 'student', targetExam, qualifications, hourlyRate } = body;

    const identity = await verifyFirebaseIdToken(idToken);
    if (!identity || !requestMatchesFirebaseIdentity({ email, firebaseUid }, identity)) {
      return NextResponse.json({ error: 'Invalid Firebase identity' }, { status: 401 });
    }

    // Never allow ADMIN creation via Google signup
    if (role === 'admin' || role === 'ADMIN') {
      return NextResponse.json(
        { error: 'ADMIN accounts cannot be created via public Google signup' },
        { status: 403 }
      );
    }

    const allowedRoles = ['student', 'tutor'];
    const safeRole = allowedRoles.includes(role) ? role : 'student';
    const normalizedEmail = identity.email;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { firebaseUid: identity.uid },
          { email: normalizedEmail },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 400 }
      );
    }

    // Generate random internal password for OAuth user
    const randomPass = Math.random().toString(36).slice(-12) + '!#A9';
    const hashedPassword = await bcrypt.hash(randomPass, 12);

    const dbRole = safeRole === 'tutor' ? 'TUTOR' : 'STUDENT';
    const isTutor = dbRole === 'TUTOR';

    const newUser = await prisma.user.create({
      data: {
        name: identity.name || (isTutor ? 'Google Tutor' : 'Google Student'),
        email: normalizedEmail,
        password: hashedPassword,
        firebaseUid: identity.uid,
        avatar: identity.photoURL || null,
        role: dbRole,
        verificationStatus: isTutor ? 'PENDING' : 'APPROVED',
        ...(isTutor
          ? {
              tutorProfile: {
                create: {
                  qualifications: qualifications || 'Expert Tutor',
                  hourlyRate: Number(hourlyRate) || 199,
                  verificationStatus: 'PENDING',
                  bio: 'Expert educator helping students clear doubts.',
                },
              },
            }
          : {
              profile: {
                create: {
                  targetExam: targetExam || 'JEE Main & Advanced',
                  grade: 'Class 12',
                },
              },
            }),
      },
      include: {
        profile: true,
        tutorProfile: true,
      },
    });

    const token = signToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.toLowerCase(),
    });

    const userObj = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone || undefined,
      avatar: newUser.avatar || undefined,
      firebaseUid: newUser.firebaseUid || undefined,
      role: newUser.role.toLowerCase() as 'student' | 'tutor',
      status: newUser.status.toLowerCase() as 'active' | 'suspended',
      verificationStatus: newUser.verificationStatus?.toLowerCase() as 'pending' | 'approved' | 'rejected',
      targetExam: newUser.profile?.targetExam || undefined,
      qualifications: newUser.tutorProfile?.qualifications || undefined,
      hourlyRate: newUser.tutorProfile?.hourlyRate || undefined,
      createdAt: newUser.createdAt.toISOString(),
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
    console.error('Google completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete Google account registration' },
      { status: 500 }
    );
  }
}
