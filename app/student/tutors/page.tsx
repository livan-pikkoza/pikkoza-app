'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Tutor } from '@/lib/session-store';
import { useTutorStore } from '@/lib/tutor-store';
import { EmptyState } from '@/components/ui/empty-state';
import { BookingModal } from '@/components/tutors/booking-modal';
import { toast } from 'sonner';
import {
  Search,
  Users,
  Star,
  GraduationCap,
  Zap,
  BookOpen,
  IndianRupee,
} from 'lucide-react';

export default function FindTutorsPage() {
  const router = useRouter();
  const { tutorsList, fetchTutors, isLoading } = useTutorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);

  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    fetchTutors({
      subject: selectedSubject !== 'All' ? selectedSubject : undefined,
      availableNow: availableOnly || undefined,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, availableOnly]);

  // Master Tutors Array combines store tutors
  const tutors: Tutor[] = tutorsList;

  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject =
      selectedSubject === 'All' || tutor.subjects.includes(selectedSubject);

    const matchesAvailability = !availableOnly || tutor.availableNow;

    return matchesSearch && matchesSubject && matchesAvailability;
  });

  const handleQuickMatch = () => {
    if (tutorsList.length > 0) {
      setSelectedTutor(tutorsList[0]);
      setIsBookingOpen(true);
    } else {
      toast.info('No active tutors found matching current criteria.', {
        description: 'Please check back soon or try clearing your subject filters.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Find 1-on-1 Tutors</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect live with top IITians &amp; doctor mentors for instant doubt solving.
          </p>
        </div>

        <button
          type="button"
          onClick={handleQuickMatch}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-500/20"
        >
          <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
          <span>Instant Tutor Match</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutor name, IIT Bombay, Physics, Mechanics..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
          >
            <option value="All">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Biology">Biology</option>
          </select>

          <button
            type="button"
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
              availableOnly
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${availableOnly ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>Available Now Only</span>
          </button>
        </div>
      </div>

      {/* TUTORS GRID OR EMPTY STATE */}
      {filteredTutors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutors.map((tutor) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
                      {tutor.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{tutor.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{tutor.institute}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {tutor.rating}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {tutor.bio}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {tutor.subjects.map((sub) => (
                    <span key={sub} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Starting from</span>
                  <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹{tutor.hourlyRate} <span className="text-xs font-normal text-slate-400">/ 30 min</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTutor(tutor);
                    setIsBookingOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Book Session
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={Users}
            badgeText="Tutor Network"
            title="No tutors available yet"
            description="Verified educators will appear here once they join the platform. Select a subject or check back soon."
            actionText="Instant Tutor Match"
            onAction={handleQuickMatch}
          />
        </div>
      )}

      <BookingModal
        tutor={selectedTutor}
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        onSuccessRedirect={() => router.push('/student/sessions')}
      />

    </div>
  );
}
