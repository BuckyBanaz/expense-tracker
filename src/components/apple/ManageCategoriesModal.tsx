'use client';

import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { CategoryMeta } from '@/types/expense';
import { getCustomCategories } from '@/lib/currencies';
import { deleteCustomCategoryFromDb } from '@/lib/supabaseClient';
import { CategoryIcon } from './CategoryIcon';
import { CreateCategoryModal } from './CreateCategoryModal';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after any create, edit or delete so the app re-reads categories */
  onChanged: () => void;
  theme?: 'dark' | 'light';
}

const TYPE_LABELS: Record<CategoryMeta['type'], string> = {
  expense: 'Expense',
  income: 'Income',
  both: 'Expense & Income',
};

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
  onChanged,
  theme = 'light',
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryMeta | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [error, setError] = useState('');

  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const categories = getCustomCategories();

  const openEditor = (cat: CategoryMeta | null) => {
    setEditing(cat);
    setError('');
    setEditorOpen(true);
  };

  const handleDelete = async (name: string) => {
    setBusyName(name);
    setError('');
    try {
      await deleteCustomCategoryFromDb(name);
      setConfirmDelete(null);
      onChanged();
    } catch {
      setError('Could not delete. Check your connection and try again.');
    } finally {
      setBusyName(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Custom Categories</h3>
            <p className="text-xs text-slate-400">Edit or delete the categories you created</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="px-5 pb-2 text-xs font-semibold text-rose-500">{error}</p>}

        {/* List */}
        <div className="px-5 max-h-[55vh] overflow-y-auto no-scrollbar">
          {categories.length === 0 ? (
            <div className="py-10 flex flex-col items-center text-center">
              <Tags className="w-7 h-7 text-slate-400 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-400">No custom categories yet</p>
            </div>
          ) : (
            <div className={`rounded-2xl border divide-y overflow-hidden ${
              isDark ? 'border-white/5 divide-white/5' : 'border-slate-200/80 divide-slate-100'
            }`}>
              {categories.map((cat) => (
                <div key={cat.name} className="px-3.5 py-3 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}1f`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{cat.name}</p>
                    <p className="text-[11px] text-slate-400">{TYPE_LABELS[cat.type] || cat.type}</p>
                  </div>

                  {confirmDelete === cat.name ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full ${
                          isDark ? 'text-slate-300 bg-white/10' : 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(cat.name)}
                        disabled={busyName === cat.name}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-rose-600 text-white disabled:opacity-50"
                      >
                        {busyName === cat.name ? '…' : 'Delete'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openEditor(cat)}
                        className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        title="Edit category"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(cat.name)}
                        className="p-2 rounded-full text-slate-400 hover:text-rose-500"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-slate-400 mt-2.5 leading-relaxed">
            Deleting a category keeps your past transactions; they just show a plain icon.
            Renaming also updates its transactions and budgets.
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 pt-4">
          <button
            onClick={() => openEditor(null)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-bold bg-black text-white dark:bg-white dark:text-black active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            New Category
          </button>
        </div>
      </div>

      <CreateCategoryModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        editCategory={editing}
        onCategoryCreated={() => onChanged()}
        theme={theme}
      />
    </div>
  );
};
