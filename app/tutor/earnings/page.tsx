'use client';

import { useSessionStore } from '@/lib/session-store';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { IndianRupee, Wallet, ArrowUpRight, TrendingUp, History } from 'lucide-react';

export default function TutorEarningsPage() {
  const { sessions } = useSessionStore();

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalEarned = completedSessions.reduce((sum, s) => sum + s.price, 0);

  const handleWithdraw = () => {
    if (totalEarned === 0) {
      toast.info('No balance available for payout', {
        description: 'Complete doubt-clearing sessions to earn credit.',
      });
    } else {
      toast.success('Payout Request Submitted! 💸', {
        description: `₹${totalEarned} will be transferred to your registered bank account within 24 hours.`,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <IndianRupee className="w-7 h-7 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
          <span>Tutor Earnings & Payouts</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track session earnings, pending payouts, and request instant bank transfers in ₹.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Total Earned Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-500/15 space-y-3">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-bold uppercase tracking-wider">Total Earned</span>
            <Wallet className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black flex items-center">
            <IndianRupee className="w-7 h-7 stroke-[3]" />
            <span>{totalEarned}</span>
          </div>
          <p className="text-xs text-emerald-100">{completedSessions.length} paid doubt sessions</p>
        </div>

        {/* This Month */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">This Month</span>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center">
            <IndianRupee className="w-6 h-6 stroke-[3]" />
            <span>{totalEarned}</span>
          </div>
          <p className="text-xs text-slate-400">Current cycle earnings</p>
        </div>

        {/* Pending Payout */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Pending Payout</span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 flex items-center">
              <IndianRupee className="w-6 h-6 stroke-[3]" />
              <span>{totalEarned}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleWithdraw}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>Request Bank Payout</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Transaction History Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Payout Transaction History</span>
        </h2>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={Wallet}
            badgeText="Zero Transactions"
            title="No payout history yet"
            description="Your weekly bank transfer logs and session credits will be listed here."
          />
        </div>
      </div>

    </div>
  );
}
