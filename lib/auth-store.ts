'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'student' | 'tutor' | 'admin';
  status?: 'active' | 'suspended';
  grade?: string;
  stream?: string;
  targetExam?: string;
  interestedSubjects?: string[];
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  bio?: string;
  institute?: string;
  qualifications?: string;
  experienceYears?: number;
  hourlyRate?: number;
  teachingSubjects?: string[];
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  registeredUsers: User[];
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  updateTutorVerification: (tutorId: string, verificationStatus: 'approved' | 'rejected') => Promise<void>;
  verifySession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      registeredUsers: [],

      login: (loggedInUser: User) => {
        set((state) => {
          const exists = state.registeredUsers.some((u) => u.id === loggedInUser.id);
          const updatedUsers = exists
            ? state.registeredUsers.map((u) => (u.id === loggedInUser.id ? loggedInUser : u))
            : [loggedInUser, ...state.registeredUsers];

          return {
            user: loggedInUser,
            isAuthenticated: true,
            registeredUsers: updatedUsers,
          };
        });
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (_) {}
        set({ user: null, isAuthenticated: false });
      },

      updateProfile: async (updatedData: Partial<User>) => {
        set((state) => {
          if (!state.user) return state;
          const updatedUser = { ...state.user, ...updatedData };
          const updatedUsers = state.registeredUsers.map((u) =>
            u.id === updatedUser.id ? updatedUser : u
          );
          return { user: updatedUser, registeredUsers: updatedUsers };
        });

        try {
          await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData),
          });
        } catch (e) {
          console.error('updateProfile API error:', e);
        }
      },

      toggleUserStatus: async (userId: string) => {
        const currentStatus = get().registeredUsers.find((u) => u.id === userId)?.status;
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

        set((state) => ({
          registeredUsers: state.registeredUsers.map((u) =>
            u.id === userId ? { ...u, status: newStatus } : u
          ),
          user:
            state.user?.id === userId
              ? { ...state.user, status: newStatus }
              : state.user,
        }));

        try {
          await fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
        } catch (e) {
          console.error('toggleUserStatus API error:', e);
        }
      },

      updateTutorVerification: async (tutorId: string, verificationStatus: 'approved' | 'rejected') => {
        set((state) => ({
          registeredUsers: state.registeredUsers.map((u) =>
            u.id === tutorId ? { ...u, verificationStatus } : u
          ),
          user:
            state.user?.id === tutorId
              ? { ...state.user, verificationStatus }
              : state.user,
        }));

        try {
          await fetch(`/api/users/${tutorId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verificationStatus }),
          });
        } catch (e) {
          console.error('updateTutorVerification API error:', e);
        }
      },

      verifySession: async () => {
        try {
          const res = await fetch('/api/auth/me');
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              get().login(data.user);
            } else {
              set({ user: null, isAuthenticated: false });
            }
          } else {
            set({ user: null, isAuthenticated: false });
          }
        } catch (_) {
          // Keep local state if network error
        }
      },
    }),
    {
      name: 'doubtsolve_user_session',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;
        const removeLegacyToken = (user: User | null | undefined): User | null => {
          if (!user) return null;
          const { token: _legacyToken, ...safeUser } = user as User & { token?: string };
          return safeUser;
        };

        return {
          ...currentState,
          ...persisted,
          user: removeLegacyToken(persisted?.user),
          registeredUsers: (persisted?.registeredUsers || []).map((user) => removeLegacyToken(user)!),
        };
      },
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
