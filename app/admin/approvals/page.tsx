'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { ShieldCheck, GraduationCap, Check, X, Star, IndianRupee, AlertCircle } from 'lucide-react';

interface TutorData {
  id: string;
  name: string;
  email: string;
  status: string;
  verificationStatus: string;
  qualifications: string;
  subjects: string[];
  joinedAt: string;
  hourlyRate?: number;
  bio?: string;
}

export default function AdminTutorApprovalsPage() {
  const [tutors, setTutors] = useState<TutorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const fetchTutors = async () => {
    try {
      const res = await fetch('/api/admin/tutors');
      if (res.ok) {
        const data = await res.json();
        setTutors(data.tutors);
      }
    } catch (error) {
      toast.error('Failed to load tutors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  const pendingTutors = tutors.filter((u) => u.verificationStatus === activeTab);

  const handleAction = async (tutorId: string, tutorName: string, action: 'VERIFY' | 'REJECT') => {
    try {
      const res = await fetch('/api/admin/tutors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tutorId, action }),
      });
      if (res.ok) {
        setTutors((prev) =>
          prev.map((t) => (t.id === tutorId ? { ...t, verificationStatus: action === 'VERIFY' ? 'APPROVED' : 'REJECTED' } : t))
        );
        toast.success(`Tutor ${action === 'VERIFY' ? 'Approved' : 'Rejected'}`, {
          description: `${tutorName}'s verification status updated.`,
        });
      } else {
        toast.error('Failed to update tutor status');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <ShieldCheck className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Tutor Verification Approvals</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review educator academic credentials, IIT/AIIMS degrees, and approve live directory access.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4">
        {[
          { id: 'PENDING', label: 'Pending Verification', count: tutors.filter(u=>u.verificationStatus==='PENDING').length },
          { id: 'APPROVED', label: 'Approved Tutors', count: tutors.filter(u=>u.verificationStatus==='APPROVED').length },
          { id: 'REJECTED', label: 'Rejected', count: tutors.filter(u=>u.verificationStatus==='REJECTED').length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {pendingTutors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pendingTutors.map((tutor) => (
            <div
              key={tutor.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-base flex items-center justify-center shadow-sm">
                      {tutor.name.split(' ').map((n: string)=>n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{tutor.name}</h3>
                      <p className="text-xs text-slate-400">{tutor.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    {tutor.verificationStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-indigo-500" />
                    <span>{tutor.qualifications}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    "{tutor.bio || 'Dedicated educator passionate about mentoring students.'}"
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Requested Hourly Rate:</span>
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹{tutor.hourlyRate || 199} / 30 min
                  </span>
                </div>
              </div>

              {/* Actions */}
              {activeTab === 'PENDING' && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleAction(tutor.id, tutor.name, 'VERIFY')}
                    className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Tutor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction(tutor.id, tutor.name, 'REJECT')}
                    className="py-2.5 px-4 rounded-xl font-semibold text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={ShieldCheck}
            badgeText="All Clear"
            title="No pending approvals"
            description="All educator verification applications have been reviewed and processed."
          />
        </div>
      )}

    </div>
  );
}
