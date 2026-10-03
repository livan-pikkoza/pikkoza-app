'use client';

interface PikkozaLogoProps {
  variant?: 'full' | 'icon' | 'login';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PikkozaLogo({ variant = 'icon', className = '', size = 'md' }: PikkozaLogoProps) {
  if (variant === 'login') {
    return (
      <div className={`flex flex-col items-center sm:items-start ${className}`}>
        <div className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-2xl shadow-indigo-900/40 border border-white/20 max-w-[320px] transition-transform hover:scale-[1.02]">
          <img
            src="/logo.jpg"
            alt="Pikkoza - Doubt aaye hazaar, Pikkoza hai taiyaar!"
            className="w-full h-auto object-contain rounded-xl"
          />
        </div>
      </div>
    );
  }

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`relative overflow-hidden rounded-xl bg-white p-0.5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shrink-0 ${iconSizes[size]} ${className}`}>
      <img
        src="/logo.jpg"
        alt="Pikkoza Icon"
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
  );
}
