'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore, Session } from '@/lib/session-store';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Check,
  X,
  IndianRupee,
  Star,
  CheckCircle2,
  Ban,
  User,
  FileText,
  Link as LinkIcon,
  MessageCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TutorSessionsPage() {
  const { sessions, fetchSessions, acceptSession, rejectSession, completeSession, updateSessionDetails } = useSessionStore();
  const router = useRouter();
  
  useEffect(() => {
    fetchSessions();
  }, []);

  const [activeTab, setActiveTab] = useState<'requested' | 'upcoming' | 'completed' | 'cancelled'>('requested');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editResources, setEditResources] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const getFilteredSessions = () => {
    if (activeTab === 'requested') return sessions.filter((s) => s.status === 'requested');
    if (activeTab === 'upcoming') return sessions.filter((s) => s.status === 'upcoming');
    if (activeTab === 'completed') return sessions.filter((s) => s.status === 'completed');
    return sessions.filter((s) => s.status === 'cancelled' || s.status === 'rejected');
  };

  const currentSessions = getFilteredSessions();

  const handleAccept = (sessionId: string, studentName?: string) => {
    acceptSession(sessionId);
    toast.success(`Session Confirmed with ${studentName || 'Student'}! 🎉`, {
      description: 'The session has been moved to your Upcoming schedule.',
    });
  };

  const handleReject = (sessionId: string) => {
    rejectSession(sessionId);
    toast.info('Session request declined');
  };

  const handleComplete = (sessionId: string) => {
    completeSession(sessionId);
    toast.success('Session marked as completed! 💰', {
      description: 'Session earnings added to your wallet balance.',
    });
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
        router.push(`/tutor/chat/${data.conversation.id}`);
      } else {
        toast.error('Failed to initialize chat');
      }
    } catch (error) {
      toast.error('Network error starting chat');
    }
  };

  const openEditModal = (session: Session) => {
    setEditingSessionId(session.id);
    setEditNotes(session.notes || '');
    setEditResources(session.resources || '');
  };

  const handleSaveDetails = async () => {
    if (!editingSessionId) return;
    setIsSaving(true);
    try {
      await updateSessionDetails(editingSessionId, editNotes, editResources);
      toast.success('Session details saved successfully');
      setEditingSessionId(null);
    } catch (e) {
      toast.error('Failed to save session details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Video className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Tutor Session Manager</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review incoming student doubt requests, launch live Meet calls, and view session history.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4">
        {[
          { id: 'requested', label: 'Incoming Requests', count: sessions.filter(s=>s.status==='requested').length },
          { id: 'upcoming', label: 'Upcoming', count: sessions.filter(s=>s.status==='upcoming').length },
          { id: 'completed', label: 'Completed', count: sessions.filter(s=>s.status==='completed').length },
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

      {/* Content */}
      {currentSessions.length > 0 ? (
        <div className="space-y-4">
          {currentSessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50">
                    {session.subject}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{session.durationMinutes} Mins Session</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  <span>Student: {session.studentName || 'JEE Aspirant'}</span>
                </h3>

                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    {session.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    {session.time}
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
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

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0 flex-col md:items-end">
                {activeTab === 'requested' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAccept(session.id, session.studentName)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Request</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(session.id)}
                      className="px-3.5 py-2.5 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                )}

                {activeTab === 'upcoming' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartChat(session)}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.location.href = `/session/${session.id}`}
                      className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Video className="w-4 h-4" />
                      <span>Join Session</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleComplete(session.id)}
                      className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/40"
                    >
                      Mark Completed
                    </button>
                  </div>
                )}

                {activeTab === 'completed' && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStartChat(session)}
                        className="px-4 py-1.5 rounded-full font-bold text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                        Finished & Paid (₹{session.price})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditModal(session)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {session.notes || session.resources ? 'Edit Notes & Resources' : '+ Add Notes & Resources'}
                    </button>
                    {session.rating && (
                      <div className="mt-1 flex flex-col items-end">
                        <p className="text-xs text-amber-500 font-bold">
                          Rated {session.rating} ⭐
                        </p>
                        {session.reviewText && (
                          <p className="text-[11px] text-slate-500 italic max-w-xs text-right line-clamp-2 mt-0.5">
                            "{session.reviewText}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'cancelled' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {session.status === 'rejected' ? 'Declined by Tutor' : 'Cancelled'}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          {activeTab === 'requested' && (
            <EmptyState
              icon={Video}
              badgeText="No Requests"
              title="No incoming session requests"
              description="When students select you for a doubt session, their requests will appear here for confirmation."
            />
          )}

          {activeTab === 'upcoming' && (
            <EmptyState
              icon={Calendar}
              badgeText="Schedule Clear"
              title="No upcoming sessions scheduled"
              description="Confirmed sessions with students will appear here with instant Meet launchers."
            />
          )}

          {activeTab === 'completed' && (
            <EmptyState
              icon={CheckCircle2}
              badgeText="Zero History"
              title="No completed sessions yet"
              description="Finished doubt calls and session earnings will log here."
            />
          )}

          {activeTab === 'cancelled' && (
            <EmptyState
              icon={Ban}
              badgeText="Clean Record"
              title="No cancelled or declined sessions"
              description="You have zero declined or cancelled session records."
            />
          )}
        </div>
      )}

      {/* Editing Modal */}
      {editingSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Session Notes & Resources</h3>
              <button
                type="button"
                onClick={() => setEditingSessionId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Session Notes (for Student)</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="E.g., We covered Newton's 3rd Law..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resource Link (Optional)</label>
                <input
                  type="url"
                  value={editResources}
                  onChange={(e) => setEditResources(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={isSaving}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Details'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
