'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';

export default function TutorDoubtsPage() {
  const [doubts, setDoubts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    fetchDoubts();
  }, []);

  const fetchDoubts = async () => {
    try {
      const res = await fetch('/api/doubts');
      if (!res.ok) throw new Error('Failed to fetch doubts');
      const data = await res.json();
      setDoubts(data.doubts);
    } catch (err) {
      console.error(err);
      toast.error('Could not load incoming doubts');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'ACCEPT' | 'REJECT') => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/doubts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${action.toLowerCase()} doubt`);
      }

      toast.success(`Doubt successfully ${action.toLowerCase()}ed!`);
      // Update locally or refetch
      fetchDoubts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
      fetchDoubts(); // Refresh in case it was taken by someone else
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Open (Available)</span>;
      case 'ACCEPTED': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Accepted by You</span>;
      case 'REJECTED': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">Rejected by You</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Incoming Doubts
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accept open student doubts to answer them. First come, first served.
          </p>
        </div>
        <button
          onClick={fetchDoubts}
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          Refresh List
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : doubts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={HelpCircle}
            badgeText="All Caught Up"
            title="No incoming doubts right now"
            description="When students post new questions, they will appear here for you to accept and answer."
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doubts.map((doubt) => (
            <div key={doubt.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{doubt.subject}</span>
                {getStatusBadge(doubt.status)}
              </div>
              
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Student: <span className="text-slate-800 dark:text-slate-200">{doubt.student.name}</span>
              </div>

              {doubt.content && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 line-clamp-4">
                  {doubt.content}
                </p>
              )}
              
              {doubt.imageUrl && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mb-4 border border-slate-200 dark:border-slate-700">
                  <a href={doubt.imageUrl} target="_blank" rel="noreferrer">
                    <img src={doubt.imageUrl} alt="Doubt" className="object-cover w-full h-full hover:scale-105 transition-transform duration-300" />
                  </a>
                </div>
              )}

              <div className="mt-auto pt-4 flex flex-col gap-3">
                <span className="text-xs text-slate-400">
                  Posted: {new Date(doubt.createdAt).toLocaleString()}
                </span>
                
                {doubt.status === 'OPEN' && (
                  <div className="flex gap-2 w-full mt-2">
                    <button
                      onClick={() => handleAction(doubt.id, 'ACCEPT')}
                      disabled={actioningId === doubt.id}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      {actioningId === doubt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(doubt.id, 'REJECT')}
                      disabled={actioningId === doubt.id}
                      className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
