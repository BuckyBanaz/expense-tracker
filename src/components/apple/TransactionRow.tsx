'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ExpenseItem } from '@/types/expense';
import { getAllCategories, formatCurrency } from '@/lib/currencies';
import { CategoryIcon } from './CategoryIcon';

const GENERIC_TITLES = ['income', 'expense'];

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// "Today", "Yesterday", "Fri, 16 Oct" (year added when not the current year)
export function formatDayLabel(date: string): string {
  const now = new Date();
  if (date === toLocalDateStr(now)) return 'Today';
  if (date === toLocalDateStr(new Date(now.getTime() - 86400000))) return 'Yesterday';
  const d = new Date(`${date}T00:00:00`);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

function formatTime(createdAt?: string): string {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }).toUpperCase();
}

// Titles like "Income" say nothing; prefer the payee or category instead
function getDisplayTitle(item: ExpenseItem): string {
  const title = (item.title || '').trim();
  if (title && !GENERIC_TITLES.includes(title.toLowerCase())) return title;
  if (item.payee) return item.payee;
  if (item.category && item.category !== 'Other') return item.category;
  return title || (item.type === 'income' ? 'Income' : 'Expense');
}

interface TransactionRowProps {
  item: ExpenseItem;
  currency: string;
  isDark: boolean;
  /** Show the day instead of the time (for lists not grouped by day) */
  showDate?: boolean;
  onClick?: (item: ExpenseItem) => void;
  onDelete?: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  item,
  currency,
  isDark,
  showDate = false,
  onClick,
  onDelete,
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isIncome = item.type === 'income';
  const catMeta = getAllCategories().find((c) => c.name.toLowerCase() === item.category.toLowerCase());
  const color = catMeta?.color || (isIncome ? '#10b981' : '#64748b');
  const title = getDisplayTitle(item);

  const details = [
    item.category !== title ? item.category : null,
    item.payee && item.payee !== title ? `${isIncome ? 'From' : 'To'} ${item.payee}` : null,
    item.payment_method || 'Bank / UPI',
  ].filter(Boolean);

  const when = showDate ? formatDayLabel(item.date) : formatTime(item.created_at);

  return (
    <div
      onClick={() => onClick?.(item)}
      className={`px-4 py-3 flex items-center gap-3 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50/80'}`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        <CategoryIcon name={catMeta?.icon || item.category} className="w-[18px] h-[18px]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-tight truncate">{title}</p>
        <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {details.join(' · ')}
        </p>
        {item.notes && (
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.notes}</p>
        )}
      </div>

      {confirmingDelete ? (
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setConfirmingDelete(false)}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-full ${
              isDark ? 'text-slate-300 bg-white/10' : 'text-slate-600 bg-slate-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setConfirmingDelete(false);
              onDelete?.(item.id);
            }}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-full bg-rose-600 text-white"
          >
            Delete
          </button>
        </div>
      ) : (
        <>
          <div className="text-right shrink-0">
            <p className={`text-[15px] font-semibold tabular-nums leading-tight ${
              isIncome ? 'text-emerald-600 dark:text-emerald-400' : isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {isIncome ? '+' : '−'}{formatCurrency(item.amount, currency)}
            </p>
            {when && <p className="text-[11px] text-slate-400 mt-0.5">{when}</p>}
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmingDelete(true);
              }}
              className={`p-1.5 -mr-1.5 rounded-full shrink-0 transition-colors ${
                isDark ? 'text-slate-600 hover:text-rose-400' : 'text-slate-300 hover:text-rose-500'
              }`}
              title="Delete entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
};
