'use client';

import React, { useState, useMemo } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Trash2, Calendar, CreditCard, Receipt } from 'lucide-react';
import { ExpenseItem } from '@/types/expense';
import { getAllCategories, formatCurrency } from '@/lib/currencies';
import { CategoryIcon } from './CategoryIcon';

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

      {/* List */}
      <div className={`rounded-2xl divide-y overflow-hidden border ${
        isDark ? 'bg-[#1c1c1e] divide-white/5 border-white/5' : 'bg-white divide-slate-100 border-slate-200/80 shadow-sm'
      }`}>
        {filtered.length > 0 ? (
          filtered.map((item) => {
            const isIncome = item.type === 'income';
            const allCats = getAllCategories();
            const catMeta = allCats.find((c) => c.name.toLowerCase() === item.category.toLowerCase());

            return (
              <div
                key={item.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs"
                    style={{ backgroundColor: catMeta?.color || (isIncome ? '#34c759' : '#64748b') }}
                  >
                    <CategoryIcon name={catMeta?.icon || item.category} className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold truncate">{item.title}</h4>
                    
                    {/* Payee + Method + Category + Date */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 truncate">
                      {item.payee && (
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                          {isIncome ? `From: ${item.payee}` : `To: ${item.payee}`} &bull;
                        </span>
                      )}
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/10 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        {item.payment_method || 'UPI'}
                      </span>
                      <span>&bull;</span>
                      <span>{item.category}</span>
                      <span>&bull;</span>
                      <span>{item.date}</span>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                        &quot;{item.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`text-sm font-extrabold ${
                    isIncome ? 'text-[#34c759]' : isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {isIncome ? '+' : '-'} {formatCurrency(item.amount, currency)}
                  </span>

                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          onDelete(item.id);
                          setConfirmDeleteId(null);
                        }}
                        className="text-[10px] bg-red-600 text-white font-bold px-2 py-1 rounded-md"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-[10px] text-slate-400 px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <Receipt className="w-8 h-8 text-slate-400 mb-2 stroke-[1.5]" />
            <span className="text-xs font-semibold text-slate-400">No transactions recorded yet</span>
          </div>
        )}
      </div>

    </div>
  );
};
