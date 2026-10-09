'use client';

import { useEffect, useRef, useState } from 'react';
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
  Users,
  Video,
  User,
  LogOut,
  Sparkles,
  Loader2,
  Bell,
  Menu,
  X,
} from 'lucide-react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, verifySession } = useAuthStore();
  const { fetchSessions } = useSessionStore();
  const [mounted, setMounted] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(true);
  const navigationRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const previousNavigationOpen = useRef(navigationOpen);

  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) setNavigationOpen(false);
  }, []);

  useEffect(() => {
    if (navigationOpen && !previousNavigationOpen.current) {
      navigationRef.current?.querySelector<HTMLElement>('a')?.focus();
    }
    previousNavigationOpen.current = navigationOpen;
    if (!navigationOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNavigationOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigationOpen]);

  useEffect(() => {
    setMounted(true);
    verifySession();
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      toast.error('Session expired. Please log in.');
      router.replace('/login');
      return;
    }
    if (mounted && isAuthenticated) {
      fetchSessions();
    }
  }, [mounted, isAuthenticated, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.replace('/login');
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading student portal...
          </p>
        </div>
      </div>
    );
  }

  // Derive initials from name
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ST';

  const navItems = [
    { label: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { label: 'Find Tutors', href: '/student/tutors', icon: Users },
    { label: 'My Sessions', href: '/student/sessions', icon: Video },
    { label: 'Ask Doubt', href: '/student/doubts', icon: Sparkles },
    { label: 'Profile', href: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 w-full h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between transition-colors">
        
        {/* Brand Logo & Portal Tag */}
        <div className="flex items-center gap-3">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setNavigationOpen((open) => !open)}
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={navigationOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={navigationOpen}
            aria-controls="student-navigation"
          >
            {navigationOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/student" className="flex items-center gap-2.5 group">
            <PikkozaLogo size="sm" className="group-hover:scale-105 transition-transform" />
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Pikk<span className="text-indigo-600 dark:text-indigo-400">oza</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Student Portal
          </span>
        </div>

        {/* Right Header Action Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          <NotificationDropdown />

          <ThemeToggle />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

          {/* User Profile Pill */}
          <Link href="/student/profile" className="flex items-center gap-2.5 pl-1 hover:opacity-85 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                {user?.name || 'Student'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {user?.email || 'student@pikkoza.in'}
              </p>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-all flex items-center gap-1.5"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER WITH DESKTOP SIDEBAR */}
      <div className="flex-1 flex w-full mx-auto">
        
        {/* DESKTOP SIDEBAR */}
        {navigationOpen && <button type="button" className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-slate-950/40" aria-label="Close navigation menu" onClick={() => { setNavigationOpen(false); menuButtonRef.current?.focus(); }} />}
        <aside id="student-navigation" ref={navigationRef} className={`${navigationOpen ? 'flex' : 'hidden'} fixed top-16 bottom-0 left-0 z-50 w-72 max-w-[calc(100vw-3rem)] flex-col overflow-y-auto border-r border-slate-200 bg-white p-6 space-y-6 shadow-xl dark:border-slate-800/80 dark:bg-slate-900 md:static md:z-auto md:w-64 md:max-w-none md:shrink-0 md:overflow-visible md:border-r md:bg-transparent md:p-6 md:shadow-none md:dark:bg-transparent`}>
          
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Student Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => { setNavigationOpen(false); menuButtonRef.current?.focus(); }}
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

          {/* Sidebar Banner */}
          <div className="mt-auto p-4 rounded-2xl bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border border-indigo-800/50 shadow-md">
            <div className="flex items-center gap-2 mb-2 text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider">1-on-1 Mentorship</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Book a live doubt session with top rankers from IIT Bombay & AIIMS Delhi.
            </p>
            <Link
              href="/student/tutors"
              className="block w-full py-2 text-center text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              Find Tutors Now
            </Link>
          </div>
        </aside>

        {/* MAIN PAGE VIEW */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>

    </div>
  );
}
