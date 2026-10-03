import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getUserFromCookies } from '@/lib/auth';
import { MeetClassroom } from '@/components/session/meet-classroom';
import { parseSessionStart } from '@/lib/session-time';
import { isApprovedTutor } from '@/lib/tutor-auth';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await getUserFromCookies();

  if (!user) {
    redirect('/login');
  }

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true } },
      tutor: { select: { id: true, name: true } },
    }
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <h1 className="text-2xl font-bold text-rose-500">Session not found.</h1>
      </div>
    );
  }

  // Authorize only the assigned student or tutor
  const isStudent = session.studentId === user.id;
  const isTutor = session.tutorId === user.id;

  if (!isStudent && !isTutor) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <h1 className="text-2xl font-bold text-rose-500">Unauthorized. You cannot join this session.</h1>
      </div>
    );
  }

  if (isTutor && !(await isApprovedTutor(user.id))) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <h1 className="text-2xl font-bold text-rose-500">Tutor approval is required to access this session.</h1>
      </div>
    );
  }

  // Validate status
  if (session.status !== 'UPCOMING') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-rose-500">Session is not active.</h1>
          <p className="text-slate-400">Current status: {session.status}</p>
          <a href={`/${user.role.toLowerCase()}/sessions`} className="text-indigo-400 hover:underline">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  // Validate time — session.date is YYYY-MM-DD, session.time is HH:MM
  // Join window: 15 minutes before session start until session end
  const sessionStart = parseSessionStart(session.date, session.time);
  if (!sessionStart) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <h1 className="text-2xl font-bold text-rose-500">Session date or time is invalid.</h1>
      </div>
    );
  }
  const sessionEnd = new Date(sessionStart.getTime() + session.durationMinutes * 60000);
  const now = new Date();

  const startTimeWithBuffer = new Date(sessionStart.getTime() - 15 * 60000); // 15 mins before start

    if (now < startTimeWithBuffer) {
      const timeUntilMs = startTimeWithBuffer.getTime() - now.getTime();
      const minsUntil = Math.max(1, Math.round(timeUntilMs / 60000));
      return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
          <div className="text-center space-y-3">
            <div className="text-5xl mb-2">⏰</div>
            <h1 className="text-2xl font-bold text-amber-500">Too Early to Join</h1>
            <p className="text-slate-400">Join window opens <span className="text-amber-400 font-bold">15 minutes before start</span> (in ~{minsUntil} mins)</p>
            <p className="text-slate-500 text-sm">Scheduled: {session.date} at {session.time}</p>
            <a href={`/${user.role.toLowerCase()}/sessions`} className="inline-block mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }

    if (now >= sessionEnd) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
          <div className="text-center space-y-3">
            <div className="text-5xl mb-2">🕐</div>
            <h1 className="text-2xl font-bold text-rose-500">Session Time Passed</h1>
            <p className="text-slate-400">This session was scheduled for {session.date} at {session.time} and has ended.</p>
            <a href={`/${user.role.toLowerCase()}/sessions`} className="inline-block mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Return to Dashboard
            </a>
          </div>
        </div>
      );
  }

  return (
    <MeetClassroom
      sessionId={session.id}
      meetUrl={session.meetUrl}
      subject={session.subject}
      date={session.date}
      time={session.time}
      durationMinutes={session.durationMinutes}
      studentName={session.student.name}
      tutorName={session.tutor.name}
      userRole={user.role.toLowerCase()}
    />
  );
}
