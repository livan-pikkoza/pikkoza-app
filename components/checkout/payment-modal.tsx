'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tutor, useSessionStore } from '@/lib/session-store';
import { useAuthStore } from '@/lib/auth-store';
import { toast } from 'sonner';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Smartphone,
  CreditCard,
  IndianRupee,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: Tutor;
  subject: string;
  date: string;
  time: string;
  durationMinutes: number;
  totalPrice: number;
  onSuccessRedirect: () => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  tutor,
  subject,
  date,
  time,
  durationMinutes,
  totalPrice,
  onSuccessRedirect,
}: PaymentModalProps) {
  const { user } = useAuthStore();
  const { addSession } = useSessionStore();

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'bhim'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingSessionId, setBookingSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setBookingSessionId(null);
  }, [isOpen, tutor.id, subject, date, time]);

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    const sessionId = bookingSessionId || crypto.randomUUID();
    if (!bookingSessionId) setBookingSessionId(sessionId);

    // Call API-backed addSession (saves to PostgreSQL)
    const sessionData = {
      sessionId,
      tutorId: tutor.id,
      tutorName: tutor.name,
      tutorTitle: tutor.title,
      studentId: user?.id || '',
      studentName: user?.name || '',
      subject,
      date,
      time,
      durationMinutes,
      price: totalPrice,
      status: 'requested' as const,
    };

    const created = await addSession(sessionData);

    setIsProcessing(false);

    if (!created) {
      return;
    }

    setIsSuccess(true);

    toast.success('Session Requested Successfully! 🎉', {
      description: `Requested 1-on-1 session with ${tutor.name}. Awaiting tutor confirmation.`,
    });

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      onSuccessRedirect();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Confirm Doubt Session</h3>
              <p className="text-[11px] text-slate-400">Direct Tutor Request & Instant Scheduling</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing || isSuccess}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="py-10 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl transform scale-150" />
                  <div className="relative w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Booking Requested!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Your request for <span className="font-semibold text-slate-900 dark:text-white">{tutor.name}</span> has been sent.
                  </p>
                </div>
                <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-xs text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50">
                  Redirecting to My Sessions...
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" className="space-y-5">
                {/* Order Summary Box */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <span>1-ON-1 DOUBT SESSION</span>
                    <span>{durationMinutes} MINS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{tutor.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{subject} &bull; {date} at {time}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">₹{totalPrice}</span>
                      <p className="text-[10px] text-slate-400">Estimated Rate</p>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:scale-[0.99] transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Request to Server...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Confirm & Send Booking Request</span>
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
