'use client';

import { motion } from 'framer-motion';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  badgeText?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = HelpCircle,
  title,
  description,
  actionText,
  onAction,
  badgeText = 'No Activity',
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 ${className}`}
    >
      <div className="relative mb-5 flex items-center justify-center">
        {/* Decorative background aura */}
        <div className="absolute inset-0 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-xl transform scale-150" />
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
      </div>

      {badgeText && (
        <span className="mb-2 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-200/50 dark:border-indigo-800/50">
          {badgeText}
        </span>
      )}

      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-1.5">
        {title}
      </h3>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm hover:shadow-indigo-500/25"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  );
}
