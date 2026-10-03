'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { HelpCircle, Filter, Loader2, User, GraduationCap, Image as ImageIcon, ExternalLink } from 'lucide-react';

interface AdminDoubt {
  id: string;
  subject: string;
  content: string | null;
  imageUrl: string | null;
  status: string;
  createdAt: string;
  student: { id: string; name: string; email: string };
  tutor: { id: string; name: string; email: string } | null;
}

const STATUS_OPTIONS = ['ALL', 'OPEN', 'ACCEPTED', 'REJECTED'];
const SUBJECT_OPTIONS = ['ALL', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'];

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  ACCEPTED: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
  REJECTED: 'bg-rose-50 dark:bg-rose-950 text-rose-500 dark:text-rose-400',
};

export default function AdminDoubtsPage() {
  const [doubts, setDoubts] = useState<AdminDoubt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchDoubts = async (status: string, subject: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== 'ALL') params.set('status', status);
      if (subject !== 'ALL') params.set('subject', subject);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await fetch(`/api/admin/doubts${query}`);
      if (res.ok) {
        const data = await res.json();
        setDoubts(data.doubts);
      } else {
        toast.error('Failed to load doubts');
      }
    } catch (error) {
      toast.error('Network error loading doubts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts(selectedStatus, selectedSubject);
  }, [selectedStatus, selectedSubject]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HelpCircle className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Platform Doubts Monitor</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View and monitor all student doubts submitted across the platform.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>
              ))}
            </select>
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
          >
            {SUBJECT_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'All Subjects' : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Row */}
      {!isLoading && (
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total', count: doubts.length, color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800' },
            { label: 'Open', count: doubts.filter(d => d.status === 'OPEN').length, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950' },
            { label: 'Accepted', count: doubts.filter(d => d.status === 'ACCEPTED').length, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950' },
            { label: 'Rejected', count: doubts.filter(d => d.status === 'REJECTED').length, color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950' },
          ].map((stat) => (
            <span key={stat.label} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${stat.color}`}>
              {stat.label}: {stat.count}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : doubts.length > 0 ? (
        <div className="space-y-3">
          {doubts.map((doubt) => {
            const isExpanded = expandedId === doubt.id;
            return (
              <div
                key={doubt.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                {/* Summary Row */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : doubt.id)}
                  className="w-full text-left p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status */}
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[doubt.status] || 'bg-slate-100 text-slate-500'}`}>
                      {doubt.status}
                    </span>
                    {/* Subject */}
                    <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {doubt.subject}
                    </span>
                    {/* Content Preview */}
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate flex-1">
                      {doubt.content ? doubt.content : '(Image only)'}
                    </span>
                    {/* Attachment Indicator */}
                    {doubt.imageUrl && (
                      <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 shrink-0">
                    {new Date(doubt.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    
                    {/* Participants */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {doubt.student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <User className="w-3 h-3" /> Student
                          </p>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{doubt.student.name}</p>
                          <p className="text-[10px] text-slate-400">{doubt.student.email}</p>
                        </div>
                      </div>

                      {doubt.tutor ? (
                        <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {doubt.tutor.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" /> Assigned Tutor
                            </p>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{doubt.tutor.name}</p>
                            <p className="text-[10px] text-slate-400">{doubt.tutor.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-400 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-medium">Tutor</p>
                            <p className="text-xs text-slate-400 italic">Not yet assigned</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Doubt Content */}
                    {doubt.content && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Doubt Text</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{doubt.content}</p>
                      </div>
                    )}

                    {/* Doubt Image */}
                    {doubt.imageUrl && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> Attached Image
                        </p>
                        <div className="relative group inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doubt.imageUrl}
                            alt="Doubt image"
                            className="max-h-64 max-w-xs object-contain"
                          />
                          <a
                            href={doubt.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-5 h-5 text-white" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={HelpCircle}
            badgeText="Zero Doubts"
            title="No doubts found"
            description="Student doubt submissions will appear here for platform monitoring."
          />
        </div>
      )}

    </div>
  );
}
