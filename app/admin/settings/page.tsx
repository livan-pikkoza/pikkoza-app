'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { toast } from 'sonner';
import { Settings, Percent, Mail, IndianRupee, Save, ShieldCheck } from 'lucide-react';
import { GoogleCalendarConnection } from '@/components/admin/google-calendar-connection';

export default function AdminSettingsPage() {
  const { platformFeePercentage, supportEmail, updateSettings } = useAdminStore();

  const [fee, setFee] = useState<number>(platformFeePercentage);
  const [email, setEmail] = useState<string>(supportEmail);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      updateSettings(Number(fee), email);
      setIsSaving(false);
      toast.success('Platform Settings Saved! ⚙️', {
        description: `Platform fee updated to ${fee}%.`,
      });
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Platform Settings</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure Pikkoza commission fees, currency defaults, and support contact details.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Pikkoza Global Config</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Settings affect fee calculations across student checkouts and tutor earnings.</p>
          </div>
        </div>

        {/* Commission Fee Percentage */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Platform Commission Fee (%)
          </label>
          <div className="relative">
            <Percent className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
              min={0}
              max={50}
              step={1}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <p className="text-xs text-slate-400">Pikkoza retains {fee}% from total session booking amounts.</p>
        </div>

        {/* Support Email */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Platform Support Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Currency Display (Read only) */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Default Platform Currency
          </label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 stroke-[3]" />
            <input
              type="text"
              value="INR (Indian Rupee - ₹)"
              readOnly
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed font-semibold"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <span>Saving Config...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Admin Settings</span>
            </>
          )}
        </button>
      </form>

      <GoogleCalendarConnection />
    </div>
  );
}
