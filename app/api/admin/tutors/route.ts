import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tutors = await prisma.user.findMany({
      where: { role: 'TUTOR' },
      include: { tutorProfile: true },
      orderBy: { createdAt: 'desc' }
    });

    const mappedTutors = tutors.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      status: t.status,
      verificationStatus: t.tutorProfile?.verificationStatus || 'PENDING',
      qualifications: t.tutorProfile?.qualifications || 'Not provided',
      subjects: t.tutorProfile?.teachingSubjects || [],
      joinedAt: t.createdAt.toISOString()
    }));

    return NextResponse.json({ success: true, tutors: mappedTutors });
  } catch (error) {
    console.error('GET /api/admin/tutors error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'admin-mutation', 60, 15 * 60 * 1000, admin.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (action === 'VERIFY' || action === 'REJECT') {
      const newStatus = action === 'VERIFY' ? 'APPROVED' : 'REJECTED';
      
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { tutorProfile: true } });
      if (!user || !user.tutorProfile) {
        return NextResponse.json({ error: 'Tutor profile not found' }, { status: 404 });
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { verificationStatus: newStatus },
        }),
        prisma.tutorProfile.update({
          where: { userId },
          data: { verificationStatus: newStatus }
        }),
      ]);

      // Optional: Send notification to the tutor
      await prisma.notification.create({
        data: {
          userId,
          type: 'VERIFICATION_UPDATE',
          title: 'Profile Verification',
          message: `Your tutor profile has been ${newStatus.toLowerCase()}.`,
        }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/admin/tutors error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
