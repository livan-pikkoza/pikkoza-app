import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { isApprovedTutor, tutorApprovalRequiredResponse } from '@/lib/tutor-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'tutor' && !(await isApprovedTutor(authUser.id))) {
      return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'chat-create', 30, 15 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 8 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { studentId, tutorId, sessionId, doubtId } = body;

    if (typeof studentId !== 'string' || typeof tutorId !== 'string') {
      return NextResponse.json({ error: 'studentId and tutorId are required' }, { status: 400 });
    }

    // Caller must be one of the two participants
    if (authUser.id !== studentId && authUser.id !== tutorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      select: { role: true, status: true, verificationStatus: true, tutorProfile: { select: { verificationStatus: true } } },
    });
    if (!tutor || tutor.role !== 'TUTOR' || tutor.status !== 'ACTIVE' || tutor.verificationStatus !== 'APPROVED' || tutor.tutorProfile?.verificationStatus !== 'APPROVED') {
      return NextResponse.json({ error: 'This tutor is not available for chat.' }, { status: 403 });
    }

    if (sessionId) {
      if (typeof sessionId !== 'string') return NextResponse.json({ error: 'Invalid session reference.' }, { status: 400 });
      const session = await prisma.session.findUnique({ where: { id: sessionId }, select: { studentId: true, tutorId: true } });
      if (!session || session.studentId !== studentId || session.tutorId !== tutorId) return NextResponse.json({ error: 'Chat participants do not match this session.' }, { status: 403 });
    } else if (doubtId) {
      if (typeof doubtId !== 'string') return NextResponse.json({ error: 'Invalid doubt reference.' }, { status: 400 });
      const doubt = await prisma.doubt.findUnique({ where: { id: doubtId }, select: { studentId: true, tutorId: true, status: true } });
      if (!doubt || doubt.studentId !== studentId || doubt.tutorId !== tutorId || doubt.status !== 'ACCEPTED') return NextResponse.json({ error: 'Chat participants do not match this doubt.' }, { status: 403 });
    }

    // Look for an existing conversation for this session/doubt/pair
    let conversation = null;
    if (sessionId) {
      conversation = await prisma.conversation.findUnique({ where: { sessionId } });
    } else if (doubtId) {
      conversation = await prisma.conversation.findUnique({ where: { doubtId } });
    } else {
      conversation = await prisma.conversation.findFirst({
        where: { studentId, tutorId, sessionId: null, doubtId: null }
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          studentId,
          tutorId,
          sessionId: sessionId || null,
          doubtId: doubtId || null,
        }
      });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
