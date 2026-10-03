import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { isApprovedTutor, tutorApprovalRequiredResponse } from '@/lib/tutor-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'tutor' && !(await isApprovedTutor(authUser.id))) {
      return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'session-update', 30, 15 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { status, rating, reviewText, notes, resources } = body;

    const session = await prisma.session.findUnique({ where: { id } });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Authorization checks
    const isTutor = authUser.role === 'tutor' && session.tutorId === authUser.id;
    const isStudent = authUser.role === 'student' && session.studentId === authUser.id;
    const isAdmin = authUser.role === 'admin';

    if (!isTutor && !isStudent && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only tutor can edit notes and resources
    if ((notes !== undefined || resources !== undefined) && !isTutor) {
      return NextResponse.json({ error: 'Only the assigned tutor can edit session notes and resources' }, { status: 403 });
    }

    // Only student can submit review; no duplicate reviews
    if (rating !== undefined) {
      if (!isStudent) {
        return NextResponse.json({ error: 'Only the assigned student can review this session' }, { status: 403 });
      }
      if (session.status !== 'COMPLETED') {
        return NextResponse.json({ error: 'A session can only be reviewed after it is completed.' }, { status: 409 });
      }
      if (session.rating !== null) {
        return NextResponse.json({ error: 'You have already submitted a review for this session' }, { status: 409 });
      }
      // Validate rating range
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 });
      }
    }
    if (reviewText !== undefined && rating === undefined) {
      return NextResponse.json({ error: 'Review text must be submitted with a rating.' }, { status: 400 });
    }

    const VALID_STATUSES = ['REQUESTED', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    const dataToUpdate: Record<string, any> = {};

    if (status) {
      if (typeof status !== 'string') return NextResponse.json({ error: 'Invalid session status' }, { status: 400 });
      const dbStatus = status.toUpperCase();
      if (!VALID_STATUSES.includes(dbStatus)) {
        return NextResponse.json({ error: 'Invalid session status' }, { status: 400 });
      }
      // Only tutor can mark COMPLETED
      if (dbStatus === 'COMPLETED' && !isTutor) {
        return NextResponse.json({ error: 'Only the assigned tutor can mark a session as completed' }, { status: 403 });
      }
      // Only tutor can UPCOMING (accept) or REJECTED
      if ((dbStatus === 'UPCOMING' || dbStatus === 'REJECTED') && !isTutor && !isAdmin) {
        return NextResponse.json({ error: 'Only the assigned tutor can accept or reject sessions' }, { status: 403 });
      }
      const allowed = isTutor
        ? (session.status === 'REQUESTED' && ['UPCOMING', 'REJECTED'].includes(dbStatus))
          || (session.status === 'UPCOMING' && dbStatus === 'COMPLETED')
        : isStudent
          ? (['REQUESTED', 'UPCOMING'].includes(session.status) && dbStatus === 'CANCELLED')
          : isAdmin && session.status === 'REQUESTED' && ['UPCOMING', 'REJECTED'].includes(dbStatus);
      if (!allowed) return NextResponse.json({ error: 'This session status change is not allowed.' }, { status: 409 });
      dataToUpdate.status = dbStatus;
    }

    if (rating !== undefined) dataToUpdate.rating = rating;
    if (reviewText !== undefined) {
      if (typeof reviewText !== 'string' || reviewText.length > 2000) return NextResponse.json({ error: 'Review text is too long or invalid.' }, { status: 400 });
      dataToUpdate.reviewText = reviewText;
    }
    if (notes !== undefined) {
      if (typeof notes !== 'string' || notes.length > 5000) return NextResponse.json({ error: 'Notes are too long or invalid.' }, { status: 400 });
      dataToUpdate.notes = notes;
    }
    if (resources !== undefined) {
      if (typeof resources !== 'string' || resources.length > 2000) return NextResponse.json({ error: 'Resources are too long or invalid.' }, { status: 400 });
      dataToUpdate.resources = resources;
    }

    const updateResult = await prisma.session.updateMany({
      where: { id, status: session.status, ...(rating !== undefined ? { rating: null } : {}) },
      data: dataToUpdate,
    });
    if (updateResult.count !== 1) {
      return NextResponse.json({ error: 'The session changed or this action was already completed.' }, { status: 409 });
    }
    const updated = await prisma.session.findUniqueOrThrow({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        tutor: { select: { id: true, name: true, tutorProfile: true } },
      },
    });

    // Send status-change notification to student
    if (status && session.status !== status.toUpperCase()) {
      const dbStatus = status.toUpperCase();
      let type = '';
      let title = '';
      let message = '';

      if (dbStatus === 'UPCOMING') {
        type = 'SESSION_UPCOMING';
        title = 'Session Accepted';
        message = `${updated.tutor.name} accepted your session for ${updated.subject}.`;
      } else if (dbStatus === 'COMPLETED') {
        type = 'SESSION_COMPLETED';
        title = 'Session Completed';
        message = `Your session with ${updated.tutor.name} was marked as completed. Please leave a review!`;
      } else if (dbStatus === 'REJECTED' || dbStatus === 'CANCELLED') {
        type = `SESSION_${dbStatus}`;
        title = `Session ${dbStatus === 'REJECTED' ? 'Declined' : 'Cancelled'}`;
        message = `Your session with ${updated.tutor.name} was ${dbStatus === 'REJECTED' ? 'declined' : 'cancelled'}.`;
      }

      if (type) {
        await prisma.notification.create({
          data: { userId: updated.studentId, type, title, message },
        });
      }
    }

    // Create Review record when student submits rating for the first time
    if (rating && isStudent && session.rating === null) {
      await prisma.review.create({
        data: {
          sessionId: id,
          studentId: authUser.id,
          tutorId: session.tutorId,
          rating,
          comment: reviewText,
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updated.id,
        studentId: updated.studentId,
        studentName: updated.student.name,
        tutorId: updated.tutorId,
        tutorName: updated.tutor.name,
        tutorTitle: updated.tutor.tutorProfile?.qualifications || 'Expert Tutor',
        subject: updated.subject,
        date: updated.date,
        time: updated.time,
        durationMinutes: updated.durationMinutes,
        price: updated.price,
        status: updated.status.toLowerCase(),
        rating: updated.rating ?? undefined,
        reviewText: updated.reviewText ?? undefined,
        notes: updated.notes ?? undefined,
        resources: updated.resources ?? undefined,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('PATCH /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
