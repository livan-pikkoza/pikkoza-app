import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { createGoogleMeetEvent } from '@/lib/google-meet';
import { parseSessionStart } from '@/lib/session-time';
import { isApprovedTutor, tutorApprovalRequiredResponse } from '@/lib/tutor-auth';
import { enforceRateLimit, readJson } from '@/lib/api-security';

export async function GET(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role === 'tutor' && !(await isApprovedTutor(authUser.id))) {
      return NextResponse.json(tutorApprovalRequiredResponse(), { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    let whereClause: Record<string, unknown> = {};

    if (authUser.role === 'student') {
      whereClause.studentId = authUser.id;
    } else if (authUser.role === 'tutor') {
      whereClause.tutorId = authUser.id;
    }
    // admin gets all sessions

    if (statusFilter) {
      whereClause.status = statusFilter.toUpperCase();
    }

    const sessions = await prisma.session.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        tutor: {
          select: { id: true, name: true, email: true, tutorProfile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const mapped = sessions.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      studentName: s.student.name,
      tutorId: s.tutorId,
      tutorName: s.tutor.name,
      tutorTitle: s.tutor.tutorProfile?.qualifications || 'Expert Tutor',
      subject: s.subject,
      date: s.date,
      time: s.time,
      durationMinutes: s.durationMinutes,
      price: s.price,
      status: s.status.toLowerCase(),
      rating: s.rating ?? undefined,
      reviewText: s.reviewText ?? undefined,
      notes: s.notes ?? undefined,
      resources: s.resources ?? undefined,
      createdAt: s.createdAt.toISOString(),
    }));

    return NextResponse.json({ sessions: mapped });
  } catch (error) {
    console.error('GET /api/sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authUser = await getUserFromCookies();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login to book a session.' }, { status: 401 });
    }

    if (authUser.role !== 'student') {
      return NextResponse.json({ error: 'Only student accounts can book doubt sessions.' }, { status: 403 });
    }

    const limited = await enforceRateLimit(req, 'booking-create', 5, 60 * 60 * 1000, authUser.id);
    if (limited) return limited;
    const parsed = await readJson<Record<string, any>>(req, 16 * 1024);
    if ('response' in parsed) return parsed.response;
    const body = parsed.data;
    const { tutorId, subject, date, time, durationMinutes, price, sessionId: requestedSessionId } = body;

    if (requestedSessionId !== undefined && (
      typeof requestedSessionId !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedSessionId)
    )) {
      return NextResponse.json({ error: 'Invalid booking request ID.' }, { status: 400 });
    }

    if (typeof tutorId !== 'string' || !tutorId || typeof subject !== 'string' || !subject.trim() || typeof date !== 'string' || typeof time !== 'string') {
      return NextResponse.json({ error: 'tutorId, subject, date, and time are required' }, { status: 400 });
    }

    if (authUser.id === tutorId) {
      return NextResponse.json({ error: 'You cannot book a doubt session with yourself.' }, { status: 400 });
    }

    const sessionId = requestedSessionId || crypto.randomUUID();
    const existingRequest = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        student: { select: { id: true, name: true } },
        tutor: { select: { id: true, name: true, tutorProfile: true } },
      },
    });

    if (existingRequest) {
      if (existingRequest.studentId !== authUser.id || existingRequest.tutorId !== tutorId) {
        return NextResponse.json({ error: 'Booking request ID has already been used.' }, { status: 409 });
      }
      return NextResponse.json({
        success: true,
        session: {
          id: existingRequest.id,
          studentId: existingRequest.studentId,
          studentName: existingRequest.student.name,
          tutorId: existingRequest.tutorId,
          tutorName: existingRequest.tutor.name,
          tutorTitle: existingRequest.tutor.tutorProfile?.qualifications || 'Expert Tutor',
          subject: existingRequest.subject,
          date: existingRequest.date,
          time: existingRequest.time,
          durationMinutes: existingRequest.durationMinutes,
          price: existingRequest.price,
          status: existingRequest.status.toLowerCase(),
          createdAt: existingRequest.createdAt.toISOString(),
        },
      });
    }

    // Verify tutor exists and is eligible
    const tutor = await prisma.user.findUnique({
      where: { id: tutorId },
      include: { tutorProfile: true },
    });

    if (!tutor || tutor.role !== 'TUTOR') {
      return NextResponse.json({ error: 'Selected tutor account was not found or is invalid.' }, { status: 404 });
    }

    if (tutor.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'This tutor account is currently suspended.' }, { status: 400 });
    }

    if (
      tutor.status !== 'ACTIVE'
      || tutor.verificationStatus !== 'APPROVED'
      || tutor.tutorProfile?.verificationStatus !== 'APPROVED'
    ) {
      return NextResponse.json({ error: 'Selected tutor is not available for booking.' }, { status: 404 });
    }

    if (tutor.tutorProfile && !tutor.tutorProfile.isAvailableNow) {
      return NextResponse.json({ error: 'Selected tutor is currently unavailable for new bookings.' }, { status: 400 });
    }

    const sessionDuration = durationMinutes === undefined ? 30 : durationMinutes;
    if (typeof sessionDuration !== 'number' || ![15, 30, 45, 60].includes(sessionDuration)) {
      return NextResponse.json({ error: 'Invalid session duration.' }, { status: 400 });
    }
    if (subject.length > 100 || !tutor.tutorProfile?.teachingSubjects.includes(subject)) {
      return NextResponse.json({ error: 'Selected subject is not available with this tutor.' }, { status: 400 });
    }

    // Reject past date & time slots
    const requestedStart = parseSessionStart(date, time);
    const now = new Date();
    if (!requestedStart) {
      return NextResponse.json({ error: 'Invalid session date or time.' }, { status: 400 });
    }
    if (requestedStart < now) {
      return NextResponse.json(
        { error: 'Cannot book a session slot in the past. Please select a future date and time.' },
        { status: 400 }
      );
    }

    // Double booking / slot conflict prevention
    const existingConflicts = await prisma.session.findMany({
      where: {
        tutorId,
        date,
        status: { in: ['REQUESTED', 'UPCOMING'] },
      },
      select: { date: true, time: true, durationMinutes: true },
    });

    const requestedEnd = requestedStart.getTime() + sessionDuration * 60_000;
    const existingConflict = existingConflicts.some((booking) => {
      const start = parseSessionStart(booking.date, booking.time);
      if (!start) return false;
      const end = start.getTime() + booking.durationMinutes * 60_000;
      return requestedStart.getTime() < end && start.getTime() < requestedEnd;
    });

    if (existingConflict) {
      return NextResponse.json(
        { error: 'This tutor is already booked for this specific time slot. Please choose another slot.' },
        { status: 409 }
      );
    }

    // Price is always derived from the current server-side tutor rate; posted price is ignored.
    const sessionPrice = Math.round(((tutor.tutorProfile?.hourlyRate ?? 199) * sessionDuration) / 30);

    // Create real Google Meet event before DB insert
    let realMeetUrl = '';
    try {
      realMeetUrl = await createGoogleMeetEvent({
        sessionId,
        subject,
        studentName: authUser.name || 'Student',
        studentEmail: authUser.email,
        tutorName: tutor.name || 'Tutor',
        tutorEmail: tutor.email,
        date,
        time,
        durationMinutes: sessionDuration,
      });
    } catch (meetErr: unknown) {
      const err = meetErr as { httpStatus?: number; googleCode?: number | string; reason?: string; googleMessage?: string };
      console.error('Failed to create Google Meet event during session booking.', {
        httpStatus: err.httpStatus,
        googleCode: err.googleCode,
        reason: err.reason,
        message: err.googleMessage,
      });
      return NextResponse.json(
        { error: 'Unable to create the class meeting. Please try again.' },
        { status: 500 }
      );
    }

    const session = await prisma.session.create({
      data: {
        id: sessionId,
        studentId: authUser.id,
        tutorId,
        subject,
        date,
        time,
        durationMinutes: sessionDuration,
        price: sessionPrice,
        meetUrl: realMeetUrl,
        status: 'REQUESTED',
      },
      include: {
        student: { select: { id: true, name: true } },
        tutor: { select: { id: true, name: true, tutorProfile: true } },
      },
    });

    await prisma.notification.create({
      data: {
        userId: session.tutorId,
        type: 'BOOKING_REQUEST',
        title: 'New Session Request',
        message: `${session.student.name} requested a session for ${subject} on ${date} at ${time}.`,
      }
    });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        studentId: session.studentId,
        studentName: session.student.name,
        tutorId: session.tutorId,
        tutorName: session.tutor.name,
        tutorTitle: session.tutor.tutorProfile?.qualifications || 'Expert Tutor',
        subject: session.subject,
        date: session.date,
        time: session.time,
        durationMinutes: session.durationMinutes,
        price: session.price,
        status: 'requested',
        createdAt: session.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/sessions error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
