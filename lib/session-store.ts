'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

export interface Tutor {
  id: string;
  name: string;
  title: string;
  institute: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  subjects: string[];
  avatar?: string;
  bio: string;
  availableNow: boolean;
}

export interface Session {
  id: string;
  studentId: string;
  studentName?: string;
  tutorId: string;
  tutorName: string;
  tutorTitle: string;
  subject: string;
  date: string;
  time: string;
  durationMinutes: number;
  price: number;
  status: 'requested' | 'upcoming' | 'completed' | 'cancelled' | 'rejected';
  rating?: number;
  reviewText?: string;
  notes?: string;
  resources?: string;
  createdAt: string;
}

interface SessionState {
  sessions: Session[];
  isLoading: boolean;
  fetchSessions: () => Promise<void>;
  addSession: (sessionData: Omit<Session, 'id' | 'createdAt'> & { tutorId: string; subject: string; date: string; time: string; sessionId?: string }) => Promise<Session | null>;
  acceptSession: (sessionId: string) => Promise<void>;
  rejectSession: (sessionId: string) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  completeSession: (sessionId: string) => Promise<void>;
  rateSession: (sessionId: string, rating: number, reviewText?: string) => Promise<void>;
  updateSessionDetails: (sessionId: string, notes?: string, resources?: string) => Promise<void>;
}

async function patchSession(sessionId: string, updates: Record<string, unknown>) {
  try {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('Session update failed:', err);
    }
    return res.ok;
  } catch (e) {
    console.error('Session PATCH error:', e);
    return false;
  }
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      isLoading: false,

      fetchSessions: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/sessions');
          if (res.ok) {
            const data = await res.json();
            set({ sessions: data.sessions || [] });
          }
        } catch (e) {
          console.error('fetchSessions error:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      addSession: async (sessionData) => {
        try {
          const res = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData),
          });

          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || 'Failed to request doubt session');
            return null;
          }

          const newSession: Session = data.session;

          set((state) => ({
            sessions: [newSession, ...state.sessions.filter(s => s.id !== newSession.id)],
          }));

          return newSession;
        } catch (e: any) {
          toast.error(e?.message || 'Network error while booking session');
          return null;
        }
      },

      acceptSession: async (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'upcoming' as const } : s
          ),
        }));
        await patchSession(sessionId, { status: 'upcoming' });
      },

      rejectSession: async (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'rejected' as const } : s
          ),
        }));
        await patchSession(sessionId, { status: 'rejected' });
      },

      cancelSession: async (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'cancelled' as const } : s
          ),
        }));
        await patchSession(sessionId, { status: 'cancelled' });
      },

      completeSession: async (sessionId: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, status: 'completed' as const } : s
          ),
        }));
        await patchSession(sessionId, { status: 'completed' });
      },

      rateSession: async (sessionId: string, rating: number, reviewText?: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, rating, reviewText } : s
          ),
        }));
        await patchSession(sessionId, { rating, reviewText });
      },

      updateSessionDetails: async (sessionId: string, notes?: string, resources?: string) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === sessionId ? { ...s, notes, resources } : s
          ),
        }));
        await patchSession(sessionId, { notes, resources });
      },
    }),
    {
      name: 'doubtsolve_sessions_store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
    }
  )
);
