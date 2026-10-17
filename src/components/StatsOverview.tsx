'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, PiggyBank, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/currencies';
import { ExpenseItem } from '@/types/expense';

interface StatsOverviewProps {
  expenses: ExpenseItem[];
  currency: string;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ expenses, currency }) => {
  const totalIncome = expenses
    .filter((e) => e.type === 'income')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalExpense = expenses
    .filter((e) => e.type === 'expense')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const balance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)) : 0;

  const incomeCount = expenses.filter((e) => e.type === 'income').length;
  const expenseCount = expenses.filter((e) => e.type === 'expense').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      
      {/* 1. Net Balance Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 border border-slate-800 shadow-xl shadow-slate-950/50 group hover:border-slate-700 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Balance
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatCurrency(balance, currency)}
          </h3>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${
              balance >= 0 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {balance >= 0 ? '+' : ''}{totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0}% net
            </span>
            <span className="text-slate-500">of total cash flow</span>
          </div>
        </div>
      </div>

      {/* 2. Total Income Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 border border-slate-800 shadow-xl shadow-slate-950/50 group hover:border-emerald-800/40 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Income
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-400">
            {formatCurrency(totalIncome, currency)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Across <span className="text-slate-200 font-semibold">{incomeCount}</span> income credit{incomeCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* 3. Total Expenses Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 border border-slate-800 shadow-xl shadow-slate-950/50 group hover:border-rose-800/40 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Expenses
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-400">
            {formatCurrency(totalExpense, currency)}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            Logged <span className="text-slate-200 font-semibold">{expenseCount}</span> transaction{expenseCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* 4. Savings Rate Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-5 sm:p-6 border border-slate-800 shadow-xl shadow-slate-950/50 group hover:border-slate-700 transition-all">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Savings Rate
          </span>
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-teal-300">
              {savingsRate}%
            </h3>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              {savingsRate >= 40 ? 'Great' : savingsRate >= 20 ? 'Moderate' : 'Low'}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${
                savingsRate >= 40 ? 'bg-gradient-to-r from-teal-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, savingsRate))}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};
