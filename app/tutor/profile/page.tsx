'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useTutorStore } from '@/lib/tutor-store';
import { toast } from 'sonner';
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  IndianRupee,
  ShieldCheck,
  Check,
  Save,
  Camera,
  Loader2,
  Shield,
  LogOut,
} from 'lucide-react';

export default function TutorProfilePage() {
  const { user, updateProfile, logout, verifySession } = useAuthStore();
  const { registerOrUpdateTutor } = useTutorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(
    user?.bio || 'IIT Bombay Alumni with 5+ years experience mentoring JEE & NEET rankers.'
  );
  const [qualifications, setQualifications] = useState(user?.qualifications || 'B.Tech Electrical, IIT Bombay');
  const [experienceYears, setExperienceYears] = useState<number>(user?.experienceYears || 5);
  const [hourlyRate, setHourlyRate] = useState<number>(user?.hourlyRate || 199);
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>(
    user?.teachingSubjects || ['Physics', 'Mathematics']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Refresh user data from DB on mount to get latest verification status
  useEffect(() => {
    verifySession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setBio(user.bio || 'IIT Bombay Alumni with 5+ years experience mentoring JEE & NEET rankers.');
      setQualifications(user.qualifications || 'B.Tech Electrical, IIT Bombay');
      setExperienceYears(user.experienceYears || 5);
      setHourlyRate(user.hourlyRate || 199);
      setTeachingSubjects(user.teachingSubjects || ['Physics', 'Mathematics']);
    }
  }, [user]);

  const availableSubjects = [
    'Physics',
    'Chemistry',
    'Mathematics',
    'Biology',
    'Mechanics',
    'Calculus',
    'Organic Chemistry',
    'NEET Prep',
  ];

  const toggleSubject = (sub: string) => {
    if (teachingSubjects.includes(sub)) {
      setTeachingSubjects(teachingSubjects.filter((s) => s !== sub));
    } else {
      setTeachingSubjects([...teachingSubjects, sub]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to upload photo');
        return;
      }

      const uploadedUrl = data.url || data.imageUrl;
      setAvatar(uploadedUrl);
      await updateProfile({ avatar: uploadedUrl });
      toast.success('Tutor profile photo updated!');
    } catch {
      toast.error('Error uploading photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfile({
        name,
        phone,
        avatar,
        bio,
        qualifications,
        experienceYears: Number(experienceYears),
        hourlyRate: Number(hourlyRate),
        teachingSubjects,
      });

      registerOrUpdateTutor({
        id: user?.id || 'tut_active',
        name,
        title: qualifications,
        institute: qualifications.includes('IIT') ? 'IIT Bombay' : 'Premier Institute',
        rating: 4.9,
        reviewCount: 18,
        hourlyRate: Number(hourlyRate),
        subjects: teachingSubjects,
        bio,
        availableNow: true,
      });

      toast.success('Tutor Profile Saved & Published! ✨');
    } catch {
      toast.error('Failed to save tutor profile');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'TU';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <UserIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Tutor Profile Setup</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your profile picture, academic credentials, hourly pricing in ₹, and subjects taught.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <form
          onSubmit={handleSave}
          className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6"
        >
          {/* Avatar & Verification status */}
          <div className="flex items-center gap-5 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-2xl font-black shadow-md border-2 border-indigo-200 dark:border-indigo-800">
                {avatar ? (
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 bg-slate-950/60 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border mt-1 ${
                user?.verificationStatus === 'approved'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/50'
                  : user?.verificationStatus === 'rejected'
                  ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200/50'
                  : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200/50'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                Verification: {(user?.verificationStatus || 'pending').charAt(0).toUpperCase() + (user?.verificationStatus || 'pending').slice(1)}
              </span>
              {user?.verificationStatus === 'pending' && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">⏳ Awaiting admin approval to appear in student directory.</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Educator Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Educator Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Dr. Ananya Roy"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || 'tutor@pikkoza.in'}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Bio / About Me
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Share your teaching style, achievements, AIR rank, or credentials..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Qualifications */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Qualifications & Institute
                </label>
                <input
                  type="text"
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science, IIT Bombay"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>

              {/* Experience */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  min={0}
                  max={40}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>
            </div>

            {/* Session Rate */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Session Rate (₹ per 30 minutes)
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 stroke-[3]" />
                <input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  step={10}
                  min={50}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Subjects */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Subjects I Teach
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSubjects.map((sub) => {
                  const isSelected = teachingSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Educator Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Publish Profile</span>
              </>
            )}
          </button>
        </form>

        {/* Account Management Actions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              Account Security &amp; Actions
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your session sign-out or account removal preferences.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                logout();
                toast.success('Logged out');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
            <p className="px-2 text-[11px] text-slate-500 dark:text-slate-400">For account deactivation, contact a Pikkoza administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
