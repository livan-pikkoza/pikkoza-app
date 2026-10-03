'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useSessionStore } from '@/lib/session-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PikkozaLogo } from '@/components/ui/pikkoza-logo';
import { NotificationDropdown } from '@/components/ui/notification-dropdown';
import { toast } from 'sonner';
import {
  GraduationCap,
  LayoutDashboard,
  HelpCircle,
  User,
  Clock,
  Video,
  IndianRupee,
  Star,
  LogOut,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Bell,
} from 'lucide-react';

export default function TutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, verifySession } = useAuthStore();
  const { fetchSessions } = useSessionStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    verifySession();
  }, []);

  useEffect(() => {
    if (mounted) {
      if (!isAuthenticated) {
        toast.error('Session expired. Please log in.');
        router.replace('/login');
      } else if (user?.role !== 'tutor') {
        toast.warning('Tutor Portal is restricted to verified tutor accounts.');
        router.replace('/student');
      } else {
        fetchSessions();
      }
    }
  }, [mounted, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out from Tutor Portal');
    router.replace('/login');
  };

  if (!mounted || !isAuthenticated || user?.role !== 'tutor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Verifying tutor authentication...
          </p>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'TU';

  const navItems = [
    { label: 'Dashboard', href: '/tutor', icon: LayoutDashboard },
    { label: 'Incoming Doubts', href: '/tutor/doubts', icon: HelpCircle },
    { label: 'My Profile', href: '/tutor/profile', icon: User },
    { label: 'Availability', href: '/tutor/availability', icon: Clock },
    { label: 'Sessions', href: '/tutor/sessions', icon: Video },
    { label: 'Earnings', href: '/tutor/earnings', icon: IndianRupee },
    { label: 'Reviews', href: '/tutor/reviews', icon: Star },
  ];

  const verificationStatus = user?.verificationStatus || 'approved';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo & Portal Tag */}
        <div className="flex items-center gap-3">
          <Link href="/tutor" className="flex items-center gap-2.5 group">
            <PikkozaLogo size="sm" className="group-hover:scale-105 transition-transform" />
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Pikk<span className="text-indigo-600 dark:text-indigo-400">oza</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Tutor Portal
          </span>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Verification Badge */}
          {verificationStatus === 'approved' ? (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200/50">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Tutor
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200/50">
              <AlertCircle className="w-3.5 h-3.5" /> Pending Verification
            </span>
          )}

          <NotificationDropdown />

          <ThemeToggle />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* Tutor Profile Pill */}
          <Link href="/tutor/profile" className="flex items-center gap-2.5 pl-1 hover:opacity-85 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Tutor'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {user?.qualifications || 'IIT Bombay Alumni'}
              </p>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center gap-1.5"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER WITH DESKTOP SIDEBAR */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 p-6 border-r border-slate-200 dark:border-slate-800/80 space-y-6">
          
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Tutor Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Educator Support Banner */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border border-indigo-800/50 shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
              Top Educator Tip
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Keep your availability updated to receive instant 1-on-1 doubt requests from students.
            </p>
            <Link
              href="/tutor/availability"
              className="block w-full py-2 text-center text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Update Time Slots
            </Link>
          </div>
        </aside>

        {/* MAIN PAGE VIEW */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
