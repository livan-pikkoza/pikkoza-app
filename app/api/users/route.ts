import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

// GET /api/users - Admin: list all users
export async function GET(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser || authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    const whereClause: Record<string, unknown> = {};
    if (roleFilter) {
      whereClause.role = roleFilter.toUpperCase();
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        tutorProfile: {
          include: { availabilitySlots: true },
        },
        reviewsReceived: { select: { rating: true } },
        _count: {
          select: {
            studentSessions: true,
            tutorSessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = users.map((u) => {
      const reviews = u.reviewsReceived;
      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role.toLowerCase(),
        status: u.status.toLowerCase(),
        verificationStatus: u.verificationStatus?.toLowerCase(),
        grade: u.profile?.grade,
        targetExam: u.profile?.targetExam,
        hourlyRate: u.tutorProfile?.hourlyRate,
        qualifications: u.tutorProfile?.qualifications,
        rating: parseFloat(avgRating.toFixed(1)),
        reviewCount: reviews.length,
        sessionCount:
          u.role === 'STUDENT'
            ? u._count.studentSessions
            : u._count.tutorSessions,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ users: mapped });
  } catch (error: unknown) {
    console.error('GET /api/users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
