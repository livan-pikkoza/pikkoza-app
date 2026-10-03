import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { isApprovedTutor, tutorApprovalRequiredResponse } from '@/lib/tutor-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getUserFromCookies();

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'tutor') {
      return NextResponse.json({ error: 'Only tutors can accept or reject doubts' }, { status: 403 });
    }

    if (!(await isApprovedTutor(authUser.id))) {
      return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'doubt-action', 30, 15 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 8 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { action } = body;

    if (action !== 'ACCEPT' && action !== 'REJECT') {
      return NextResponse.json({ error: 'Invalid action. Must be ACCEPT or REJECT' }, { status: 400 });
    }

    // Atomic update: only update if it is currently OPEN.
    // Prisma throws P2025 if no record matches (already taken by another tutor).
    try {
      const updatedDoubt = await prisma.doubt.update({
        where: {
          id,
          status: 'OPEN'
        },
        data: {
          status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
          tutorId: authUser.id
        }
      });

      await prisma.notification.create({
        data: {
          userId: updatedDoubt.studentId,
          type: `DOUBT_${action}`,
          title: `Doubt ${action === 'ACCEPT' ? 'Accepted' : 'Rejected'}`,
          message: `Your doubt regarding ${updatedDoubt.subject} was ${action === 'ACCEPT' ? 'accepted' : 'rejected'}.`,
        }
      });

      return NextResponse.json({ success: true, doubt: updatedDoubt });
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: 'This doubt is no longer available (it may have been accepted by another tutor).' },
          { status: 409 }
        );
      }
      throw e;
    }

  } catch (error) {
    console.error('PATCH /api/doubts/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
