'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Video,
  IndianRupee,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTutors: 0,
    pendingApprovals: 0,
    totalSessions: 0,
    totalDoubts: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        } else {
          toast.error('Failed to load dashboard stats');
        }
      } catch (error) {
        toast.error('Network error loading stats');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents.toString(),
      subtitle: 'Registered student accounts',
      icon: Users,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/50',
      borderColor: 'border-indigo-100 dark:border-indigo-900/40',
    },
    {
      title: 'Total Tutors',
      value: stats.totalTutors.toString(),
      subtitle: 'Verified & active educators',
      icon: GraduationCap,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-100 dark:border-emerald-900/40',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals.toString(),
      subtitle: 'Tutors awaiting verification',
      icon: ShieldAlert,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-100 dark:border-amber-900/40',
    },
    {
      title: 'Total Sessions',
      value: stats.totalSessions.toString(),
      subtitle: 'Doubt calls booked',
      icon: Video,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/50',
      borderColor: 'border-violet-100 dark:border-violet-900/40',
    },
    {
      title: 'Platform Revenue',
      value: `₹${stats.totalRevenue}`,
      subtitle: 'Completed session volume',
      icon: IndianRupee,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-950/50',
      borderColor: 'border-teal-100 dark:border-teal-900/40',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* HERO BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 sm:p-8 text-white shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-300 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pikkoza System Control</span>
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              Platform Overview & Analytics 🛡️
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl">
              Monitor live doubt resolution metrics, approve tutor verification requests, and manage platform fee parameters.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push('/admin/approvals')}
              className="px-5 py-3 rounded-2xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/25 flex items-center gap-2"
            >
              <span>Review Approvals ({stats.pendingApprovals})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 5 STAT CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08 }}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border ${stat.borderColor} shadow-sm flex flex-col justify-between space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {stat.title}
                </span>
                <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                  {stat.subtitle}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* QUICK SHORTCUTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/users')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">User Accounts</h3>
            <p className="text-xs text-slate-400">Suspend or activate users</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/subjects')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Manage Subjects</h3>
            <p className="text-xs text-slate-400">Add or toggle platform topics</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push('/admin/sessions')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all text-left flex items-center gap-4 group"
        >
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">All Sessions</h3>
            <p className="text-xs text-slate-400">View live & historical calls</p>
          </div>
        </button>
      </div>

      {/* RECENT ACTIVITY SECTION */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>System Activity Log</span>
        </h2>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={Activity}
            badgeText="System Nominal"
            title="No critical alerts"
            description="All platform services and student-tutor sessions are operating smoothly."
          />
        </div>
      </div>

    </div>
  );
}
