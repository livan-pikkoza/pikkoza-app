'use client';

import { useState } from 'react';
import { useTutorStore, TimeSlot } from '@/lib/tutor-store';
import { toast } from 'sonner';
import { Clock, Plus, Trash2, CheckCircle2, Sparkles, Calendar } from 'lucide-react';

export default function TutorAvailabilityPage() {
  const { isAvailableNow, setAvailableNow, weeklySlots, addTimeSlot, removeTimeSlot } = useTutorStore();

  const [selectedDay, setSelectedDay] = useState<TimeSlot['day']>('Monday');
  const [startTime, setStartTime] = useState('04:00 PM');
  const [endTime, setEndTime] = useState('06:00 PM');

  const daysList: TimeSlot['day'][] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    addTimeSlot({
      day: selectedDay,
      startTime,
      endTime,
    });
    toast.success(`Added ${selectedDay} (${startTime} - ${endTime}) slot!`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Manage Availability</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Control your live status and set weekly time slots when students can request 1-on-1 sessions.
        </p>
      </div>

      {/* Instant Live Toggle Card */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isAvailableNow
          ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isAvailableNow ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Live Status: {isAvailableNow ? 'Available Now for Doubts' : 'Offline'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAvailableNow
                ? 'Your profile is live on the student tutor directory. Students can match with you instantly.'
                : 'Turn on Live Availability to start receiving instant doubt calls.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setAvailableNow(!isAvailableNow);
              toast.success(isAvailableNow ? 'Marked Offline' : 'Marked Live & Available!');
            }}
            className={`px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all shadow-md ${
              isAvailableNow
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
            }`}
          >
            {isAvailableNow ? 'Turn Offline' : 'Go Live Now'}
          </button>
        </div>
      </div>

      {/* Weekly Schedule Manager */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>Weekly Recurring Time Slots</span>
        </h3>

        {/* Add Slot Form */}
        <form onSubmit={handleAddSlot} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Add New Availability Slot
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              {daysList.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="e.g. 04:00 PM"
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />

            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="e.g. 06:00 PM"
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            />

            <button
              type="submit"
              className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Slot</span>
            </button>
          </div>
        </form>

        {/* Existing Slots List */}
        <div className="space-y-2">
          {weeklySlots.length > 0 ? (
            weeklySlots.map((slot, index) => (
              <div
                key={`${slot.day}-${slot.startTime}-${index}`}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-24 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-center">
                    {slot.day}
                  </span>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {slot.startTime} &ndash; {slot.endTime}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    removeTimeSlot(index);
                    toast.info('Removed slot');
                  }}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic py-4 text-center">No time slots added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
