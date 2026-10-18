'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, Plus } from 'lucide-react';
import { CategoryMeta } from '@/types/expense';
import { AVAILABLE_ICONS, COLOR_PRESETS } from '@/lib/currencies';
import { saveCustomCategoryToDb, updateCustomCategoryInDb } from '@/lib/supabaseClient';
import { CategoryIcon } from './CategoryIcon';
import confetti from 'canvas-confetti';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: CategoryMeta) => void;
  /** When set, the modal edits this category instead of creating one */
  editCategory?: CategoryMeta | null;
  theme?: 'dark' | 'light';
}

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
  editCategory = null,
  theme = 'light',
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Utensils');
  const [selectedColor, setSelectedColor] = useState('#f97316');
  const [type, setType] = useState<'expense' | 'income' | 'both'>('expense');
  const [error, setError] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const isDark = theme === 'dark';
  const isEditing = Boolean(editCategory);

  useEffect(() => {
    if (!isOpen) return;
    setName(editCategory?.name ?? '');
    setSelectedIcon(editCategory?.icon ?? 'Utensils');
    setSelectedColor(editCategory?.color ?? '#f97316');
    setType(editCategory?.type ?? 'expense');
    setError('');
  }, [isOpen, editCategory]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }
    if (name.trim().length > 50) {
      setError('Name must be 50 characters or fewer');
      return;
    }

    const newCat: CategoryMeta = {
      name: name.trim(),
      color: selectedColor,
      bgLight: `${selectedColor}1f`,
      icon: selectedIcon,
      type,
    };

    setIsSaving(true);
    try {
      if (editCategory) await updateCustomCategoryInDb(editCategory.name, newCat);
      else await saveCustomCategoryToDb(newCat);
    } catch {
      setError('Could not save to the cloud. Check your connection and try again.');
      return;
    } finally {
      setIsSaving(false);
    }
    setError('');
    onCategoryCreated(newCat);

    if (!isEditing) try {
      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl relative transition-all ${
        isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: selectedColor }}
            >
              <CategoryIcon name={selectedIcon} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm font-sans">{isEditing ? 'Edit Category' : 'New Custom Category'}</h3>
              <p className="text-[10px] text-slate-400">Pick an icon and color</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-3">
          {error && (
            <p className="text-xs text-rose-500 font-semibold">{error}</p>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Category Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Chai & Snacks, Gym, Petrol"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-black text-white border-white/10 focus:border-white/30' 
                  : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
              }`}
            />
          </div>

          {/* Type Toggle: Expense / Income */}
          <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl ${
            isDark ? 'bg-black' : 'bg-slate-100'
          }`}>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? isDark ? 'bg-[#2c2c2e] text-white shadow' : 'bg-white text-black shadow-xs'
                  : 'text-slate-400'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? isDark ? 'bg-[#2c2c2e] text-white shadow' : 'bg-white text-black shadow-xs'
                  : 'text-slate-400'
              }`}
            >
              Income
            </button>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Choose Color
            </label>
            <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 no-scrollbar">
              {COLOR_PRESETS.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-7 h-7 rounded-full shrink-0 transition-all flex items-center justify-center ${
                      isSelected
                        ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white dark:ring-offset-[#1c1c1e] shadow-sm'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Selector Grid (Scrollable library of 30+ icons) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Select Icon ({AVAILABLE_ICONS.length} available)
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 border rounded-xl border-slate-100 dark:border-white/5 no-scrollbar">
              {AVAILABLE_ICONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setSelectedIcon(item.name)}
                  title={item.label}
                  className={`h-9 rounded-xl flex items-center justify-center transition-all ${
                    selectedIcon === item.name
                      ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm scale-105'
                      : isDark ? 'bg-[#2c2c2e]/60 text-slate-300 hover:bg-[#2c2c2e]' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <CategoryIcon name={item.name} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-black dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Category'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
