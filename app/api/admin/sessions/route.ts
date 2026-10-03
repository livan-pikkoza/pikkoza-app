import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const sessions = await prisma.session.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        date: true,
        time: true,
        durationMinutes: true,
        price: true,
        status: true,
        createdAt: true,
        student: {
          select: { id: true, name: true, email: true },
        },
        tutor: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error('GET /api/admin/sessions error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
