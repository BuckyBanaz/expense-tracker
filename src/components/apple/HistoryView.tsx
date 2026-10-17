'use client';

import React, { useState, useMemo } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Calendar, CreditCard, Receipt } from 'lucide-react';
import { ExpenseItem } from '@/types/expense';
import { formatCurrency } from '@/lib/currencies';
import { TransactionRow, formatDayLabel } from './TransactionRow';

interface HistoryViewProps {
  expenses: ExpenseItem[];
  currency: string;
  theme?: 'dark' | 'light';
  onDelete: (id: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  expenses,
  currency,
  theme = 'light',
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const isDark = theme === 'dark';

  const filtered = useMemo(() => {
    const list = expenses.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (methodFilter !== 'all') {
        const itemPm = item.payment_method || 'Bank / UPI';
        if (methodFilter === 'Bank / UPI') {
          if (itemPm !== 'Bank / UPI' && itemPm !== 'Bank' && itemPm !== 'UPI') return false;
        } else if (itemPm !== methodFilter) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.payee && item.payee.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          (item.payment_method && item.payment_method.toLowerCase().includes(q))
        );
      }
      return true;
    });

    // Always sort recent (newest) first!
    return list.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (tA && tB && tA !== tB) {
        return tB - tA;
      }
      if (tA || tB) return tB - tA;
      return 0;
    });
  }, [expenses, filterType, methodFilter, search]);

  // Consecutive runs of the same date (list is already sorted newest first)
  const groupedByDay = useMemo(() => {
    const groups: [string, ExpenseItem[]][] = [];
    for (const item of filtered) {
      const last = groups[groups.length - 1];
      if (last && last[0] === item.date) last[1].push(item);
      else groups.push([item.date, [item]]);
    }
    return groups;
  }, [filtered]);

  return (
    <div className={`w-full pb-28 px-0 select-none transition-colors ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>
      
      {/* Header */}
      <div className="pt-2 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
            Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium">All recorded transactions</p>
        </div>
        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
          {filtered.length} entries
        </span>
      </div>

      {/* Apple Search Field */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, payee, category, notes..."
          className={`w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl border focus:outline-none transition-colors ${
            isDark 
              ? 'bg-[#1c1c1e] text-white border-white/5 focus:border-white/20' 
              : 'bg-white text-black border-slate-200 focus:border-slate-400 shadow-xs'
          }`}
        />
      </div>

      {/* Filter Segmented Control: All | Expense | Income */}
      <div className={`flex items-center p-1 rounded-xl mb-3 ${
        isDark ? 'bg-[#1c1c1e]' : 'bg-slate-200/60'
      }`}>
        {(['all', 'expense', 'income'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
              filterType === t
                ? isDark 
                  ? 'bg-[#2c2c2e] text-white shadow' 
                  : 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Payment Method Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[11px]">
        {['all', 'Bank / UPI', 'Cash', 'Credit Card'].map((pm) => (
          <button
            key={pm}
            onClick={() => setMethodFilter(pm)}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              methodFilter === pm
                ? isDark ? 'bg-white text-black' : 'bg-black text-white'
                : isDark ? 'bg-[#1c1c1e] text-slate-400 border border-white/5' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {pm === 'all' ? 'All Methods' : pm}
          </button>
        ))}
      </div>

      {/* List, grouped by day */}
      {filtered.length > 0 ? (
        <div className="space-y-5">
          {groupedByDay.map(([date, items]) => {
            const net = items.reduce(
              (sum, e) => sum + (e.type === 'income' ? 1 : -1) * Number(e.amount || 0),
              0
            );
            return (
              <section key={date}>
                <div className="flex items-baseline justify-between px-1 mb-1.5">
                  <h3 className={`text-[13px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {formatDayLabel(date)}
                  </h3>
                  <span className="text-xs font-medium tabular-nums text-slate-400">
                    {net >= 0 ? '+' : '−'}{formatCurrency(Math.abs(net), currency)}
                  </span>
                </div>
                <div className={`rounded-2xl divide-y overflow-hidden border ${
                  isDark ? 'bg-[#1c1c1e] divide-white/5 border-white/5' : 'bg-white divide-slate-100 border-slate-200/80 shadow-sm'
                }`}>
                  {items.map((item) => (
                    <TransactionRow
                      key={item.id}
                      item={item}
                      currency={currency}
                      isDark={isDark}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-2xl border py-12 text-center flex flex-col items-center justify-center ${
          isDark ? 'bg-[#1c1c1e] border-white/5' : 'bg-white border-slate-200/80 shadow-sm'
        }`}>
          <Receipt className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
          <span className="text-xs font-semibold text-slate-400">No transactions recorded yet</span>
        </div>
      )}

    </div>
  );
};
