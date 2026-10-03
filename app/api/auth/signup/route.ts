import { NextResponse } from 'next/server';
import { enforceRateLimit, readJson } from '@/lib/api-security';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { requestMatchesFirebaseIdentity, verifyFirebaseIdToken } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, 'auth-signup', 5, 60 * 60 * 1000);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { name, email, password, role = 'student', firebaseUid, idToken, targetExam, qualifications, hourlyRate } = body;

    if (typeof password !== 'string' || !password || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Signup tokens prove Firebase UID/email ownership, but the user may not
    // have clicked the email-verification link yet.
    const identity = await verifyFirebaseIdToken(idToken, false);
    if (!identity || !requestMatchesFirebaseIdentity({ email, firebaseUid }, identity)) {
      return NextResponse.json({ error: 'A valid Firebase identity is required' }, { status: 401 });
    }

    // Minimum password length validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = identity.email;

    // Reject admin role signup via public API
    if (role === 'admin' || role === 'ADMIN') {
      return NextResponse.json(
        { error: 'ADMIN accounts cannot be created via public signup' },
        { status: 403 }
      );
    }
    const allowedRoles = ['student', 'tutor'];
    const safeRole = allowedRoles.includes(role) ? role : 'student';

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { firebaseUid: identity.uid },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address or identity already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const dbRole = safeRole === 'tutor' ? 'TUTOR' : 'STUDENT';
    const isTutor = dbRole === 'TUTOR';

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        firebaseUid: identity.uid,
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create user account' },
      { status: 500 }
    );
  }
}
