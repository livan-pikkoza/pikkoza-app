'use client';

import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { BookOpen, Plus, Loader2 } from 'lucide-react';

interface DBSubject {
  id: string;
  name: string;
  category: string;
  status: string;
  createdAt: string;
}

const CATEGORIES = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'];

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Physics');

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/admin/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects);
      }
    } catch (error) {
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName.trim(), category: selectedCategory }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubjects((prev) => [data.subject, ...prev]);
        toast.success(`Added "${newSubjectName}" to subjects! 📚`);
        setNewSubjectName('');
      } else {
        toast.error(data.error || 'Failed to add subject');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (subjectId: string, subjectName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch('/api/admin/subjects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, status: newStatus }),
      });
      if (res.ok) {
        setSubjects((prev) =>
          prev.map((s) => (s.id === subjectId ? { ...s, status: newStatus } : s))
        );
        toast.info(`"${subjectName}" is now ${newStatus === 'active' ? 'Enabled' : 'Disabled'}`);
      } else {
        toast.error('Failed to update subject');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <span>Subjects &amp; Curriculum Settings</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Add new subjects, enable topic tags, and organize doubt categories for students.
        </p>
      </div>

      {/* Add New Subject Form */}
      <form onSubmit={handleAdd} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Add New Platform Subject
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            placeholder="e.g. Organic Chemistry, Quantum Physics..."
            required
            className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Subjects Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const isDisabled = sub.status === 'disabled';
            return (
              <div
                key={sub.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between transition-opacity ${
                  isDisabled ? 'opacity-60 border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {sub.category}
                  </span>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                    {sub.name}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle(sub.id, sub.name, sub.status)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                    isDisabled
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                  }`}
                >
                  {isDisabled ? 'Enable' : 'Disable'}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <EmptyState
            icon={BookOpen}
            badgeText="Zero Topics"
            title="No subjects configured"
            description="Add your first subject using the form above to enable doubt categorization."
          />
        </div>
      )}

    </div>
  );
}
