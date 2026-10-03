'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function GoogleCalendarConnection() {
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const result = query.get('googleCalendar');
    if (result === 'connected') toast.success('Organizer Google Calendar connected.');
    else if (result === 'configuration-error') toast.error('Google OAuth server configuration is incomplete.');
    else if (result === 'calendar-scope-missing') toast.error('Grant Pikkoza permission to manage events on the organizer calendar.');
    else if (result) toast.error('Google Calendar authorization did not complete.');

    fetch('/api/admin/google-oauth/status')
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to read connection status.');
        const data = await response.json();
        setConnected(Boolean(data.connected));
      })
      .catch(() => toast.error('Unable to check Google Calendar connection.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950 p-2 text-indigo-600 dark:text-indigo-400">
          <CalendarDays className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-900 dark:text-white">Organizer Google Calendar</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect the dedicated Pikkoza organizer account once. Students and tutors do not authorize Google.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-950 p-4">
        <div className="flex items-center gap-2 text-sm">
          <ShieldCheck className={`w-4 h-4 ${connected ? 'text-emerald-500' : 'text-slate-400'}`} />
          <span className="text-slate-700 dark:text-slate-300">
            {isLoading ? 'Checking connection…' : connected ? 'Organizer account connected' : 'Organizer account not connected'}
          </span>
        </div>
        <a
          href="/api/admin/google-oauth/start"
          className="inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {connected ? 'Authorize again' : 'Connect Google Calendar'}
        </a>
      </div>
    </section>
  );
}
