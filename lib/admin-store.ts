import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SubjectItem {
  id: string;
  name: string;
  category: 'Physics' | 'Chemistry' | 'Mathematics' | 'Biology' | 'General';
  status: 'active' | 'disabled';
  createdAt: string;
}

interface AdminState {
  subjects: SubjectItem[];
  platformFeePercentage: number;
  supportEmail: string;
  addSubject: (name: string, category: SubjectItem['category']) => void;
  toggleSubjectStatus: (id: string) => void;
  updateSettings: (fee: number, email: string) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      subjects: [
        { id: 'sub_1', name: 'Physics', category: 'Physics', status: 'active', createdAt: new Date().toISOString() },
        { id: 'sub_2', name: 'Organic Chemistry', category: 'Chemistry', status: 'active', createdAt: new Date().toISOString() },
        { id: 'sub_3', name: 'Calculus & Algebra', category: 'Mathematics', status: 'active', createdAt: new Date().toISOString() },
        { id: 'sub_4', name: 'Botany & Zoology', category: 'Biology', status: 'active', createdAt: new Date().toISOString() },
      ],
      platformFeePercentage: 10,
      supportEmail: 'admin@pikkoza.in',
      addSubject: (name: string, category: SubjectItem['category']) =>
        set((state) => ({
          subjects: [
            ...state.subjects,
            {
              id: `sub_${Date.now()}`,
              name,
              category,
              status: 'active',
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      toggleSubjectStatus: (id: string) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id ? { ...s, status: s.status === 'active' ? 'disabled' : 'active' } : s
          ),
        })),
      updateSettings: (platformFeePercentage: number, supportEmail: string) =>
        set({ platformFeePercentage, supportEmail }),
    }),
    {
      name: 'doubtsolve_admin_store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
