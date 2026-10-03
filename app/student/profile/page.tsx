'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import {
  User as UserIcon,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Target,
  ShieldCheck,
  Save,
  Camera,
  Loader2,
  LogOut,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function StudentProfilePage() {
  const { user, updateProfile, logout, verifySession } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [grade, setGrade] = useState(user?.grade || 'Class 12');
  const [stream, setStream] = useState(user?.stream || 'PCM');
  const [targetExam, setTargetExam] = useState(user?.targetExam || 'JEE Main & Advanced');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Refresh user data from DB on mount to pick up any status changes
  useEffect(() => {
    verifySession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGrade(user.grade || 'Class 12');
      setStream(user.stream || 'PCM');
      setTargetExam(user.targetExam || 'JEE Main & Advanced');
      setAvatar(user.avatar || '');
    }
  }, [user]);

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
      toast.success('Profile photo updated!');
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
        grade,
        stream,
        targetExam,
        avatar,
      });
      toast.success('Student profile saved successfully! ✨');
    } catch {
      toast.error('Failed to save profile');
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
    : 'ST';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Student Profile Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Update your personal details, academic class, stream, and target exam goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Details Form Card */}
        <form
          onSubmit={handleSave}
          className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6"
        >
          {/* Header Avatar & Name */}
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
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {name || 'Student'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {grade} • {stream} Aspirant
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/50 mt-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Student Account
              </span>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>
            </div>

            {/* Email (Read only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Email Address (Read-only)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  value={user?.email || ''}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Class / Grade */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Class / Grade
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                  <option value="Dropper / Repeater">Dropper / Repeater</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                </select>
              </div>

              {/* Stream */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Academic Stream
                </label>
                <select
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="PCM">PCM (Physics, Chem, Math)</option>
                  <option value="PCB">PCB (Physics, Chem, Biology)</option>
                  <option value="PCMB">PCMB (Both Math & Bio)</option>
                  <option value="Commerce">Commerce</option>
                  <option value="Arts / Humanities">Arts / Humanities</option>
                </select>
              </div>

            </div>

            {/* Target Exam */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Target Exam
              </label>
              <div className="relative">
                <Target className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  placeholder="e.g. JEE Main & Advanced, NEET UG, CBSE Board"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                />
              </div>
            </div>

          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-98 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Student Profile</span>
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
