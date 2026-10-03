'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore, Session } from '@/lib/session-store';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Ban,
  Star,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  X,
  FileText,
  Link as LinkIcon,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MySessionsPage() {
  const { sessions, fetchSessions, cancelSession, rateSession } = useSessionStore();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  
  useEffect(() => {
    fetchSessions();
  }, []);

  // Rating Modal state
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);
  const [selectedStars, setSelectedStars] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'upcoming') return s.status === 'upcoming' || s.status === 'requested';
    if (activeTab === 'completed') return s.status === 'completed';
    if (activeTab === 'cancelled') return s.status === 'cancelled' || s.status === 'rejected';
    return false;
  });

  const handleJoinMeeting = (sessionId: string) => {
    window.location.href = `/session/${sessionId}`;
  };

  const handleCancel = (sessionId: string, tutorName: string) => {
    cancelSession(sessionId);
    toast.success(`Session with ${tutorName} cancelled`, {
      description: 'The booking status has been updated to cancelled.',
    });
  };

  const handleSubmitRating = () => {
    if (!ratingSessionId) return;
    rateSession(ratingSessionId, selectedStars, reviewComment);
    toast.success('Thank you for rating your session! ⭐');
    setRatingSessionId(null);
    setReviewComment('');
  };

  const handleStartChat = async (session: Session) => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: session.studentId,
          tutorId: session.tutorId,
          sessionId: session.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/student/chat/${data.conversation.id}`);
      } else {
        toast.error('Failed to initialize chat');
      }
    } catch (error) {
      toast.error('Network error starting chat');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Video className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>My Sessions</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your booked doubt-solving calls, join live Google Meets, and view session history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'upcoming', label: 'Upcoming / Requested', count: sessions.filter(s=>s.status==='upcoming'||s.status==='requested').length },
          { id: 'completed', label: 'Past Sessions', count: sessions.filter(s=>s.status==='completed').length },
          { id: 'cancelled', label: 'Cancelled / Rejected', count: sessions.filter(s=>s.status==='cancelled'||s.status==='rejected').length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
              activeTab === tab.id
                ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sessions Content */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                    {session.subject}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{session.durationMinutes} Mins Session</span>
                  {session.status === 'requested' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/60 animate-pulse">
                      Awaiting Tutor Acceptance
                    </span>
                  )}
                  {session.status === 'upcoming' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60">
                      Confirmed by Tutor
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Tutor: {session.tutorName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{session.tutorTitle}</p>

                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {session.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    {session.time}
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-slate-900 dark:text-white">
                    <IndianRupee className="w-3.5 h-3.5" />
                    {session.price}
                  </span>
                </div>
                
                {activeTab === 'completed' && (session.notes || session.resources) && (
                  <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    {session.notes && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                          <FileText className="w-3 h-3" /> Session Notes
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{session.notes}</p>
                      </div>
                    )}
                    {session.resources && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                          <LinkIcon className="w-3 h-3" /> Resources
                        </h4>
                        <a href={session.resources} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                          {session.resources}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                {activeTab === 'upcoming' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleStartChat(session)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    {session.status === 'upcoming' && (
                      <button
                        type="button"
                        onClick={() => handleJoinMeeting(session.id)}
                        className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Meeting</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCancel(session.id, session.tutorName)}
                      className="px-3.5 py-2.5 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                    >
                      Cancel Request
                    </button>
                  </>
                )}

                {activeTab === 'completed' && (
                  <div className="flex flex-col md:items-end gap-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleStartChat(session)}
                      className="px-4 py-2 rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5 self-end"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    {session.rating ? (
                      <div className="flex flex-col items-start md:items-end">
                        <p className="text-xs text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-full">
                          You Rated {session.rating} ⭐
                        </p>
                        {session.reviewText && (
                          <p className="text-[11px] text-slate-500 italic max-w-xs line-clamp-2 mt-1">
                            "{session.reviewText}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setRatingSessionId(session.id);
                          setSelectedStars(5);
                          setReviewComment('');
                        }}
                        className="px-4 py-2 rounded-xl font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 flex items-center gap-1.5"
                      >
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>Rate & Review</span>
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'cancelled' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Cancelled Session
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Empty States per tab */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          {activeTab === 'upcoming' && (
            <EmptyState
              icon={Video}
              badgeText="No Upcoming Sessions"
              title="You haven't booked any doubt session"
              description="Connect with IITian tutors to clear your PCM/PCB concepts 1-on-1."
              actionText="Book Your First Session"
              onAction={() => window.location.href = '/student/tutors'}
            />
          )}

          {activeTab === 'completed' && (
            <EmptyState
              icon={CheckCircle2}
              badgeText="No History"
              title="No past sessions completed yet"
              description="Completed 1-on-1 doubt sessions and tutor recordings will appear here."
            />
          )}

          {activeTab === 'cancelled' && (
            <EmptyState
              icon={Ban}
              badgeText="Clean Record"
              title="No cancelled sessions"
              description="You have zero cancelled doubt sessions."
            />
          )}
        </div>
      )}

      {/* RATING MODAL */}
      {ratingSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Rate Your Doubt Session</h3>
              <button
                type="button"
                onClick={() => setRatingSessionId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stars */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setSelectedStars(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= selectedStars
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write a short review about how the tutor explained the concept..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              rows={3}
            />

            <button
              type="button"
              onClick={handleSubmitRating}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Submit Rating & Review
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
