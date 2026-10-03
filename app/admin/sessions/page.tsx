'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { Video, Filter, Loader2, User, GraduationCap, Calendar, IndianRupee } from 'lucide-react';

interface AdminSession {
  id: string;
  subject: string;
  date: string;
  time: string;
  durationMinutes: number;
  price: number;
  status: string;
  createdAt: string;
  student: { id: string; name: string; email: string };
  tutor: { id: string; name: string; email: string };
}

const STATUS_OPTIONS = ['ALL', 'REQUESTED', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'REJECTED'];

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
  COMPLETED: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400',
  REQUESTED: 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
  REJECTED: 'bg-rose-50 dark:bg-rose-950 text-rose-500 dark:text-rose-400',
  CANCELLED: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
};

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const fetchSessions = async (status: string) => {
    setIsLoading(true);
    try {
      const params = status !== 'ALL' ? `?status=${status}` : '';
      const res = await fetch(`/api/admin/sessions${params}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      } else {
        toast.error('Failed to load sessions');
      }
    } catch (error) {
      toast.error('Network error loading sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions(selectedStatus);
  }, [selectedStatus]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Video className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Master Sessions Directory</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervise all active, completed, and cancelled 1-on-1 doubt calls across the platform.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : sessions.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-bold text-[10px] text-slate-400 dark:text-slate-500 tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Tutor</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {s.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{s.student.name}</p>
                          <p className="text-[10px] text-slate-400">{s.student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-700 dark:text-slate-300">{s.tutor.name}</p>
                          <p className="text-[10px] text-slate-400">{s.tutor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{s.date} at {s.time} ({s.durationMinutes}m)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        <span>{s.price}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[s.status] || 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={Video}
            badgeText="Zero Records"
            title="No sessions found"
            description="Booked doubt calls and session logs will appear here once students start booking tutors."
          />
        </div>
      )}

    </div>
  );
}
