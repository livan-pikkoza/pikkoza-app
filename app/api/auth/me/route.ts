import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    // Support both cookie auth (primary) and Authorization header (legacy)
    let user = await getUserFromCookies();

    if (!user) {
      // Fallback: Authorization: Bearer <token>
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const { signToken } = await import('@/lib/auth');
        const jwt = await import('jsonwebtoken');
        try {
          const token = authHeader.slice(7);
          const secret = process.env.JWT_SECRET;
          if (secret) {
            user = jwt.default.verify(token, secret) as unknown as { id: string; email: string; role: 'student' | 'tutor' | 'admin' };
          }
        } catch {
          // invalid token — fall through to 401
        }
      }
    }

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profile: true,
        tutorProfile: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    if (dbUser.status !== 'ACTIVE') {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const userObj = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      phone: dbUser.phone || undefined,
      avatar: dbUser.avatar || undefined,
      role: dbUser.role.toLowerCase() as 'student' | 'tutor' | 'admin',
      status: dbUser.status.toLowerCase() as 'active' | 'suspended',
      verificationStatus: (dbUser.tutorProfile?.verificationStatus || dbUser.verificationStatus || 'APPROVED').toLowerCase() as 'pending' | 'approved' | 'rejected',
      grade: dbUser.profile?.grade || undefined,
      stream: dbUser.profile?.stream || undefined,
      targetExam: dbUser.profile?.targetExam || undefined,
      interestedSubjects: dbUser.profile?.interestedSubjects || undefined,
      bio: dbUser.tutorProfile?.bio || undefined,
      institute: dbUser.tutorProfile?.institute || undefined,
      qualifications: dbUser.tutorProfile?.qualifications || undefined,
      experienceYears: dbUser.tutorProfile?.experienceYears || undefined,
      hourlyRate: dbUser.tutorProfile?.hourlyRate || undefined,
      teachingSubjects: dbUser.tutorProfile?.teachingSubjects || undefined,
      createdAt: dbUser.createdAt.toISOString(),
    };

    return NextResponse.json({ user: userObj });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
