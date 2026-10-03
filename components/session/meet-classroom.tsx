'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, Calendar, Clock, User, CheckCircle, ExternalLink, Copy, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface MeetClassroomProps {
  sessionId: string;
  meetUrl: string;
  subject: string;
  date: string;
  time: string;
  durationMinutes: number;
  studentName: string;
  tutorName: string;
  userRole: string;
}

export function MeetClassroom({
  sessionId,
  meetUrl,
  subject,
  date,
  time,
  durationMinutes,
  studentName,
  tutorName,
  userRole,
}: MeetClassroomProps) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);

  const handleCopyLink = () => {
    if (meetUrl) {
      navigator.clipboard.writeText(meetUrl);
      toast.success('Google Meet link copied to clipboard!');
    }
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete session');
      }

      toast.success('Session marked as completed');
      router.push(`/${userRole}/sessions`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error?.message || 'Could not end session');
      setIsEnding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/${userRole}/sessions`)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-indigo-500/20">
              P
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none">Pikkoza Classroom</h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Google Meet Video Integration</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Class Ready
          </span>

          {userRole === 'tutor' && (
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 font-semibold text-xs text-white transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              {isEnding ? 'Completing...' : 'End & Complete Session'}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="max-w-xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-8">
          
          {/* Header Badge & Title */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
              <Video className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 inline-block">
                {subject}
              </span>
              <h2 className="text-2xl font-extrabold text-white">Live 1-on-1 Session</h2>
              <p className="text-xs text-slate-400">Click below to open your secure Google Meet room</p>
            </div>
          </div>

          {/* Session Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Student</span>
              </div>
              <p className="text-sm font-bold text-white truncate">{studentName}</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tutor</span>
              </div>
              <p className="text-sm font-bold text-white truncate">{tutorName}</p>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                <span>Date</span>
              </div>
              <p className="text-xs font-semibold text-slate-200">{date}</p>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Time &amp; Duration</span>
              </div>
              <p className="text-xs font-semibold text-slate-200">{time} ({durationMinutes} mins)</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a
              href={meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-bold text-sm text-white shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Join on Google Meet</span>
              <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            <div className="flex gap-3">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-bold text-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Meeting Link</span>
              </button>

              <button
                onClick={() => router.push(`/${userRole}/sessions`)}
                className="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-bold text-slate-300 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* Security Guarantee Banner */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Encrypted 1-on-1 Google Meet Room assigned specifically to this session.</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-800/80 z-10">
        Pikkoza &bull; Encrypted Google Meet Session Portal
      </footer>
    </div>
  );
}
