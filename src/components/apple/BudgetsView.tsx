'use client';

import React, { useMemo, useState } from 'react';
import { 
  Plus, 
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { CategoryBudget, ExpenseItem } from '@/types/expense';
import { formatCurrency, getAllCategories } from '@/lib/currencies';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  expenses: ExpenseItem[];
  currency: string;
  onOpenNewBudget: () => void;
  onSaveBudget: (budget: CategoryBudget) => Promise<void>;
  onDeleteBudget: (budget: CategoryBudget) => Promise<void>;
  theme?: 'dark' | 'light';
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  expenses,
  currency,
  onOpenNewBudget,
  onSaveBudget,
  onDeleteBudget,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [editing, setEditing] = useState<CategoryBudget | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const openEditor = (budget: CategoryBudget) => {
    setEditing(budget);
    setEditLimit(String(budget.monthly_limit));
  };

  const handleEditSave = async () => {
    if (!editing) return;
    const val = Number(editLimit);
    if (!val || val <= 0) {
      alert('Please enter a limit greater than 0.');
      return;
    }
    setIsBusy(true);
    try {
      await onSaveBudget({ ...editing, monthly_limit: val });
      setEditing(null);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async (budget: CategoryBudget) => {
    if (!confirm(`Delete the "${budget.category}" budget?`)) return;
    setIsBusy(true);
    try {
      await onDeleteBudget(budget);
      setEditing(null);
    } finally {
      setIsBusy(false);
    }
  };

  // Older data can hold duplicate rows for one category; show only the newest
  const uniqueBudgets = useMemo(() => {
    const byCategory = new Map<string, CategoryBudget>();
    for (const b of budgets) {
      const key = `${b.category.toLowerCase()}|${b.month}`;
      const prev = byCategory.get(key);
      if (!prev || (b.created_at || '') >= (prev.created_at || '')) byCategory.set(key, b);
    }
    return [...byCategory.values()];
  }, [budgets]);

  // Overall spent and total budget
  const { totalBudget, totalSpent, spentPercent, remaining, isOverBudget } = useMemo(() => {
    const sumLimits = uniqueBudgets.reduce((sum, b) => sum + Number(b.monthly_limit || 0), 0);
    
    // Sum expenses for current month
    const sumSpent = expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const percent = sumLimits > 0 ? Math.min(100, Math.round((sumSpent / sumLimits) * 100)) : 0;
    const left = Math.max(0, sumLimits - sumSpent);
    const over = sumLimits > 0 && sumSpent > sumLimits;

    return {
      totalBudget: sumLimits,
      totalSpent: sumSpent,
      spentPercent: percent,
      remaining: left,
      isOverBudget: over,
    };
  }, [uniqueBudgets, expenses]);

  // Only real, saved budgets are shown so every card can be edited or deleted
  const displayCards = useMemo(() => {
    return uniqueBudgets.map((b) => {
      const allCats = getAllCategories();
      const catMeta = allCats.find((c) => c.name.toLowerCase() === b.category.toLowerCase());
      const spent = expenses
        .filter((e) => e.type === 'expense' && e.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const limit = Number(b.monthly_limit) || 1;
      const percent = Math.min(100, Math.round((spent / limit) * 100));
      const left = Math.max(0, limit - spent);
      const over = spent > limit;
      const cardColor = catMeta?.color || '#0ea5e9';

      return {
        budget: b,
        category: b.category,
        icon: (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: cardColor }}
          >
            <CategoryIcon name={catMeta?.icon || b.category} className="w-4 h-4 text-white" />
          </div>
        ),
        spentPercent: percent,
        amountLeft: left,
        overAmount: over ? spent - limit : 0,
        isOver: over,
        limit,
        spent,
        color: cardColor,
      };
    });
  }, [uniqueBudgets, expenses]);

  // Semi-circle gauge calculation (SVG arc from 180 to 360 deg)
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * spentPercent) / 100;
  const gaugeColor = isOverBudget ? '#ef4444' : spentPercent > 75 ? '#f59e0b' : '#10b981';

  return (
    <div className={`w-full pb-24 px-0 select-none transition-colors ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>
      
      {/* 1. Header: "Budgets" + "New Budget" Button */}
      <div className="flex items-center justify-between pt-2 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
            Budgets
          </h1>
          <p className="text-xs text-slate-500 font-medium">Monthly limits & tracker</p>
        </div>

        <button
          onClick={onOpenNewBudget}
          className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full border shadow-xs ios-press transition-colors ${
            isDark 
              ? 'bg-[#1c1c1e] text-slate-200 border-white/10 hover:border-white/20' 
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Budget</span>
        </button>
      </div>

      {/* 2. Apple Semi-Circular Gauge Card */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-[#1c1c1e] border-white/10 text-white shadow-xl' 
          : 'bg-white border-slate-200/80 text-slate-900 shadow-sm'
      }`}>
        
        {/* Top Status Badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Monthly Budget Status
          </span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isOverBudget
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          }`}>
            {isOverBudget ? (
              <>
                <AlertTriangle className="w-3 h-3" />
                <span>Over Budget</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3" />
                <span>On track · {spentPercent}% used</span>
              </>
            )}
          </span>
        </div>

        {/* Semi-Circle Gauge: values sit in the open space under the arc, never on it */}
        <div className="relative w-full max-w-[240px] mx-auto mt-2">
          <svg className="w-full h-auto block" viewBox="0 0 200 108">
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={isDark ? '#2c2c2e' : '#f1f1f4'}
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pointer-events-none">
            <span className={`text-2xl font-extrabold tracking-tight tabular-nums leading-none ${
              isOverBudget ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isOverBudget ? formatCurrency(totalSpent - totalBudget, currency) : formatCurrency(remaining, currency)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-1.5">
              {isOverBudget ? 'Over budget this month' : 'Left to spend this month'}
            </span>
          </div>
        </div>

        {/* Clean Bottom Stats Bar (No text overlapping the arc) */}
        <div className="w-full grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/5 mt-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Total Spent</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
              {formatCurrency(totalSpent, currency)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Monthly Budget</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 block truncate">
              {formatCurrency(totalBudget, currency)}
            </span>
          </div>
        </div>

      </div>

      {/* 3. 2x2 Grid of Apple Category Budget Cards */}
      {displayCards.length === 0 && (
        <button
          onClick={onOpenNewBudget}
          className={`w-full mt-4 p-5 rounded-3xl border border-dashed text-xs font-semibold text-slate-400 ios-press ${
            isDark ? 'border-white/10' : 'border-slate-300'
          }`}
        >
          No budgets yet. Tap to set a monthly limit for a category.
        </button>
      )}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {displayCards.map((card) => (
          <div
            key={card.category}
            onClick={() => openEditor(card.budget)}
            className={`p-3.5 rounded-3xl border flex flex-col justify-between cursor-pointer ios-press transition-all ${
              isDark 
                ? 'bg-[#1c1c1e] border-white/5 hover:border-white/10' 
                : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
            }`}
          >
            {/* Header: Icon + Category Name */}
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="shrink-0">{card.icon}</span>
                <span className="truncate flex-1 min-w-0">{card.category}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); openEditor(card.budget); }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                  title="Edit budget"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(card.budget); }}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-500 shrink-0"
                  title="Delete budget"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Limit: {formatCurrency(card.limit, currency)}
              </p>
            </div>

            {/* Spent info and progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className={card.isOver ? 'text-rose-500' : 'text-emerald-500'}>
                  {card.spentPercent}% SPENT
                </span>
                <span className="text-slate-400">
                  {card.isOver ? 'Exceeded' : 'Left'}
                </span>
              </div>

              <div className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5 font-sans truncate">
                {card.isOver ? `+${formatCurrency(card.overAmount, currency)}` : formatCurrency(card.amountLeft, currency)}
              </div>

              {/* Progress track */}
              <div className="mt-2 w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, card.spentPercent)}%`,
                    backgroundColor: card.isOver ? '#ef4444' : card.color,
                  }}
                />
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Edit / Delete budget sheet */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => !isBusy && setEditing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-3xl border p-5 shadow-2xl ${
              isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold tracking-tight">{editing.category}</h3>
                <p className="text-xs text-slate-400">Edit monthly limit</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
              <input
                type="number"
                min="0"
                step="100"
                inputMode="decimal"
                autoFocus
                value={editLimit}
                onChange={(e) => setEditLimit(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                className={`w-full text-base font-bold pl-7 pr-3 py-2.5 rounded-2xl border focus:outline-none ${
                  isDark ? 'bg-black/30 text-white border-white/10 focus:border-white/30' : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => handleDelete(editing)}
                disabled={isBusy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <button
                onClick={handleEditSave}
                disabled={isBusy}
                className="flex-1 px-4 py-2 rounded-full text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isBusy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
