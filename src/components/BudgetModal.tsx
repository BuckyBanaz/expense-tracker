'use client';

import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { CategoryBudget } from '@/types/expense';
import { getAllCategories } from '@/lib/currencies';
import { CategoryIcon } from './apple/CategoryIcon';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: CategoryBudget[];
  onSaveBudget: (budget: CategoryBudget) => Promise<void>;
  currencySymbol: string;
  theme?: 'dark' | 'light';
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgets,
  onSaveBudget,
  currencySymbol = '₹',
  theme = 'light',
}) => {
  const [currentMonth, setCurrentMonth] = useState('');
  const [monthLabel, setMonthLabel] = useState('Current Month');
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    setCurrentMonth(new Date().toISOString().slice(0, 7));
    setMonthLabel(new Date().toLocaleString('default', { month: 'long', year: 'numeric' }));
    const map: Record<string, number> = {};
    budgets.forEach((b) => {
      map[b.category] = b.monthly_limit;
    });
    setLimits(map);
  }, [budgets, isOpen]);

  if (!isOpen) return null;

  const expenseCategories = getAllCategories().filter((c) => c.type === 'expense' || c.type === 'both');

  const handleUpdateLimit = async (categoryName: string) => {
    const val = Number(limits[categoryName]) || 0;
    if (val <= 0) {
      alert('Please enter a limit greater than 0.');
      return;
    }

    setSavingCategory(categoryName);
    try {
      await onSaveBudget({
        category: categoryName,
        monthly_limit: val,
        month: currentMonth,
      });
    } catch (e) {
      console.error('Failed to save budget:', e);
    } finally {
      setSavingCategory(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight font-sans">
                Category Budget Caps
              </h3>
              <p className="text-xs text-slate-400">
                Monthly limits for {monthLabel}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List */}
        <div className="p-4 max-h-[380px] overflow-y-auto space-y-2.5 no-scrollbar">
          {expenseCategories.map((cat) => {
            const currentLimit = limits[cat.name] || '';
            const isSaving = savingCategory === cat.name;

            return (
              <div
                key={cat.name}
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                  isDark 
                    ? 'bg-black/30 border-white/5' 
                    : 'bg-slate-50 border-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon || cat.name} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate">{cat.name}</h4>
                    <span className="text-[10px] text-slate-400 block">Monthly Limit</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="relative w-24">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={currentLimit}
                      onChange={(e) =>
                        setLimits((prev) => ({
                          ...prev,
                          [cat.name]: Number(e.target.value),
                        }))
                      }
                      placeholder="0"
                      className={`w-full text-xs font-bold pl-6 pr-2 py-1.5 rounded-xl border focus:outline-none transition-colors ${
                        isDark 
                          ? 'bg-[#1c1c1e] text-white border-white/10 focus:border-white/30' 
                          : 'bg-white text-black border-slate-200 focus:border-slate-400'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateLimit(cat.name)}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-xs shrink-0"
                  >
                    {isSaving ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Threshold warnings at 80% and 100%
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
