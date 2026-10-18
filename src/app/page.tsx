'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart2, 
  BookOpen, 
  LayoutGrid, 
  Settings as SettingsIcon, 
  Plus, 
  Database, 
  Moon, 
  Sun,
  Lock,
  Trash2,
} from 'lucide-react';
import { InsightsView } from '@/components/apple/InsightsView';
import { BudgetsView } from '@/components/apple/BudgetsView';
import { SettingsView } from '@/components/apple/SettingsView';
import { HistoryView } from '@/components/apple/HistoryView';
import { FastInputView } from '@/components/apple/FastInputView';
import { PinLockScreen } from '@/components/apple/PinLockScreen';
import { ChangePinModal } from '@/components/apple/ChangePinModal';
import { CreateCategoryModal } from '@/components/apple/CreateCategoryModal';
import { BudgetModal } from '@/components/BudgetModal';
import { SupabaseConfigModal } from '@/components/SupabaseConfigModal';
import { AuthModal } from '@/components/AuthModal';
import { SecureWipeModal } from '@/components/apple/SecureWipeModal';
import { 
  fetchExpensesFromDb, 
  addExpenseToDb, 
  deleteExpenseFromDb, 
  fetchBudgetsFromDb, 
  upsertBudgetInDb,
  deleteBudgetFromDb,
  isSupabaseConfigured,
  getSupabase,
  getActiveSupabaseCredentials,
  getLastSyncError,
  clearAllData,
  fetchAppPinFromDb,
  fetchCustomCategoriesFromDb,
  saveAppPinToDb,
} from '@/lib/supabaseClient';
import { ExpenseItem, CategoryBudget } from '@/types/expense';
import { formatCurrency } from '@/lib/currencies';
import { User } from '@supabase/supabase-js';

type ActiveTab = 'insights' | 'history' | 'budgets' | 'settings';

export default function Home() {
  // Theme state: Light mode default
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  // Default to 'insights' tab (Dashboard)
  const [activeTab, setActiveTab] = useState<ActiveTab>('insights');
  // Fast Input overlay
  const [isFastInputOpen, setIsFastInputOpen] = useState(false);

  // Security / PIN lock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  // null until the PIN has been read from the cloud
  const [savedPin, setSavedPin] = useState<string | null>(null);
  const [pinLoadFailed, setPinLoadFailed] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  // The PIN lives only in Supabase so every device uses the same one
  const loadPin = useCallback(async () => {
    setPinLoadFailed(false);
    const cloudPin = await fetchAppPinFromDb();
    if (cloudPin) setSavedPin(cloudPin);
    else setPinLoadFailed(true);
  }, []);

  // Database state: Strictly Clean, zero mock data
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isSupabaseLive, setIsSupabaseLive] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState('');

  // Modals state
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  // Bumped when the cloud category cache changes so views re-read getAllCategories()
  const [, setCategoriesVersion] = useState(0);

  useEffect(() => {
    setCurrentMonth(new Date().toISOString().slice(0, 7));
    loadPin();
    fetchCustomCategoriesFromDb().then(() => setCategoriesVersion((v) => v + 1));
  }, [loadPin]);

  // Sync theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Load auth user
  const checkUser = useCallback(async () => {
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      try {
        const { data: { user } } = await client.auth.getUser();
        setUser(user);
      } catch (err) {
        console.warn('Error fetching auth user:', err);
      }
    } else {
      setUser(null);
    }
  }, []);

  // Load clean real data
  const loadData = useCallback(async () => {
    try {
      const expResult = await fetchExpensesFromDb(user);
      // On a failed fetch keep what's on screen instead of blanking it
      if (expResult.isSupabase) setExpenses(expResult.data);
      // Only report "Connected" when data actually came from the cloud
      setIsSupabaseLive(expResult.isSupabase && !expResult.error);
      setSyncError(getLastSyncError());

      const m = currentMonth || new Date().toISOString().slice(0, 7);
      const budgetsData = await fetchBudgetsFromDb(m, user);
      if (budgetsData) setBudgets(budgetsData);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, [user, currentMonth]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    loadData();

    // Supabase Realtime channel
    const client = getSupabase();
    if (client && isSupabaseConfigured()) {
      const channel = client
        .channel('public:expenses')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          () => {
            fetchExpensesFromDb(user).then((res) => {
              if (res.isSupabase) setExpenses(res.data);
            });
          }
        )
        .subscribe();

      return () => {
        client.removeChannel(channel);
      };
    }
  }, [loadData, user]);

  // Realtime alone isn't enough: phones suspend background tabs and drop the
  // socket, so a tab reopened later would show stale data. Refetch whenever the
  // app comes back into view or online, and poll while it's visible.
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', refreshIfVisible);
    window.addEventListener('focus', refreshIfVisible);
    window.addEventListener('online', refreshIfVisible);
    const timer = setInterval(refreshIfVisible, 30000);
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible);
      window.removeEventListener('focus', refreshIfVisible);
      window.removeEventListener('online', refreshIfVisible);
      clearInterval(timer);
    };
  }, [loadData]);

  // Save Transaction
  const handleSaveTransaction = async (data: Omit<ExpenseItem, 'id'>) => {
    try {
      const created = await addExpenseToDb(data, user);
      setExpenses((prev) => [created, ...prev]);
      setSyncError(null);
    } catch (e) {
      setSyncError(getLastSyncError());
      alert('Could not save to the cloud. Check your internet connection and try again.');
      throw e;
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    const ok = await deleteExpenseFromDb(id);
    setSyncError(getLastSyncError());
    if (ok) {
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    } else {
      alert('Could not delete. Check your internet connection and try again.');
    }
  };

  // Save Budget limit
  const handleSaveBudget = async (budget: CategoryBudget) => {
    let saved: CategoryBudget;
    try {
      saved = await upsertBudgetInDb(budget, user);
    } catch {
      setSyncError(getLastSyncError());
      alert('Could not save the budget. Check your internet connection and try again.');
      return;
    }
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.category === budget.category && b.month === budget.month);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  // Delete Budget limit
  const handleDeleteBudget = async (budget: CategoryBudget) => {
    const ok = await deleteBudgetFromDb(budget);
    setSyncError(getLastSyncError());
    if (ok) {
      setBudgets((prev) => prev.filter((b) => !(b.category === budget.category && b.month === budget.month)));
    } else {
      alert('Could not delete the budget. Check your internet connection and try again.');
    }
  };

  // Handle PIN changed
  const handlePinChanged = async (newPin: string) => {
    const ok = await saveAppPinToDb(newPin);
    if (ok) {
      setSavedPin(newPin);
    } else {
      setSyncError(getLastSyncError());
      alert('Could not save the new PIN to the cloud. Your old PIN is still active.');
    }
    return ok;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Type', 'Title', 'Payee', 'Category', 'Amount (INR)', 'Payment Method', 'Notes'];
    const rows = expenses.map((e) => [
      e.id,
      e.date,
      e.type,
      `"${(e.title || '').replace(/"/g, '""')}"`,
      `"${(e.payee || '').replace(/"/g, '""')}"`,
      `"${e.category}"`,
      e.amount,
      `"${e.payment_method || ''}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendwise-clean-inr-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [isWiping, setIsWiping] = useState(false);

  // Clean / Wipe All Data
  const handleExecuteWipe = async () => {
    setIsWiping(true);
    try {
      await clearAllData();
      setExpenses([]);
      setBudgets([]);
      setIsWipeModalOpen(false);
    } catch (e) {
      console.error('Wipe failed:', e);
    } finally {
      setIsWiping(false);
    }
  };

  const isDark = theme === 'dark';

  // 🔒 PIN Lock Screen: Blocks access until valid 4-digit PIN is entered
  if (!isUnlocked) {
    return (
      <PinLockScreen
        onUnlock={() => setIsUnlocked(true)}
        savedPin={savedPin}
        pinLoadFailed={pinLoadFailed}
        onRetryPin={loadPin}
        theme={theme}
        onPinChanged={handlePinChanged}
      />
    );
  }

  return (
    <div className={`min-h-screen w-full flex justify-center transition-colors duration-150 ${
      isDark ? 'bg-black text-[#f5f5f7]' : 'bg-[#f5f5f7] text-[#1d1d1f]'
    }`}>
      
      {/* 📱 Mobile Responsive App Container (Takes 100% on phone, max-w-md on desktop) */}
      <div className={`w-full max-w-md min-h-screen flex flex-col relative transition-all ${
        isDark 
          ? 'bg-black text-white sm:shadow-2xl sm:border-x sm:border-white/10' 
          : 'bg-[#f5f5f7] text-[#1d1d1f] sm:shadow-xl sm:border-x sm:border-slate-200/80'
      }`}>
        
        {/* Top App Header */}
        <header className={`w-full px-3.5 pt-3.5 pb-2.5 flex items-center justify-between sticky top-0 z-30 transition-colors ${
          isDark 
            ? 'bg-black/95 border-b border-white/10 ios-blur' 
            : 'bg-[#f5f5f7]/95 border-b border-slate-200/70 ios-blur'
        }`}>
          
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-extrabold text-sm shadow-sm">
              ₹
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight leading-none">
                SpendWise
              </h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Personal Tracker
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            
            {/* Lock Button */}
            <button
              onClick={() => setIsUnlocked(false)}
              className={`p-1.5 rounded-full border ios-press transition-colors ${
                isDark 
                  ? 'bg-[#1c1c1e] text-slate-300 border-white/10 hover:text-white' 
                  : 'bg-white text-slate-700 border-slate-200 shadow-xs hover:text-black'
              }`}
              title="Lock App (Enter PIN)"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`p-1.5 rounded-full border ios-press transition-colors ${
                isDark 
                  ? 'bg-[#1c1c1e] text-amber-300 border-white/10' 
                  : 'bg-white text-slate-700 border-slate-200 shadow-xs'
              }`}
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Quick Add CTA */}
            <button
              onClick={() => setIsFastInputOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add</span>
            </button>

          </div>

        </header>

        {/* Scrollable Main Screen Content */}
        <main className="flex-1 w-full px-2.5 sm:px-3 pt-2 pb-24 overflow-y-auto no-scrollbar">
          {syncError && (
            <div className="mb-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold break-words">
              <div>⚠️ Can&apos;t reach the cloud — changes won&apos;t be saved until this is fixed.</div>
              <div className="mt-1 font-mono font-normal">{syncError}</div>
              <div className="mt-1 font-mono font-normal opacity-80">
                db: {getActiveSupabaseCredentials().url.replace('https://', '')} · user: {user?.email || 'not signed in'}
              </div>
              <button onClick={loadData} className="mt-2 underline">Retry sync</button>
            </div>
          )}
          {activeTab === 'insights' && (
            <InsightsView
              expenses={expenses}
              currency="INR"
              theme={theme}
              onTransactionClick={(item) => alert(`${item.title}: ${formatCurrency(item.amount)}`)}
              onQuickAdd={() => setIsFastInputOpen(true)}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              expenses={expenses}
              currency="INR"
              theme={theme}
              onDelete={handleDeleteTransaction}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              expenses={expenses}
              currency="INR"
              onOpenNewBudget={() => setIsBudgetModalOpen(true)}
              onSaveBudget={handleSaveBudget}
              onDeleteBudget={handleDeleteBudget}
              theme={theme}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              currency="INR"
              onCurrencyChange={() => {}}
              user={user}
              onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              isSupabaseConnected={isSupabaseLive}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportCSV}
              onResetData={() => setIsWipeModalOpen(true)}
              onOpenChangePin={() => setIsChangePinOpen(true)}
              onLockApp={() => setIsUnlocked(false)}
              onOpenCreateCategory={() => setIsCreateCategoryModalOpen(true)}
            />
          )}
        </main>

        {/* Floating iOS Tab Bar (Sticky at bottom) */}
        <div className="fixed bottom-3 max-w-md w-full px-4 flex justify-center pointer-events-none z-30">
          <nav
            aria-label="Navigation Dock"
            className={`pointer-events-auto flex items-center justify-between gap-1.5 px-4 py-2 rounded-full shadow-xl border ios-blur ${
              isDark 
                ? 'bg-[#1c1c1e]/90 border-white/10 text-slate-400' 
                : 'bg-white/95 border-black/5 text-slate-500 shadow-slate-900/10'
            }`}
          >
            {/* 1. History / Ledger */}
            <button
              onClick={() => setActiveTab('history')}
              className={`p-2.5 rounded-full ios-press transition-colors ${
                activeTab === 'history'
                  ? isDark ? 'text-white' : 'text-black font-bold'
                  : 'hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Ledger"
            >
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* 2. Insights / Charts */}
            <button
              onClick={() => setActiveTab('insights')}
              className={`p-2.5 rounded-full ios-press transition-colors ${
                activeTab === 'insights'
                  ? isDark ? 'text-white' : 'text-black font-bold'
                  : 'hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Dashboard"
            >
              <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* 3. Center Quick Add Button */}
            <button
              onClick={() => setIsFastInputOpen(true)}
              className="w-11 h-11 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-1 shadow-md ios-press active:scale-95 transition-transform"
              title="Quick Add"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* 4. Budgets */}
            <button
              onClick={() => setActiveTab('budgets')}
              className={`p-2.5 rounded-full ios-press transition-colors ${
                activeTab === 'budgets'
                  ? isDark ? 'text-white' : 'text-black font-bold'
                  : 'hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Budgets"
            >
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2.5 rounded-full ios-press transition-colors ${
                activeTab === 'settings'
                  ? isDark ? 'text-white' : 'text-black font-bold'
                  : 'hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 stroke-[2.2]" />
            </button>
          </nav>
        </div>

        {/* Fullscreen Blazing Fast Input Overlay */}
        {isFastInputOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-end sm:items-center">
            <div className="w-full max-w-md h-full sm:h-[90vh] bg-white dark:bg-black sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-200">
              <FastInputView
                currencySymbol="₹"
                onSave={handleSaveTransaction}
                onClose={() => setIsFastInputOpen(false)}
                theme={theme}
                totalTransactionsCount={expenses.length}
              />
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <ChangePinModal
        isOpen={isChangePinOpen}
        onClose={() => setIsChangePinOpen(false)}
        currentPin={savedPin ?? ''}
        onPinChanged={handlePinChanged}
        theme={theme}
      />

      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
        onCategoryCreated={() => {
          setCategoriesVersion((v) => v + 1);
          setIsCreateCategoryModalOpen(false);
        }}
        theme={theme}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgets={budgets}
        onSaveBudget={handleSaveBudget}
        currencySymbol="₹"
        theme={theme}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigUpdated={() => {
          checkUser();
          loadData();
        }}
        theme={theme}
        onWipeRequested={() => setIsWipeModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        onAuthChanged={() => {
          checkUser();
          loadData();
        }}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        theme={theme}
      />

      {/* 3-Step Protected Wipe Data Modal (Confirm -> PIN Auth -> Final WIPE confirmation) */}
      <SecureWipeModal
        isOpen={isWipeModalOpen}
        onClose={() => setIsWipeModalOpen(false)}
        onConfirmWipe={handleExecuteWipe}
        currentPin={savedPin ?? ''}
        theme={theme}
      />

    </div>
  );
}
