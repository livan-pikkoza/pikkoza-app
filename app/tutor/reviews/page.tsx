'use client';

import { useSessionStore } from '@/lib/session-store';
import { EmptyState } from '@/components/ui/empty-state';
import { Star, MessageSquare } from 'lucide-react';

export default function TutorReviewsPage() {
  const { sessions } = useSessionStore();

  const reviewedSessions = sessions.filter((s) => s.rating && s.rating > 0);

  const avgRating = reviewedSessions.length > 0
    ? (reviewedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / reviewedSessions.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
            <span>Student Ratings & Reviews</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            See feedback and 1-5 star ratings submitted by students after doubt sessions.
          </p>
        </div>

        {/* Overall Score Badge */}
        <div className="px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white leading-none">
              {avgRating} <span className="text-sm font-normal text-slate-400">/ 5.0</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{reviewedSessions.length} student reviews</p>
          </div>
        </div>
      </div>

      {/* Reviews List or Empty State */}
      {reviewedSessions.length > 0 ? (
        <div className="space-y-4">
          {reviewedSessions.map((session) => (
            <div
              key={session.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">
                    {session.studentName || 'Student'}
                  </h4>
                  <p className="text-xs text-slate-400">{session.subject} &bull; {session.date}</p>
                </div>

                <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-xl">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{session.rating}.0</span>
                </div>
              </div>

              {session.reviewText && (
                <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  "{session.reviewText}"
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={MessageSquare}
            badgeText="Zero Feedback"
            title="No reviews received yet"
            description="Ratings and written feedback from students will appear here after you complete live doubt calls."
          />
        </div>
      )}

    </div>
  );
}
