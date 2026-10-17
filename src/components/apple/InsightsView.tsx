'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  Utensils, 
  Home, 
  Car, 
  Zap, 
  Film, 
  ShoppingBag, 
  HeartPulse, 
  Briefcase, 
  Tag,
  Wallet,
  Building2,
  Coins,
  Receipt,
  Plus,
  CreditCard
} from 'lucide-react';
import { ExpenseItem } from '@/types/expense';
import { getAllCategories, formatCurrency } from '@/lib/currencies';
import { CategoryIcon } from './CategoryIcon';

interface InsightsViewProps {
  expenses: ExpenseItem[];
  currency: string;
  theme?: 'dark' | 'light';
  onTransactionClick?: (item: ExpenseItem) => void;
  onQuickAdd?: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  expenses,
  currency,
  theme = 'light',
  onTransactionClick,
  onQuickAdd,
}) => {
  // Period filter: day | week | month | year (day added as requested!)
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [todayStr, setTodayStr] = useState('');
  const [yesterdayStr, setYesterdayStr] = useState('');
  const isDark = theme === 'dark';

  useEffect(() => {
    const now = new Date();
    setTodayStr(now.toISOString().split('T')[0]);
    setYesterdayStr(new Date(Date.now() - 86400000).toISOString().split('T')[0]);
  }, []);

  // 1. Account Balances: Total, Bank & UPI (Combined as requested!), In Cash
  const balances = useMemo(() => {
    let bankAndUpi = 0;
    let cash = 0;
    let card = 0;
    let totalInc = 0;
    let totalExp = 0;

    expenses.forEach((item) => {
      const amt = Number(item.amount) || 0;
      const isInc = item.type === 'income';
      const method = (item.payment_method || 'Bank / UPI').toLowerCase();

      if (isInc) {
        totalInc += amt;
      } else {
        totalExp += amt;
      }

      if (method.includes('cash')) {
        cash += isInc ? amt : -amt;
      } else if (method.includes('card') || method.includes('credit')) {
        card += isInc ? amt : -amt;
      } else {
        // All Bank, UPI, NetBanking combined into Bank & UPI!
        bankAndUpi += isInc ? amt : -amt;
      }
    });

    return {
      total: totalInc - totalExp,
      bankAndUpi,
      cash,
      card,
      totalIncome: totalInc,
      totalExpense: totalExp,
    };
  }, [expenses]);

  // Filtered period calculations (for day / week / month / year)
  const periodFiltered = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = now.toISOString().slice(0, 7); // YYYY-MM
    const currentYearPrefix = String(now.getFullYear()); // YYYY

    // 7 days ago timestamp
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const filtered = expenses.filter((item) => {
      if (period === 'day') {
        return item.date === todayStr;
      }
      if (period === 'week') {
        return item.date >= sevenDaysAgo;
      }
      if (period === 'month') {
        return item.date.startsWith(currentMonthPrefix);
      }
      if (period === 'year') {
        return item.date.startsWith(currentYearPrefix);
      }
      return true;
    });

    const income = filtered
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const expense = filtered
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      items: filtered,
      income,
      expense,
      periodLabel: 
        period === 'day' 
          ? 'Today' 
          : period === 'week' 
            ? 'This Week' 
            : period === 'month' 
              ? 'This Month' 
              : 'This Year',
    };
  }, [expenses, period, todayStr]);

  // 7-day Apple bar chart data (S M T W T F S)
  const daysBarData = useMemo(() => {
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const buckets = [0, 0, 0, 0, 0, 0, 0];

    expenses.filter((e) => e.type === 'expense').forEach((item) => {
      const d = new Date(item.date);
      const dayIdx = d.getDay();
      if (!isNaN(dayIdx)) {
        buckets[dayIdx] += Number(item.amount) || 0;
      }
    });

    const maxVal = Math.max(...buckets, 1);

    return dayNames.map((name, i) => {
      const val = buckets[i];
      const heightPercent = val > 0 ? Math.max(18, Math.round((val / maxVal) * 100)) : 10;
      return {
        day: name,
        amount: val,
        heightPercent,
        isActive: val > 0,
      };
    });
  }, [expenses]);

  // Category distribution calculation
  const categorySplit = useMemo(() => {
    const catMap: Record<string, number> = {};
    const expenseOnly = periodFiltered.items.filter((e) => e.type === 'expense');

    expenseOnly.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount || 0);
    });

    const total = periodFiltered.expense || 1;
    const allCats = getAllCategories();
    return Object.entries(catMap)
      .map(([name, amount]) => {
        const catMeta = allCats.find((c) => c.name.toLowerCase() === name.toLowerCase());
        const percent = Math.round((amount / total) * 100);
        return {
          name,
          amount,
          percent,
          color: catMeta?.color || '#a855f7',
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [periodFiltered]);

  // Helper for category icon
  const getCategoryIcon = (categoryName: string) => {
    const all = getAllCategories();
    const cat = all.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
    return (
      <div 
        className="w-full h-full rounded-xl flex items-center justify-center text-white shadow-xs"
        style={{ backgroundColor: cat?.color || '#64748b' }}
      >
        <CategoryIcon name={cat?.icon || categoryName} className="w-4 h-4 text-white" />
      </div>
    );
  };

  return (
    <div className={`w-full pb-24 px-4 sm:px-6 select-none transition-colors ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>
      
      {/* 1. Top Header: Title + Period Selector (Day / Week / Month / Year) */}
      <div className="flex items-center justify-between pt-2 pb-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium">Personal Finance Overview</p>
        </div>
        
        {/* Period Dropdown (day, week, month, year) */}
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className={`appearance-none text-xs font-bold px-3.5 py-1.5 pr-7 rounded-full border cursor-pointer focus:outline-none transition-colors ${
              isDark 
                ? 'bg-[#1c1c1e] text-slate-200 border-white/10 hover:border-white/20' 
                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs'
            }`}
          >
            <option value="day">Day (Today)</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* 2. MASTER TOTAL BALANCE CARD (Total Balance at top, then In Bank & UPI + In Cash in 2 clean columns) */}
      <div className={`p-5 rounded-3xl border transition-all ${
        isDark 
          ? 'bg-gradient-to-b from-[#242426] to-[#1c1c1e] border-white/10 text-white shadow-xl' 
          : 'bg-gradient-to-b from-white to-slate-50/80 border-slate-200/90 text-slate-900 shadow-sm'
      }`}>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>Total Balance</span>
          </div>

          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            balances.total >= 0 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}>
            {balances.total >= 0 ? 'Net Positive' : 'Deficit'}
          </span>
        </div>

        {/* Large Total Balance */}
        <div className="mt-2 flex items-baseline">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
            {formatCurrency(balances.total, currency)}
          </span>
        </div>

        {/* 2-Column Breakdown: In Bank & UPI (Combined!) and In Cash */}
        <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-white/10 grid grid-cols-2 gap-2.5">
          {/* Bank & UPI */}
          <div className={`p-3 rounded-2xl border ${
            isDark ? 'bg-black/40 border-white/5' : 'bg-white border-slate-100 shadow-xs'
          }`}>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
              <span>In Bank / UPI</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold mt-1 truncate">
              {formatCurrency(balances.bankAndUpi, currency)}
            </div>
          </div>

          {/* In Cash */}
          <div className={`p-3 rounded-2xl border ${
            isDark ? 'bg-black/40 border-white/5' : 'bg-white border-slate-100 shadow-xs'
          }`}>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Coins className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>In Cash</span>
            </div>
            <div className="text-sm sm:text-base font-extrabold mt-1 truncate">
              {formatCurrency(balances.cash, currency)}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Income & Expenses Badge Pills (Dynamic for selected Day / Week / Month) */}
      <div className="grid grid-cols-2 gap-2.5 mt-3">
        {/* Income Pill */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#34c759]/10 border border-[#34c759]/20 text-[#28a745] dark:text-[#34c759]">
          <div className="w-7 h-7 rounded-full bg-[#34c759]/20 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {periodFiltered.periodLabel} Income
            </div>
            <div className="text-xs sm:text-sm font-extrabold truncate">
              +{formatCurrency(periodFiltered.income, currency)}
            </div>
          </div>
        </div>

        {/* Expenses Pill */}
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#dc3545] dark:text-[#ff453a]">
          <div className="w-7 h-7 rounded-full bg-[#ff3b30]/20 flex items-center justify-center shrink-0">
            <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
              {periodFiltered.periodLabel} Spent
            </div>
            <div className="text-xs sm:text-sm font-extrabold truncate">
              -{formatCurrency(periodFiltered.expense, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Apple Minimalist 7-Day Bar Chart */}
      <div className={`mt-4 p-4 rounded-3xl border ${
        isDark ? 'bg-[#1c1c1e] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
          <span className="uppercase tracking-wider text-[10px]">Weekly Spend Trend</span>
          <span className="text-[11px] text-slate-500 font-semibold">
            {periodFiltered.periodLabel} Overview
          </span>
        </div>

        <div className="relative h-28 flex items-end justify-between px-2 pt-2">
          <div className="absolute top-6 left-0 right-0 border-b border-dashed border-slate-300 dark:border-slate-700/60 z-0" />

          {daysBarData.map((d, index) => (
            <div key={index} className="flex flex-col items-center gap-2 z-10 flex-1">
              <div className="w-full flex justify-center">
                <div
                  className={`w-7 sm:w-8 rounded-lg transition-all duration-500 ${
                    d.isActive
                      ? isDark ? 'bg-[#48484a] hover:bg-[#636366]' : 'bg-black hover:bg-slate-800'
                      : isDark ? 'bg-[#2c2c2e]/40' : 'bg-slate-100'
                  }`}
                  style={{ height: `${d.heightPercent}%`, minHeight: '8px' }}
                />
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Colored Category Segmented Bar */}
      {categorySplit.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
            {categorySplit.map((c) => (
              <div
                key={c.name}
                style={{
                  width: `${Math.max(5, c.percent)}%`,
                  backgroundColor: c.color,
                }}
                className="h-full first:rounded-l-full last:rounded-r-full"
                title={`${c.name}: ${c.percent}%`}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
            {categorySplit.slice(0, 4).map((c) => (
              <div key={c.name} className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                <span className="text-[11px] text-slate-400">{c.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Transactions List */}
      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          <span>{period === 'day' ? "Today's Transactions" : 'Recent Transactions'}</span>
          <span>{periodFiltered.items.length} Shown</span>
        </div>

        {periodFiltered.items.length === 0 ? (
          <div className={`p-8 rounded-3xl border text-center flex flex-col items-center justify-center ${
            isDark ? 'bg-[#1c1c1e] border-white/5' : 'bg-white border-slate-200/80 shadow-xs'
          }`}>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-bold">
              {period === 'day' ? 'No Transactions Today' : 'No Transactions Recorded'}
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              Tap below or the + button to log your first expense or income.
            </p>
            {onQuickAdd && (
              <button
                onClick={onQuickAdd}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Entry</span>
              </button>
            )}
          </div>
        ) : (
          <div className={`rounded-2xl divide-y overflow-hidden border ${
            isDark ? 'bg-[#1c1c1e] divide-white/5 border-white/5' : 'bg-white divide-slate-100 border-slate-200/80 shadow-sm'
          }`}>
            {periodFiltered.items.slice(0, 15).map((item) => {
              const isIncome = item.type === 'income';

              return (
                <div
                  key={item.id}
                  onClick={() => onTransactionClick && onTransactionClick(item)}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-black/5 dark:border-white/5 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate">{item.title}</h4>
                      
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                        {item.payee && (
                          <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                            {isIncome ? `From: ${item.payee}` : `To: ${item.payee}`} &bull;
                          </span>
                        )}
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-white/10 font-semibold text-[10px] text-slate-700 dark:text-slate-300">
                          {item.payment_method || 'Bank / UPI'}
                        </span>
                        <span>&bull;</span>
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`text-sm font-extrabold shrink-0 ${
                    isIncome ? 'text-[#34c759]' : isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isIncome ? '+' : '-'} {formatCurrency(item.amount, currency)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
