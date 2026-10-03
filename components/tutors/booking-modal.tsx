'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tutor } from '@/lib/session-store';
import { PaymentModal } from '@/components/checkout/payment-modal';
import {
  X,
  Star,
  Clock,
  Calendar as CalendarIcon,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';

interface BookingModalProps {
  tutor: Tutor | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccessRedirect: () => void;
}

// Returns today's date as YYYY-MM-DD
function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// Returns a time string like "15:30" rounded to next 30 mins
function getNextSlotTime() {
  const now = new Date();
  const mins = now.getMinutes();
  const roundedMins = mins < 30 ? 30 : 0;
  const addHour = mins >= 30 ? 1 : 0;
  const hours = (now.getHours() + addHour) % 24;
  return `${String(hours).padStart(2, '0')}:${String(roundedMins).padStart(2, '0')}`;
}

export function BookingModal({
  tutor,
  isOpen,
  onClose,
  onSuccessRedirect,
}: BookingModalProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [duration, setDuration] = useState<number>(30);
  // Real date & time state
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedTime, setSelectedTime] = useState<string>(getNextSlotTime());
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!isOpen || !tutor) return null;

  const currentSubject = selectedSubject || tutor.subjects[0] || 'Physics';

  // Calculate price: (duration / 30) * hourlyRate
  const totalPrice = Math.round((duration / 30) * tutor.hourlyRate);

  // Format display label
  const formattedDateLabel = (() => {
    if (!selectedDate) return '—';
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  })();

  const formattedTimeLabel = (() => {
    if (!selectedTime) return '—';
    const [h, m] = selectedTime.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
  })();

  // Min date: today
  const minDate = getTodayStr();

  const handleProceed = () => {
    if (!selectedDate || !selectedTime) {
      return;
    }
    setShowPaymentModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white my-8"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Book 1-on-1 Doubt Session</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

            {/* Tutor Profile Summary */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
                {tutor.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{tutor.name}</h3>
                  {tutor.availableNow && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Available Now
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{tutor.title} &bull; {tutor.institute}</span>
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {tutor.rating} <span className="text-slate-400 font-normal">({tutor.reviewCount} reviews)</span>
                  </span>
                  <span className="text-slate-400">&bull;</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">₹{tutor.hourlyRate} / 30 mins</span>
                </div>
              </div>
            </div>

            {/* Select Subject */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Select Subject / Topic
              </label>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      currentSubject === sub
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Duration */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Select Session Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      duration === mins
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 font-bold text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">{mins}</span>
                    <span className="text-[10px] text-slate-400">Mins</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date & Time */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                3. Choose Date & Time
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={minDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                  />
                </div>

                {/* Time picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition"
                  />
                </div>
              </div>

              {/* Quick preset slots */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-slate-400">Quick slots</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Now', date: getTodayStr(), time: getNextSlotTime() },
                    { label: 'Today 6 PM', date: getTodayStr(), time: '18:00' },
                    { label: 'Today 8 PM', date: getTodayStr(), time: '20:00' },
                    {
                      label: 'Tomorrow 4 PM',
                      date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(),
                      time: '16:00',
                    },
                    {
                      label: 'Tomorrow 7 PM',
                      date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(),
                      time: '19:00',
                    },
                  ].map((slot) => (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => { setSelectedDate(slot.date); setSelectedTime(slot.time); }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                        selectedDate === slot.date && selectedTime === slot.time
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary pill */}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/50 rounded-xl px-3 py-2 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  Scheduled for <span className="font-bold">{formattedDateLabel}</span> at <span className="font-bold">{formattedTimeLabel}</span>
                </div>
              )}
            </div>

            {/* Price Breakdown Footer */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Calculated Price</p>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center">
                  <IndianRupee className="w-5 h-5 stroke-[3]" />
                  <span>{totalPrice}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceed}
                disabled={!selectedDate || !selectedTime}
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Proceed to Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Payment Modal - passes real YYYY-MM-DD date and HH:MM time */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        tutor={tutor}
        subject={currentSubject}
        date={selectedDate}
        time={selectedTime}
        durationMinutes={duration}
        totalPrice={totalPrice}
        onSuccessRedirect={() => {
          onClose();
          onSuccessRedirect();
        }}
      />
    </>
  );
}
