import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { isApprovedTutor, tutorApprovalRequiredResponse } from '@/lib/tutor-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'student') {
      const doubts = await prisma.doubt.findMany({
        where: { studentId: authUser.id },
        include: {
          tutor: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return NextResponse.json({ doubts });
    } else if (authUser.role === 'tutor') {
      if (!(await isApprovedTutor(authUser.id))) {
        return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
      }

      const doubts = await prisma.doubt.findMany({
        where: {
          OR: [
            { status: 'OPEN' },
            { tutorId: authUser.id }
          ]
        },
        include: {
          student: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return NextResponse.json({ doubts });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error('GET /api/doubts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'student') {
      return NextResponse.json({ error: 'Only students can ask doubts' }, { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'doubt-create', 10, 60 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { subject, content, imageUrl } = body;

    if (!content && !imageUrl) {
      return NextResponse.json({ error: 'Doubt must have either text content or an image' }, { status: 400 });
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (subject.length > 100) return NextResponse.json({ error: 'Subject is too long.' }, { status: 400 });

    // Sanitize inputs
    if (content !== undefined && (typeof content !== 'string' || content.length > 5000)) return NextResponse.json({ error: 'Doubt content is too long or invalid.' }, { status: 400 });
    const sanitizedContent = content ? content.trim() : null;
    const sanitizedSubject = String(subject).trim();

    // Validate imageUrl is a relative uploads path (not an external URL injection)
    let sanitizedImageUrl: string | null = null;
    if (imageUrl) {
      if (typeof imageUrl === 'string' && /^\/uploads\/(?:avatar|doubt)-[0-9a-f-]+\.(?:jpg|png|webp|gif)$/i.test(imageUrl)) {
        sanitizedImageUrl = imageUrl;
      } else {
        return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
      }
    }

    const doubt = await prisma.doubt.create({
      data: {
        studentId: authUser.id,
        subject: sanitizedSubject,
        content: sanitizedContent,
        imageUrl: sanitizedImageUrl,
        status: 'OPEN'
      },
      include: {
        student: { select: { id: true, name: true } }
      }
    });

    // Notify all active, verified tutors
    const tutors = await prisma.user.findMany({
      where: {
        role: 'TUTOR',
        status: 'ACTIVE',
        verificationStatus: 'APPROVED',
        tutorProfile: { verificationStatus: 'APPROVED' },
      }
    });
    if (tutors.length > 0) {
      await prisma.notification.createMany({
        data: tutors.map(tutor => ({
          userId: tutor.id,
          type: 'NEW_DOUBT',
          title: 'New Doubt Request',
          message: `${doubt.student.name} asked a new doubt in ${sanitizedSubject}.`,
        }))
      });
    }

    return NextResponse.json({ success: true, doubt });
  } catch (error) {
    console.error('POST /api/doubts error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
