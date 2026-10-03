'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { useSessionStore } from '@/lib/session-store';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  Calendar,
  CheckCircle2,
  Clock,
  IndianRupee,
  Sparkles,
  Zap,
  Video,
  BookOpen,
  ArrowRight,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { sessions } = useSessionStore();

  const upcomingCount = sessions.filter((s) => s.status === 'upcoming').length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  
  const totalMinutes = sessions
    .filter((s) => s.status === 'completed')
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const totalSpent = sessions.reduce((acc, s) => acc + s.price, 0);

  const learningTimeStr = totalMinutes >= 60
    ? `${(totalMinutes / 60).toFixed(1)} hrs`
    : `${totalMinutes} mins`;

  const statCards = [
    {
      title: 'Upcoming Sessions',
      value: upcomingCount.toString(),
      subtitle: upcomingCount === 0 ? 'No scheduled sessions' : `${upcomingCount} active bookings`,
      icon: Calendar,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      borderColor: 'border-indigo-100 dark:border-indigo-900/40',
    },
    {
      title: 'Completed Sessions',
      value: completedCount.toString(),
      subtitle: completedCount === 0 ? 'Zero doubts solved yet' : `${completedCount} sessions finished`,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      title: 'Total Learning Time',
      value: learningTimeStr,
      subtitle: `${totalMinutes} minutes recorded`,
      icon: Clock,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-100 dark:border-amber-900/40',
    },
    {
      title: 'Total Spent',
      value: `₹${totalSpent}`,
      subtitle: `${sessions.length} total bookings`,
      icon: IndianRupee,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/50',
      borderColor: 'border-violet-100 dark:border-violet-900/40',
    },
  ];

  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Student';
  const recentSessions = sessions.slice(0, 3);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* PERSONALIZED HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 p-6 sm:p-8 text-white shadow-xl shadow-indigo-500/15"
      >
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-violet-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-indigo-100 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Target Goal: {user?.targetExam || 'JEE / NEET Prep'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Welcome back, {studentFirstName}! 👋
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/90 max-w-xl">
              Stuck on a physics numerical or math concept? Connect with top IITian tutors in under 60 seconds.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => router.push('/student/tutors')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold text-base text-slate-900 bg-white hover:bg-slate-100 active:scale-95 transition-all shadow-lg shadow-black/10"
            >
              <Zap className="w-5 h-5 text-indigo-600 fill-indigo-600" />
              <span>Solve a Doubt Now</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 4 STAT CARDS GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Learning Analytics</span>
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Real-time sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border ${stat.borderColor} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
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
      </div>

      {/* SECTION 1: RECENT SESSIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Recent Sessions</span>
          </h2>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={() => router.push('/student/sessions')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentSessions.map((s) => (
              <div
                key={s.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    {s.subject}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'upcoming'
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {s.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{s.tutorName}</h4>
                  <p className="text-xs text-slate-400">{s.date} at {s.time}</p>
                </div>

                {s.status === 'upcoming' && (
                  <button
                    type="button"
                    onClick={() => window.location.assign(`/session/${s.id}`)}
                    className="w-full py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Join Class</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
            <EmptyState
              icon={Video}
              badgeText="No Session History"
              title="No sessions yet"
              description="You haven't booked any doubt session. Find an available IITian tutor and launch your first live 1-on-1 session."
              actionText="Find a Tutor"
              onAction={() => router.push('/student/tutors')}
            />
          </div>
        )}
      </div>

      {/* SECTION 2: RECOMMENDED FOR YOU (EMPTY STATE) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Recommended Tutors & Topics</span>
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={BookOpen}
            badgeText="Personalization Locked"
            title="No recommendations available"
            description="Complete your first doubt session so our AI system can recommend the best tutors and practice topics suited for your target exam."
            actionText="Find Tutors"
            onAction={() => router.push('/student/tutors')}
          />
        </div>
      </div>

    </div>
  );
}
