import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET() {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      totalStudents,
      totalTutors,
      pendingTutors,
      totalDoubts,
      totalSessions,
      completedSessionsList
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TUTOR' } }),
      prisma.tutorProfile.count({ where: { verificationStatus: 'PENDING' } }),
      prisma.doubt.count(),
      prisma.session.count(),
      prisma.session.findMany({
        where: { status: 'COMPLETED' },
        select: { price: true }
      })
    ]);

    const totalRevenue = completedSessionsList.reduce((sum, s) => sum + s.price, 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        totalTutors,
        pendingApprovals: pendingTutors,
        totalDoubts,
        totalSessions,
        totalRevenue
      }
    });
  } catch (error) {
    console.error('GET /api/admin/dashboard error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
