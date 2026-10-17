'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Plus, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { CategoryBudget, ExpenseItem } from '@/types/expense';
import { formatCurrency, getAllCategories } from '@/lib/currencies';
import { CategoryIcon } from './CategoryIcon';

interface BudgetsViewProps {
  budgets: CategoryBudget[];
  expenses: ExpenseItem[];
  currency: string;
  onOpenNewBudget: () => void;
  theme?: 'dark' | 'light';
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  expenses,
  currency,
  onOpenNewBudget,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    setCurrentMonth(new Date().toISOString().slice(0, 7));
  }, []);

  // Overall spent and total budget
  const { totalBudget, totalSpent, spentPercent, remaining, isOverBudget } = useMemo(() => {
    const sumLimits = budgets.reduce((sum, b) => sum + Number(b.monthly_limit || 0), 0) || 37000;
    
    // Sum expenses for current month
    const sumSpent = expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const percent = Math.min(100, Math.round((sumSpent / sumLimits) * 100));
    const left = Math.max(0, sumLimits - sumSpent);
    const over = sumSpent > sumLimits;

    return {
      totalBudget: sumLimits,
      totalSpent: sumSpent,
      spentPercent: percent,
      remaining: left,
      isOverBudget: over,
    };
  }, [budgets, expenses]);

  // Map user's actual budgets or fallback
  const displayCards = useMemo(() => {
    const baseBudgets = budgets.length > 0 
      ? budgets 
      : [
          { category: 'Food & Dining', monthly_limit: 8000, month: currentMonth },
          { category: 'Housing', monthly_limit: 16000, month: currentMonth },
          { category: 'Bills & Utilities', monthly_limit: 4000, month: currentMonth },
          { category: 'Transportation', monthly_limit: 3500, month: currentMonth },
          { category: 'Entertainment', monthly_limit: 2500, month: currentMonth },
          { category: 'Health & Fitness', monthly_limit: 3000, month: currentMonth },
        ];

    return baseBudgets.map((b) => {
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
  }, [budgets, expenses, currentMonth]);

  // Semi-circle gauge calculation (SVG arc from 180 to 360 deg)
  const radius = 80;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * spentPercent) / 100;

  return (
    <div className={`w-full pb-24 px-4 sm:px-6 select-none transition-colors ${
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
                <span>On Track ({100 - spentPercent}% remaining)</span>
              </>
            )}
          </span>
        </div>

        {/* Semi-Circle Speedometer */}
        <div className="relative w-full max-w-[260px] mx-auto h-36 flex flex-col items-center justify-end">
          <svg className="w-full h-32 overflow-visible" viewBox="0 0 200 110">
            {/* Background Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={isDark ? '#2c2c2e' : '#f1f1f4'}
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Progress Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={
                isOverBudget 
                  ? '#ef4444' 
                  : spentPercent > 75 
                    ? '#f59e0b' 
                    : '#10b981'
              }
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center values inside arc */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 pointer-events-none">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-sans ${
              isOverBudget ? 'text-rose-500' : isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isOverBudget ? `+${formatCurrency(totalSpent - totalBudget, currency)}` : formatCurrency(remaining, currency)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium mt-0.5">
              {isOverBudget ? 'Exceeded Budget' : 'Remaining this month'}
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
      <div className="grid grid-cols-2 gap-3 mt-4">
        {displayCards.map((card) => (
          <div
            key={card.category}
            onClick={onOpenNewBudget}
            className={`p-3.5 rounded-3xl border flex flex-col justify-between cursor-pointer ios-press transition-all ${
              isDark 
                ? 'bg-[#1c1c1e] border-white/5 hover:border-white/10' 
                : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
            }`}
          >
            {/* Header: Icon + Category Name */}
            <div>
              <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                <span className="shrink-0">{card.icon}</span>
                <span className="truncate">{card.category}</span>
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

    </div>
  );
};
