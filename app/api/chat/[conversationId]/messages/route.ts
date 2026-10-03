import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { isApprovedTutor, tutorApprovalRequiredResponse } from '@/lib/tutor-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

const MAX_MESSAGE_LENGTH = 2000;

export async function GET(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'tutor' && !(await isApprovedTutor(authUser.id))) {
      return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
    }

    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.studentId !== authUser.id && conversation.tutorId !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    // Mark received messages as read
    const unreadIds = messages
      .filter(m => !m.read && m.senderId !== authUser.id)
      .map(m => m.id);
    if (unreadIds.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: unreadIds } },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('GET /api/chat/[conversationId]/messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'tutor' && !(await isApprovedTutor(authUser.id))) {
      return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'chat-message', 30, 5 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 8 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { text } = body;

    if (!text || !String(text).trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    if (typeof text !== 'string' || text.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: 'Message is too long or invalid.' }, { status: 400 });
    const trimmedText = text.trim();

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        student: { select: { name: true } },
        tutor: { select: { name: true } }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.studentId !== authUser.id && conversation.tutorId !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: authUser.id,
        text: trimmedText,
      },
    });

    // Notify the recipient
    const recipientId = authUser.id === conversation.studentId
      ? conversation.tutorId
      : conversation.studentId;
    const senderName = authUser.id === conversation.studentId
      ? conversation.student.name
      : conversation.tutor.name;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'NEW_MESSAGE',
        title: `New Message from ${senderName}`,
        message: trimmedText.length > 50 ? trimmedText.substring(0, 47) + '...' : trimmedText,
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('POST /api/chat/[conversationId]/messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
