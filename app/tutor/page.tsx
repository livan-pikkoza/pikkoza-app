'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { useSessionStore } from '@/lib/session-store';
import { useTutorStore } from '@/lib/tutor-store';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  IndianRupee,
  Calendar,
  CheckCircle2,
  Star,
  Clock,
  ShieldCheck,
  AlertCircle,
  Video,
  Check,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function TutorDashboardPage() {
  const router = useRouter();
  const { user, verifySession } = useAuthStore();
  const { sessions, acceptSession, rejectSession } = useSessionStore();
  const { isAvailableNow, setAvailableNow } = useTutorStore();

  useEffect(() => {
    verifySession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestedSessions = sessions.filter((s) => s.status === 'requested');
  const upcomingSessions = sessions.filter((s) => s.status === 'upcoming');
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const totalEarnings = completedSessions.reduce((sum, s) => sum + s.price, 0);

  const ratedSessions = completedSessions.filter((s) => s.rating && s.rating > 0);
  const avgRating = ratedSessions.length > 0
    ? (ratedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSessions.length).toFixed(1)
    : '0.0';

  const isApproved = user?.verificationStatus === 'approved';
  const isRejected = user?.verificationStatus === 'rejected';

  const handleAccept = (sessionId: string, studentName?: string) => {
    acceptSession(sessionId);
    toast.success(`Session Accepted! 🎉`, {
      description: `Confirmed 1-on-1 session with ${studentName || 'Student'}. Google Meet link generated.`,
    });
  };

  const handleReject = (sessionId: string) => {
    rejectSession(sessionId);
    toast.info('Session request declined');
  };

  const statCards = [
    {
      title: 'Total Earnings',
      value: `₹${totalEarnings}`,
      subtitle: `${completedSessions.length} paid sessions`,
      icon: IndianRupee,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      title: 'Upcoming Sessions',
      value: upcomingSessions.length.toString(),
      subtitle: `${requestedSessions.length} pending requests`,
      icon: Calendar,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      borderColor: 'border-indigo-100 dark:border-indigo-900/40',
    },
    {
      title: 'Completed Sessions',
      value: completedSessions.length.toString(),
      subtitle: 'Finished live calls',
      icon: CheckCircle2,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-100 dark:border-amber-900/40',
    },
    {
      title: 'Average Rating',
      value: `${avgRating} ⭐`,
      subtitle: `${ratedSessions.length} reviews received`,
      icon: Star,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/50',
      borderColor: 'border-violet-100 dark:border-violet-900/40',
    },
  ];

  const tutorFirstName = user?.name ? user.name.split(' ')[0] : 'Educator';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15"
      >
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-indigo-100 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Status: {isAvailableNow ? 'Active & Ready for Doubts' : 'Offline'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Welcome, {tutorFirstName}! 👨‍🏫
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 max-w-xl">
              Help Indian students clear their PCM/PCB doubts in real-time 1-on-1 sessions.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAvailableNow(!isAvailableNow);
                toast.success(isAvailableNow ? 'Marked Offline' : 'Marked Online & Available!');
              }}
              className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 ${
                isAvailableNow
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailableNow ? 'bg-white animate-ping' : 'bg-slate-400'}`} />
              <span>{isAvailableNow ? 'Online (Receiving Doubts)' : 'Go Online'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* VERIFICATION BANNER */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isApproved
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 text-emerald-900 dark:text-emerald-200'
          : isRejected
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            isApproved
              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400'
              : isRejected
              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400'
              : 'bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">
              Educator Account Status: {isApproved ? 'Approved & Active 🌟' : isRejected ? 'Verification Rejected ❌' : 'Pending Admin Verification ⏳'}
            </h4>
            <p className="text-xs opacity-90">
              {isApproved
                ? 'Your profile is active and listed in the Pikkoza tutor network for 1-on-1 bookings.'
                : isRejected
                ? 'Your profile application was declined by system admin. Please check your credentials.'
                : 'Your profile is awaiting admin approval. Once approved, you will appear in the student booking directory.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/tutor/profile')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-colors shrink-0 ${
            isApproved ? 'bg-emerald-600 hover:bg-emerald-700' : isRejected ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
          }`}
        >
          Edit Profile
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border ${stat.borderColor} shadow-sm flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {stat.title}
                </span>
                <div className={`p-2.5 rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                  {stat.subtitle}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* SECTION: INCOMING SESSION REQUESTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Incoming Session Requests</span>
          </h2>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => router.push('/tutor/sessions')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>Manage All Sessions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {requestedSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requestedSessions.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {s.subject}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                    +₹{s.price}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    Student: {s.studentName || 'JEE Aspirant'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.durationMinutes} Mins &bull; {s.date} at {s.time}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleAccept(s.id, s.studentName)}
                    className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    <span>Accept Request</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(s.id)}
                    className="py-2 px-3 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
            <EmptyState
              icon={Video}
              badgeText="No Pending Requests"
              title="No incoming doubt requests"
              description="When students book a 1-on-1 session with you, their doubt requests will appear here for instant approval."
              actionText="Manage Weekly Availability"
              onAction={() => router.push('/tutor/availability')}
            />
          </div>
        )}
      </div>

    </div>
  );
}
