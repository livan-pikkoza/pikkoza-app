'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Tutor } from './session-store';

export interface TimeSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
}

interface TutorState {
  tutorsList: Tutor[];
  isAvailableNow: boolean;
  weeklySlots: TimeSlot[];
  isLoading: boolean;
  fetchTutors: (filters?: { subject?: string; availableNow?: boolean; maxRate?: number; minRating?: number }) => Promise<void>;
  setAvailableNow: (tutorIdOrStatus: string | boolean, status?: boolean) => Promise<void>;
  addTimeSlot: (slot: TimeSlot) => void;
  removeTimeSlot: (index: number) => void;
  saveWeeklySlots: (tutorId: string, slots: TimeSlot[]) => Promise<void>;
  registerOrUpdateTutor: (tutor: Tutor) => void;
}

export const useTutorStore = create<TutorState>()(
  persist(
    (set, get) => ({
      tutorsList: [],
      isAvailableNow: true,
      weeklySlots: [
        { day: 'Monday', startTime: '04:00 PM', endTime: '06:00 PM' },
        { day: 'Wednesday', startTime: '05:00 PM', endTime: '07:00 PM' },
        { day: 'Friday', startTime: '04:00 PM', endTime: '06:00 PM' },
        { day: 'Saturday', startTime: '02:00 PM', endTime: '08:00 PM' },
      ],
      isLoading: false,

      fetchTutors: async (filters) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          if (filters?.subject) params.set('subject', filters.subject);
          if (filters?.availableNow) params.set('availableNow', 'true');
          if (filters?.maxRate) params.set('maxRate', String(filters.maxRate));
          if (filters?.minRating) params.set('minRating', String(filters.minRating));

          const res = await fetch(`/api/tutors?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            set({ tutorsList: data.tutors || [] });
          }
        } catch (e) {
          console.error('fetchTutors error:', e);
        } finally {
          set({ isLoading: false });
        }
      },

      setAvailableNow: async (tutorIdOrStatus: string | boolean, status?: boolean) => {
        const tutorId = typeof tutorIdOrStatus === 'string' ? tutorIdOrStatus : 'me';
        const newStatus = typeof tutorIdOrStatus === 'boolean' ? tutorIdOrStatus : (status ?? true);
        set({ isAvailableNow: newStatus });
        try {
          await fetch(`/api/tutors/${tutorId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isAvailableNow: newStatus }),
          });
        } catch (e) {
          console.error('setAvailableNow error:', e);
        }
      },

      addTimeSlot: (slot: TimeSlot) =>
        set((state) => ({ weeklySlots: [...state.weeklySlots, slot] })),

      removeTimeSlot: (index: number) =>
        set((state) => ({
          weeklySlots: state.weeklySlots.filter((_, i) => i !== index),
        })),

      saveWeeklySlots: async (tutorId: string, slots: TimeSlot[]) => {
        set({ weeklySlots: slots });
        try {
          await fetch(`/api/tutors/${tutorId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weeklySlots: slots }),
          });
        } catch (e) {
          console.error('saveWeeklySlots error:', e);
        }
      },

      registerOrUpdateTutor: (updatedTutor: Tutor) =>
        set((state) => {
          const exists = state.tutorsList.some((t) => t.id === updatedTutor.id);
          if (exists) {
            return {
              tutorsList: state.tutorsList.map((t) =>
                t.id === updatedTutor.id ? updatedTutor : t
              ),
            };
          }
          return { tutorsList: [updatedTutor, ...state.tutorsList] };
        }),
    }),
    {
      name: 'doubtsolve_tutors_store',
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
