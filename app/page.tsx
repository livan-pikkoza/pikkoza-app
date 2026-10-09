'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { PikkozaLogo } from '@/components/ui/pikkoza-logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Sparkles,
  Zap,
  Users,
  Video,
  MessageSquare,
  Star,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Calendar,
  ShieldCheck,
  Award,
  ChevronRight,
} from 'lucide-react';

interface PublicTutor {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  institute: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  subjects: string[];
  bio: string;
  availableNow: boolean;
}

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [tutors, setTutors] = useState<PublicTutor[]>([]);
  const [isLoadingTutors, setIsLoadingTutors] = useState(true);

  useEffect(() => {
    async function fetchPublicTutors() {
      try {
        const res = await fetch('/api/tutors');
        if (res.ok) {
          const data = await res.json();
          setTutors(data.tutors || []);
        }
      } catch (err) {
        console.error('Failed to fetch public tutors:', err);
      } finally {
        setIsLoadingTutors(false);
      }
    }
    fetchPublicTutors();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/student';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'tutor') return '/tutor';
    return '/student';
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-indigo-500 selection:text-white font-sans transition-colors">
      
      {/* ─── NAVBAR ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <Link href="/" className="flex items-center gap-3 group">
            <PikkozaLogo size="md" className="group-hover:scale-105 transition-transform" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Pikk<span className="text-indigo-600 dark:text-indigo-400">oza</span>
              </span>
              <span className="hidden sm:block text-[9px] uppercase font-bold tracking-widest text-indigo-700/80 dark:text-indigo-300/70">
                Doubt aaye hazaar, Pikkoza hai taiyaar
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <a href="#about" className="hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">What is Pikkoza</a>
            <a href="#how-it-works" className="hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">How it Works</a>
            <a href="#tutors" className="hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Top Tutors</a>
            <a href="#benefits" className="hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Benefits</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" />

            {isAuthenticated ? (
              <Link
                href={getDashboardPath()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* ─── HERO SECTION ───────────────────────────────────── */}
      <section className="relative pt-16 pb-24 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-8 backdrop-blur-md"
          >
            <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400 fill-amber-700 dark:fill-amber-400" />
            <span>Instant 1-on-1 Doubt Clearance & Live Tutoring</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[1.15]"
          >
            Connect 1-on-1 with Top Tutors in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-amber-300">60 Seconds</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Pikkoza bridges students with verified IITians, doctors, and subject experts. Post doubts instantly, book personalized 1-on-1 live sessions, and chat directly in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-2.5 transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#tutors"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Explore Verified Tutors</span>
            </a>
          </motion.div>

          {/* Feature Highlights Grid */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 font-bold">
                ⚡
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Instant Matching</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Post your doubt & get connected under 60 seconds.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-400 flex items-center justify-center mb-3 font-bold">
                📹
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Google Meet Video & Audio</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Join tutor sessions through Google Meet.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3 font-bold">
                🛡️
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Verified Educators</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Admin-vetted tutors from IITs, AIIMS & top institutes.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3 font-bold">
                💬
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Persistent 1-on-1 Chat</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Stay connected with your tutor before & after sessions.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── WHAT IS PIKKOZA ────────────────────────────────── */}
      <section id="about" className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">What is Pikkoza</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              An End-to-End Academic Doubt Solving & Mentorship Platform
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm sm:text-base leading-relaxed">
              Designed specifically for JEE, NEET, and Board aspirants. Pikkoza combines instant doubt submission with structured 1-on-1 tutor booking and real-time interactive video sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Instant Doubt Submission</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload image of physics numericals, organic reactions, or math equations. Tutors accept open doubts immediately for quick resolution.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-violet-600/20 text-violet-700 dark:text-violet-400 flex items-center justify-center font-bold">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">1-on-1 Scheduled Booking</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Choose your preferred tutor, pick available date & time slots, and schedule dedicated 30-minute or 60-minute interactive sessions.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <Video className="w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">Live Virtual Classroom</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Meet with your tutor through Google Meet video, audio, and screen sharing.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 border-t border-slate-200 dark:border-slate-800/80">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Simple Workflow</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              4 Steps to Instant Clarity
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-4xl font-black text-indigo-500/20 absolute top-4 right-4">01</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">Create Free Account</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign up as a student in seconds with your grade and target exam goals.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-4xl font-black text-indigo-500/20 absolute top-4 right-4">02</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">Post Doubt or Book Tutor</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Snap & upload a question image or browse verified tutor profiles with ratings.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-4xl font-black text-indigo-500/20 absolute top-4 right-4">03</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">Join Live 1-on-1 Class</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Click join when your session opens for interactive video and whiteboard learning.
              </p>
            </div>

            <div className="relative p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="text-4xl font-black text-indigo-500/20 absolute top-4 right-4">04</span>
              <h4 className="font-bold text-slate-900 dark:text-white text-base mb-2">Review & Chat Follow-up</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Rate your educator and continue messaging in your private conversation room.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ─── PUBLIC APPROVED TUTORS SECTION ──────────────────── */}
      <section id="tutors" className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/30">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-3 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Admin Approved Educators</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Featured Verified Tutors
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Real educators teaching Physics, Chemistry, Math, and Biology from top engineering & medical colleges.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              <span>View All Tutors & Book Session</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingTutors ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 rounded-2xl bg-white dark:bg-slate-900 animate-pulse border border-slate-200 dark:border-slate-800" />
              ))}
            </div>
          ) : tutors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-extrabold text-lg flex items-center justify-center overflow-hidden border border-indigo-500/30">
                          {tutor.avatar ? (
                            <img src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" />
                          ) : (
                            tutor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{tutor.name}</h4>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{tutor.institute}</p>
                        </div>
                      </div>
                      
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-700 dark:fill-amber-400 text-amber-700 dark:text-amber-400" />
                        {tutor.rating || 5.0}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed">
                      {tutor.bio}
                    </p>

                    <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      <span className="text-slate-600 dark:text-slate-500 font-normal">Qualification: </span>
                      {tutor.title}
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tutor.subjects.map((sub) => (
                        <span key={sub} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700/60">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-500 uppercase tracking-wider font-semibold block">Session Fee</span>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        ₹{tutor.hourlyRate} <span className="text-xs text-slate-600 dark:text-slate-400 font-normal">/ 30 mins</span>
                      </span>
                    </div>

                    <Link
                      href="/login"
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-sm"
                    >
                      Book Tutor
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl mx-auto">
              <GraduationCap className="w-12 h-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Tutor Network Expanding Daily</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                New verified educators join Pikkoza every day. Sign up to match with available tutors instantly!
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Sign Up as Student or Tutor
              </Link>
            </div>
          )}

        </div>
      </section>

      {/* ─── BENEFITS SECTION ────────────────────────────────── */}
      <section id="benefits" className="py-20 border-t border-slate-200 dark:border-slate-800/80">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Student Benefits */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
                <GraduationCap className="w-4 h-4" />
                <span>For Aspirants & Students</span>
              </div>
              
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Why Students Choose Pikkoza</h3>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Waiting Time:</strong> Instant 60-second matching with active tutors when doubts pop up.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Personalized 1-on-1 Focus:</strong> No crowded 500-student webinars. Only 1-to-1 live instruction.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Transparent Pricing in ₹:</strong> Book per session starting at affordable ₹ rates with no hidden fees.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span><strong>Post-Session Chat:</strong> Stay in touch with your tutor and access recorded session resources.</span>
                </li>
              </ul>
            </div>

            {/* Tutor Benefits */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                <Award className="w-4 h-4" />
                <span>For Educators & Mentors</span>
              </div>
              
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Why Tutors Teach on Pikkoza</h3>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Set Your Own Rates:</strong> Choose your hourly pricing in ₹ and teaching schedule freely.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Direct Aspirant Reach:</strong> Teach motivated JEE & NEET students looking for expert guidance.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Flexible Availability Toggle:</strong> Switch "Available Now" on/off whenever you have spare time.</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Verified Educator Badge:</strong> Gain trust with official verification status on your profile.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* ─── CTA FOOTER BANNER ──────────────────────────────── */}
      <section className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white to-indigo-50 dark:from-slate-950 dark:to-indigo-950/40">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <PikkozaLogo size="lg" className="mx-auto shadow-xl shadow-indigo-500/20" />
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Ready to Clear Your Doubts Today?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Join thousands of JEE, NEET & Board aspirants clearing doubts live 1-on-1 with verified educators on Pikkoza.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-extrabold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/30 transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────── */}
      <footer className="py-8 border-t border-slate-200 dark:border-slate-900 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-500 text-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium text-slate-600 dark:text-slate-400">
            <span>Made with ❤️ in India</span>
            <span className="text-base">🇮🇳</span>
          </div>
          <div>© 2026 Pikkoza Academic Doubt Solving Platform. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
}
