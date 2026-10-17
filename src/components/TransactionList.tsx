'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  Calendar, 
  CreditCard, 
  FileText,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { ExpenseItem, ExpenseFilter } from '@/types/expense';
import { CATEGORIES, formatCurrency } from '@/lib/currencies';

interface TransactionListProps {
  expenses: ExpenseItem[];
  currency: string;
  onEdit: (item: ExpenseItem) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  expenses,
  currency,
  onEdit,
  onDelete,
  onAddClick,
}) => {
  const [filter, setFilter] = useState<ExpenseFilter>({
    type: 'all',
    category: 'all',
    search: '',
    sortBy: 'date-desc',
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter & Sort logic
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        // Type filter
        if (filter.type !== 'all' && item.type !== filter.type) return false;
        
        // Category filter
        if (filter.category !== 'all' && item.category !== filter.category) return false;
        
        // Search filter
        if (filter.search.trim()) {
          const q = filter.search.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          const matchMethod = item.payment_method?.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchCat && !matchMethod && !matchNotes) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filter.sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (filter.sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (filter.sortBy === 'amount-desc') {
          return Number(b.amount) - Number(a.amount);
        }
        if (filter.sortBy === 'amount-asc') {
          return Number(a.amount) - Number(b.amount);
        }
        return 0;
      });
  }, [expenses, filter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) return;
    const headers = ['ID', 'Date', 'Type', 'Title', 'Category', 'Amount', 'Payment Method', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      e.id,
      e.date,
      e.type,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      `"${e.payment_method || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendwise-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (filteredExpenses.length === 0) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredExpenses, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `spendwise-data-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Top Bar: Title & Export Actions */}
      <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Transaction History</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredExpenses.length} found
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time synchronized transactions stored securely in Supabase
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download CSV file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Download JSON backup"
          >
            <FileText className="w-3.5 h-3.5 text-teal-400" />
            JSON
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 sm:p-5 bg-slate-950/40 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="w-full bg-slate-900 text-xs sm:text-sm text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center bg-slate-900 rounded-xl border border-slate-700/80 p-0.5 text-xs font-medium">
          {(['all', 'expense', 'income'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter({ ...filter, type: t })}
              className={`flex-1 py-1.5 rounded-lg capitalize transition-colors ${
                filter.type === t
                  ? t === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : t === 'expense'
                    ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30'
                    : 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="w-full bg-slate-900 text-xs sm:text-sm text-slate-300 px-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <select
            value={filter.sortBy}
            onChange={(e) => setFilter({ ...filter, sortBy: e.target.value as any })}
            className="w-full bg-slate-900 text-xs sm:text-sm text-slate-300 px-3 py-2 rounded-xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="date-desc">Latest Date First</option>
            <option value="date-asc">Oldest Date First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>
        </div>

      </div>

      {/* Transactions List */}
      <div className="divide-y divide-slate-800/80 max-h-[560px] overflow-y-auto">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((item) => {
            const catMeta = CATEGORIES.find((c) => c.name === item.category);
            const isIncome = item.type === 'income';

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors group"
              >
                {/* Left Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-white/5"
                    style={{ backgroundColor: catMeta?.bgLight || 'rgba(100, 116, 139, 0.12)' }}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      <span
                        className="font-medium px-2 py-0.5 rounded-full text-[11px]"
                        style={{
                          backgroundColor: catMeta?.bgLight || 'rgba(100, 116, 139, 0.15)',
                          color: catMeta?.color || '#94a3b8',
                        }}
                      >
                        {item.category}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {item.payment_method && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <CreditCard className="w-3 h-3" />
                          {item.payment_method}
                        </span>
                      )}
                      {item.notes && (
                        <span className="text-slate-400 italic text-[11px] truncate max-w-[140px]">
                          &ldquo;{item.notes}&rdquo;
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/50">
                  <div className="text-right">
                    <div
                      className={`text-base sm:text-lg font-extrabold tracking-tight ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {formatCurrency(item.amount, currency)}
                    </div>
                  </div>

                  {/* Edit / Delete actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(item)}
                      title="Edit transaction"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 p-1 rounded-lg">
                        <span className="text-[10px] text-rose-300 font-semibold px-1">Sure?</span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[11px] text-slate-400 hover:text-white px-1"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        title="Delete transaction"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white">No transactions found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No expenses or income entries matched your filter. Try clearing your search query or add a new transaction!
            </p>
            <button
              onClick={onAddClick}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all"
            >
              Add First Transaction
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
