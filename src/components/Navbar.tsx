'use client';

import React from 'react';
import { 
  Wallet, 
  Database, 
  PlusCircle, 
  PieChart, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { CURRENCIES } from '@/lib/currencies';
import { User } from '@supabase/supabase-js';

interface NavbarProps {
  currency: string;
  onCurrencyChange: (currency: string) => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseModal: () => void;
  onOpenTransactionModal: () => void;
  onOpenBudgetModal: () => void;
  onOpenAuthModal: () => void;
  user: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currency,
  onCurrencyChange,
  isSupabaseConnected,
  onOpenSupabaseModal,
  onOpenTransactionModal,
  onOpenBudgetModal,
  onOpenAuthModal,
  user,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-500 shadow-lg shadow-emerald-500/20 text-white">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  SpendWise
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Supabase
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Smart Expense & Budget Tracker
              </p>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSupabaseModal}
              title="Click to configure Supabase backend"
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full border transition-all ${
                isSupabaseConnected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/60 shadow-sm shadow-emerald-900/40'
                  : 'bg-amber-950/50 text-amber-300 border-amber-700/50 hover:bg-amber-900/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {isSupabaseConnected ? 'Supabase Live' : 'Demo Mode'}
              </span>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSupabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </span>
            </button>

            {/* Currency Selector */}
            <select
              aria-label="Currency Selector"
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="bg-slate-900 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 rounded-lg px-2 sm:px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 hover:border-slate-600 transition-colors"
            >
              {Object.values(CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>

            {/* Budget Button */}
            <button
              onClick={onOpenBudgetModal}
              className="hidden lg:flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
            >
              <PieChart className="w-4 h-4 text-indigo-400" />
              Budgets
            </button>

            {/* User Auth Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
              title={user ? `Signed in as ${user.email}` : 'Sign In with Supabase'}
            >
              <UserIcon className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline max-w-[120px] truncate">
                {user ? user.email?.split('@')[0] : 'Sign In'}
              </span>
            </button>

            {/* Add Transaction CTA */}
            <button
              onClick={onOpenTransactionModal}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add <span className="hidden sm:inline">Transaction</span></span>
            </button>
            
          </div>

        </div>
      </div>
    </header>
  );
};
