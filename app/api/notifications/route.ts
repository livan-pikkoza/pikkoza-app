import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

export async function GET() {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: authUser.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const limited = await enforceRateLimit(req, 'notification-mutation', 60, 15 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 8 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { id } = body;

    if (id) {
      // Mark specific notification as read — verify ownership first
      const notification = await prisma.notification.findUnique({ where: { id } });
      if (!notification || notification.userId !== authUser.id) {
        return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
      }
      await prisma.notification.update({
        where: { id },
        data: { read: true },
      });
    } else {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: { userId: authUser.id, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
