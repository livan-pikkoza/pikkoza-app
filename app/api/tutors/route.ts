import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const availableOnly = searchParams.get('availableNow') === 'true';
    const maxRate = searchParams.get('maxRate');
    const minRating = searchParams.get('minRating');

    const authUser = await getUserFromCookies();
    const isAdmin = authUser?.role === 'admin';

    // Public tutors must be active and have both synchronized approval fields approved.
    let whereClause: Record<string, unknown>;

    if (isAdmin) {
      whereClause = {
        role: 'TUTOR',
        status: 'ACTIVE',
      };
    } else {
      whereClause = {
        AND: [
          { role: 'TUTOR' },
          { status: 'ACTIVE' },
          { verificationStatus: 'APPROVED' },
          { tutorProfile: { verificationStatus: 'APPROVED' } },
        ],
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        tutorProfile: {
          include: { availabilitySlots: true },
        },
        reviewsReceived: {
          select: { rating: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    let tutors = users
      .filter((u) => u.tutorProfile !== null)
      .map((u) => {
        const profile = u.tutorProfile!;
        const reviews = u.reviewsReceived;
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar || undefined,
          title: profile.qualifications || 'Expert Tutor',
          institute: profile.institute || 'IIT Alumni',
          rating: parseFloat(avgRating.toFixed(1)),
          reviewCount: reviews.length,
          hourlyRate: profile.hourlyRate,
          subjects: profile.teachingSubjects,
          bio: profile.bio || 'Passionate educator helping students clear concepts.',
          availableNow: profile.isAvailableNow,
          verificationStatus: (profile.verificationStatus || u.verificationStatus || 'PENDING').toLowerCase(),
          weeklySlots: profile.availabilitySlots.map((s) => ({
            day: s.day,
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        };
      });

    // Apply filters
    if (subject) {
      tutors = tutors.filter((t) =>
        t.subjects.some((s) => s.toLowerCase().includes(subject.toLowerCase()))
      );
    }
    if (availableOnly) {
      tutors = tutors.filter((t) => t.availableNow);
    }
    if (maxRate) {
      const rate = parseInt(maxRate, 10);
      if (!isNaN(rate)) {
        tutors = tutors.filter((t) => t.hourlyRate <= rate);
      }
    }
    if (minRating) {
      const rating = parseFloat(minRating);
      if (!isNaN(rating)) {
        tutors = tutors.filter((t) => t.rating >= rating);
      }
    }

    return NextResponse.json({ tutors });
  } catch (error) {
    console.error('GET /api/tutors error:', error);
    return NextResponse.json({ error: 'Failed to fetch tutors' }, { status: 500 });
  }
}
