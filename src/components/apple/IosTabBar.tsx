'use client';

import React from 'react';
import { 
  BookOpen, 
  BarChart2, 
  Plus, 
  LayoutGrid, 
  Settings 
} from 'lucide-react';

export type IosTab = 'history' | 'insights' | 'add' | 'budgets' | 'settings';

interface IosTabBarProps {
  currentTab: IosTab;
  onTabChange: (tab: IosTab) => void;
  onQuickAdd: () => void;
  theme?: 'dark' | 'light';
}

export const IosTabBar: React.FC<IosTabBarProps> = ({
  currentTab,
  onTabChange,
  onQuickAdd,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="w-full flex justify-center py-3 select-none pointer-events-none sticky bottom-0 z-30">
      {/* Floating dock */}
      <nav
        aria-label="iOS Navigation Dock"
        className={`pointer-events-auto flex items-center justify-between gap-1.5 px-4 py-2 rounded-full shadow-2xl transition-all ${
          isDark
            ? 'bg-[#1c1c1e]/85 border border-white/10 text-slate-400 ios-blur shadow-black/80'
            : 'bg-white/85 border border-black/5 text-slate-500 ios-blur shadow-slate-900/15'
        }`}
      >
        
        {/* 1. History / Ledger */}
        <button
          onClick={() => onTabChange('history')}
          className={`p-2.5 rounded-full ios-press transition-colors ${
            currentTab === 'history'
              ? isDark ? 'text-white' : 'text-black'
              : 'hover:text-slate-300'
          }`}
          title="Transactions Ledger"
        >
          <BookOpen className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* 2. Insights / Charts */}
        <button
          onClick={() => onTabChange('insights')}
          className={`p-2.5 rounded-full ios-press transition-colors ${
            currentTab === 'insights'
              ? isDark ? 'text-white' : 'text-black'
              : 'hover:text-slate-300'
          }`}
          title="Insights & Charts"
        >
          <BarChart2 className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* 3. Center Quick Add Button */}
        <button
          onClick={onQuickAdd}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center mx-1 ios-press shadow-md transition-transform ${
            isDark
              ? 'bg-[#2c2c2e] hover:bg-[#3a3a3c] text-white border border-white/10'
              : 'bg-black hover:bg-slate-800 text-white'
          }`}
          title="Blazing Fast Input"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* 4. Budgets */}
        <button
          onClick={() => onTabChange('budgets')}
          className={`p-2.5 rounded-full ios-press transition-colors ${
            currentTab === 'budgets'
              ? isDark ? 'text-white' : 'text-black'
              : 'hover:text-slate-300'
          }`}
          title="Budgets"
        >
          <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* 5. Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`p-2.5 rounded-full ios-press transition-colors ${
            currentTab === 'settings'
              ? isDark ? 'text-white' : 'text-black'
              : 'hover:text-slate-300'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </button>

      </nav>
    </div>
  );
};
