'use client';

import React, { useState } from 'react';
import { 
  ChevronRight, 
  Calendar, 
  Bell, 
  Lock, 
  Wallet, 
  Coins, 
  Cloud, 
  Download, 
  Trash2, 
  Moon,
  Sun,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  user: User | null;
  onOpenSupabaseConfig: () => void;
  onOpenAuth: () => void;
  isSupabaseConnected: boolean;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onResetData: () => void;
  onOpenChangePin: () => void;
  onLockApp: () => void;
  onOpenCreateCategory?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onToggleTheme,
  currency,
  user,
  onOpenSupabaseConfig,
  onOpenAuth,
  isSupabaseConnected,
  onExportCSV,
  onResetData,
  onOpenChangePin,
  onLockApp,
  onOpenCreateCategory,
}) => {
  const [incomeTracking, setIncomeTracking] = useState(true);
  const [displayCents, setDisplayCents] = useState(false);

  const isDark = theme === 'dark';

  return (
    <div className={`w-full pb-28 px-0 select-none transition-colors ${
      isDark ? 'text-white' : 'text-slate-900'
    }`}>
      
      {/* 1. Header: "Settings" */}
      <div className="pt-2 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
          Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium">Personal preferences & security</p>
      </div>

      {/* Security & PIN Section */}
      <div className="mb-6">
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider ml-3 mb-1.5 block">
          SECURITY &amp; ACCESS
        </span>

        <div className={`rounded-2xl divide-y overflow-hidden border ${
          isDark ? 'bg-[#1c1c1e] divide-white/5 border-white/5' : 'bg-white divide-slate-100 border-slate-200/80 shadow-xs'
        }`}>
          
          {/* Change PIN */}
          <div 
            onClick={onOpenChangePin}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold block leading-tight">Change App PIN</span>
                <span className="text-[11px] text-slate-400">Update your 4-digit passcode</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>Edit</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Lock App Now */}
          <div 
            onClick={onLockApp}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold block leading-tight">Lock App Now</span>
                <span className="text-[11px] text-slate-400">Return to PIN lock screen</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

        </div>
      </div>

      {/* GENERAL PREFERENCES */}
      <div className="mb-6">
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider ml-3 mb-1.5 block">
          PREFERENCES
        </span>

        <div className={`rounded-2xl divide-y overflow-hidden border ${
          isDark ? 'bg-[#1c1c1e] divide-white/5 border-white/5' : 'bg-white divide-slate-100 border-slate-200/80 shadow-xs'
        }`}>
          
          {/* Appearance (Theme) */}
          <div 
            onClick={onToggleTheme}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </div>
              <span className="text-sm font-semibold">Appearance Theme</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* Currency (Locked to INR) */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm flex items-center justify-center">
                ₹
              </div>
              <span className="text-sm font-semibold">Currency</span>
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Indian Rupee (₹ INR)
            </div>
          </div>

          {/* Income Tracking Toggle */}
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Income Tracking</span>
            </div>
            <div
              onClick={() => setIncomeTracking(!incomeTracking)}
              className={`ios-switch ${incomeTracking ? 'active' : ''}`}
            >
              <div className="ios-switch-thumb" />
            </div>
          </div>

          {/* Custom Categories Creator */}
          {onOpenCreateCategory && (
            <div 
              onClick={onOpenCreateCategory}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold block leading-tight">Custom Categories</span>
                  <span className="text-[11px] text-slate-400">Add categories with icons & colors</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          )}

        </div>
      </div>

      {/* DATABASE & BACKUP */}
      <div>
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider ml-3 mb-1.5 block">
          DATABASE &amp; DATA
        </span>

        <div className={`rounded-2xl divide-y overflow-hidden border ${
          isDark ? 'bg-[#1c1c1e] divide-white/5 border-white/5' : 'bg-white divide-slate-100 border-slate-200/80 shadow-xs'
        }`}>
          
          {/* Supabase Status */}
          <div 
            onClick={onOpenSupabaseConfig}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-semibold block leading-tight">Supabase Database</span>
                <span className="text-[11px] text-slate-400">PostgreSQL cloud storage</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className={isSupabaseConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}>
                {isSupabaseConnected ? 'Connected' : 'Local Clean'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Export Data */}
          <div 
            onClick={onExportCSV}
            className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Export Transactions (CSV)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Clean / Wipe Data */}
          <div 
            onClick={onResetData}
            className="p-3.5 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-rose-500 block leading-tight">Wipe All Local Data</span>
                <span className="text-[11px] text-slate-400">Clear storage to fresh zero state</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </div>

        </div>
      </div>

    </div>
  );
};
