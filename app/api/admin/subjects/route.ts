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

    const subjects = await prisma.subject.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    console.error('GET /api/admin/subjects error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'admin-mutation', 60, 15 * 60 * 1000, admin.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const { name, category } = parsed.data;

    if (!name || !category) {
      return NextResponse.json({ error: 'Missing name or category' }, { status: 400 });
    }

    const existing = await prisma.subject.findUnique({
      where: { name }
    });

    if (existing) {
      return NextResponse.json({ error: 'Subject already exists' }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: { name, category }
    });

    return NextResponse.json({ success: true, subject });
  } catch (error) {
    console.error('POST /api/admin/subjects error:', error);
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
    const { id, subjectId, status } = parsed.data;
    const targetId = subjectId || id;

    if (!targetId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const updated = await prisma.subject.update({
      where: { id: targetId },
      data: { status }
    });

    return NextResponse.json({ success: true, subject: updated });
  } catch (error) {
    console.error('PATCH /api/admin/subjects error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
