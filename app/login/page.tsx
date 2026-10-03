'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import { loginSchema, signupSchema } from '@/lib/validators';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { PikkozaLogo } from '@/components/ui/pikkoza-logo';
import { toast } from 'sonner';
import {
  auth,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  signOut,
} from '@/lib/firebase';
import {
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user, login } = useAuthStore();

  const [role, setRole] = useState<'student' | 'tutor' | 'admin'>('student');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification state
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  // Google New User Role Selection Modal State
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    email: string;
    name: string;
    firebaseUid: string;
    photoURL?: string;
  } | null>(null);
  const [googleRole, setGoogleRole] = useState<'student' | 'tutor'>('student');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    targetExam: 'JEE Main & Advanced',
    qualifications: 'B.Tech Electrical, IIT Bombay',
    hourlyRate: 199,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'tutor') {
        router.replace('/tutor');
      } else {
        router.replace('/student');
      }
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleTabSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    if (newMode === 'signup' && role === 'admin') {
      setRole('student');
    }
    setErrors({});
    setUnverifiedEmail(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Resend Firebase verification email
  const handleResendVerification = async () => {
    if (!auth.currentUser) {
      toast.error('Session expired. Please try signing in again.');
      return;
    }
    setIsResendingEmail(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('Verification email sent! 📩', {
        description: `Check your inbox at ${unverifiedEmail}.`,
      });
    } catch (err: any) {
      console.error('Resend email error:', err);
      toast.error(err?.message || 'Failed to resend verification email.');
    } finally {
      setIsResendingEmail(false);
    }
  };

  // Google Authentication Handler
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const idToken = await firebaseUser.getIdToken();

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          firebaseUid: firebaseUser.uid,
          idToken,
          photoURL: firebaseUser.photoURL,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        await signOut(auth).catch(() => {});
        toast.error(data.error || 'Google authentication failed');
        setIsSubmitting(false);
        return;
      }

      if (data.isNewUser) {
        // Prompt role selection modal for new Google user (Student vs Tutor only)
        setPendingGoogleUser({
          email: data.email,
          name: data.name,
          firebaseUid: data.firebaseUid,
          photoURL: data.photoURL,
        });
        setIsSubmitting(false);
        return;
      }

      // Existing Google user — login complete
      login(data.user);
      toast.success(`Welcome back, ${data.user.name}! 🎉`, {
        description: `Signed in via Google as ${data.user.role.toUpperCase()}.`,
      });

      if (data.user.role === 'admin') router.push('/admin');
      else if (data.user.role === 'tutor') router.push('/tutor');
      else router.push('/student');
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        toast.error('Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete Google Registration for New User
  const handleCompleteGoogleRegistration = async () => {
    if (!pendingGoogleUser) return;
    setIsSubmitting(true);

    try {
      const currentFirebaseUser = auth.currentUser;
      if (!currentFirebaseUser || currentFirebaseUser.uid !== pendingGoogleUser.firebaseUid) {
        throw new Error('The signed-in Google account changed. Please try again.');
      }
      const idToken = await currentFirebaseUser.getIdToken();

      const res = await fetch('/api/auth/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingGoogleUser.email,
          name: pendingGoogleUser.name,
          firebaseUid: pendingGoogleUser.firebaseUid,
          idToken,
          photoURL: pendingGoogleUser.photoURL,
          role: googleRole,
          targetExam: formData.targetExam,
          qualifications: formData.qualifications,
          hourlyRate: formData.hourlyRate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Registration failed');
        setIsSubmitting(false);
        return;
      }

      setPendingGoogleUser(null);
      login(data.user);
      toast.success(`Account created with Google! 🎉`, {
        description: `Welcome to Pikkoza ${data.user.role.toUpperCase()} Portal!`,
      });

      if (data.user.role === 'tutor') router.push('/tutor');
      else router.push('/student');
    } catch (err) {
      console.error('Complete Google registration error:', err);
      toast.error('Error completing account creation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Handler for Email/Password Sign-In or Sign-Up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    if (mode === 'signin') {
      const result = loginSchema.safeParse({
        email: formData.email,
        password: formData.password,
      });

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Step A: Attempt Firebase Email/Password Sign-In
      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          setUnverifiedEmail(userCredential.user.email);
          setIsSubmitting(false);
          toast.warning('Email verification required before accessing Pikkoza.');
          return;
        }

        const idToken = await userCredential.user.getIdToken();

        // Email is verified — authenticate into Pikkoza PostgreSQL backend
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            firebaseUid: userCredential.user.uid,
            idToken,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          await signOut(auth).catch(() => {});
          toast.error(data.error || 'Authentication failed');
          setIsSubmitting(false);
          return;
        }

        login(data.user);
        toast.success(`Welcome back, ${data.user.name}! 👋`, {
          description: `Logged into Pikkoza as ${data.user.role.toUpperCase()}.`,
        });

        if (data.user.role === 'admin') router.push('/admin');
        else if (data.user.role === 'tutor') router.push('/tutor');
        else router.push('/student');
        return;
      } catch (firebaseErr: any) {
        console.warn('Firebase login attempt failed or legacy account fallback:', firebaseErr?.code || firebaseErr);

        // Fallback: Check PostgreSQL database directly for existing accounts / Admin accounts
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            toast.error(data.error || 'Invalid email address or password');
            setIsSubmitting(false);
            return;
          }

          login(data.user);
          toast.success(`Welcome back, ${data.user.name}! 👋`, {
            description: `Logged into Pikkoza as ${data.user.role.toUpperCase()}.`,
          });

          if (data.user.role === 'admin') router.push('/admin');
          else if (data.user.role === 'tutor') router.push('/tutor');
          else router.push('/student');
        } catch (dbErr) {
          toast.error('Authentication failed. Check your network or credentials.');
          setIsSubmitting(false);
        }
      }

    } else {
      // MODE === 'signup'
      const result = signupSchema.safeParse({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        targetExam: formData.targetExam,
      });

      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Block admin signup
      if (role === 'admin') {
        toast.error('ADMIN accounts cannot be created via public signup');
        setIsSubmitting(false);
        return;
      }

      try {
        // Step 1: Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Step 2: Send verification email
        await sendEmailVerification(userCredential.user);
        const idToken = await userCredential.user.getIdToken();

        // Step 3: Create PostgreSQL user record linked with firebaseUid
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role,
            firebaseUid: userCredential.user.uid,
            idToken,
            targetExam: formData.targetExam,
            qualifications: formData.qualifications,
            hourlyRate: formData.hourlyRate,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || 'Failed to create user record');
          setIsSubmitting(false);
          return;
        }

        // Show verification screen
        setUnverifiedEmail(formData.email);
        toast.success('Account created! Please verify your email 📩', {
          description: 'A verification link has been sent to your email address.',
        });
      } catch (err: any) {
        console.error('Signup error:', err);
        if (err?.code === 'auth/email-already-in-use') {
          toast.error('An account with this email address already exists.');
        } else {
          toast.error(err?.message || 'Failed to create account.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* LEFT SIDE Branding */}
      <div className="relative w-full lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 p-6 lg:p-12 flex flex-col justify-between overflow-hidden min-h-[380px] lg:min-h-screen text-white">
        
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PikkozaLogo size="md" />
            <div>
              <span className="text-xl font-black tracking-tight text-white">Pikk<span className="text-indigo-400">oza</span></span>
              <span className="block text-[10px] uppercase font-bold tracking-widest text-indigo-300/80">Doubt aaye hazaar, Pikkoza hai taiyaar.</span>
            </div>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggle className="bg-white/10 hover:bg-white/20 text-white" />
          </div>
        </div>

        <div className="relative z-10 my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PikkozaLogo variant="login" className="mb-6" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Enterprise Security &amp; Verified Accounts</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
              {role === 'admin' ? (
                <>Platform Governance &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-300">Live Analytics</span>.</>
              ) : role === 'student' ? (
                <>Clear your doubts in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-300">60 seconds</span>.</>
              ) : (
                <>Teach top aspirants &amp; earn <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-200 to-violet-300">on your terms</span>.</>
              )}
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg mb-8">
              Secured with multi-factor authentication, verified user accounts, single sign-on, and encrypted cloud storage.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Instant Authentication</h4>
                  <p className="text-xs text-slate-400">Verified Email &amp; Google Sign-In</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-white">Cloud Data Sync</h4>
                  <p className="text-xs text-slate-400">Encrypted Session Security</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 pt-4 flex items-center justify-between text-xs text-slate-400 border-t border-white/10">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span>Made with ❤️ in India</span>
            <span className="text-base">🇮🇳</span>
          </div>
          <span>© 2026 Pikkoza Inc.</span>
        </div>
      </div>

      {/* RIGHT SIDE Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 bg-slate-50 dark:bg-slate-950">
        
        <div className="hidden lg:flex justify-end">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full mx-auto my-auto py-6">
          
          {/* EMAIL VERIFICATION REQUIRED SCREEN */}
          {unverifiedEmail ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-md text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Verify Your Email Address</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  We sent a verification link to <span className="font-bold text-slate-900 dark:text-white">{unverifiedEmail}</span>.
                </p>
                <p className="text-xs text-slate-400">
                  Please click the link in your email to verify your account, then click Sign In below.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResendingEmail}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                >
                  {isResendingEmail ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Resend Verification Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUnverifiedEmail(null);
                    setMode('signin');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Role Selector Tabs */}
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/40 flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    role === 'student'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('tutor')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    role === 'tutor'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  👨‍🏫 Tutor
                </button>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRole('admin');
                      setFormData((prev) => ({ ...prev, email: 'admin@pikkoza.in' }));
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                      role === 'admin'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-indigo-600 dark:text-indigo-400'
                    }`}
                  >
                    🛡️ Admin
                  </button>
                )}
              </div>

              <div className="text-center sm:text-left mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {mode === 'signin'
                    ? `Sign In (${role.toUpperCase()})`
                    : `Create ${role.toUpperCase()} Account`}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Secure Authentication &amp; Real-time Cloud Sync.
                </p>
              </div>

              {/* Mode Switch */}
              <div className="p-1 bg-slate-200/70 dark:bg-slate-900 rounded-2xl flex items-center mb-6">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signin'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === 'signup'
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full mb-6 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-bold text-xs text-slate-900 dark:text-white transition-all flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-50 dark:bg-slate-950 px-2 text-slate-400 font-semibold">
                    Or with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={role === 'admin' ? 'admin@pikkoza.in' : 'student@pikkoza.in'}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? `Sign In (${role})` : `Create ${role} Account`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>

        <div className="pt-4 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-900">
          Doubt aaye hazaar, Pikkoza hai taiyaar. 🇮🇳
        </div>
      </div>

      {/* NEW GOOGLE USER ROLE SELECTION MODAL */}
      {pendingGoogleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto text-xl font-bold">
                🎓
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Complete Google Account</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Welcome <span className="font-bold text-indigo-600 dark:text-indigo-400">{pendingGoogleUser.name}</span>! Select your account type to proceed.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Select Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGoogleRole('student')}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    googleRole === 'student'
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-2xl">🎓</span>
                  <span className="text-xs">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGoogleRole('tutor')}
                  className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                    googleRole === 'tutor'
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-2xl">👨‍🏫</span>
                  <span className="text-xs">Tutor</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setPendingGoogleUser(null)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteGoogleRegistration}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20"
              >
                {isSubmitting ? 'Registering...' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
