'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  ExternalLink,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { 
  getActiveSupabaseCredentials, 
  saveCustomSupabaseConfig, 
  clearCustomSupabaseConfig, 
  getSupabase,
  clearAllData
} from '@/lib/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
  theme?: 'dark' | 'light';
  onWipeRequested?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
  theme = 'light',
  onWipeRequested,
}) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      const creds = getActiveSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setTestResult({ success: false, message: 'Please provide both Project URL and Anon Key.' });
      return;
    }

    if (!url.startsWith('https://')) {
      setTestResult({ success: false, message: 'Project URL must start with https://' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      saveCustomSupabaseConfig(url, key);
      const client = getSupabase();
      
      if (!client) {
        throw new Error('Failed to instantiate Supabase client.');
      }

      // Quick ping test
      const { data, error } = await client.from('expenses').select('id').limit(1);

      if (error) {
        if (error.code === '42P01' || error.message?.includes('schema cache')) {
          setTestResult({
            success: false,
            message: 'Connected to Supabase! However, the "expenses" table is missing. Click "Copy SQL Schema" and run it in your Supabase SQL Editor.',
          });
        } else {
          setTestResult({
            success: false,
            message: `Supabase query error: ${error.message}`,
          });
        }
      } else {
        setTestResult({
          success: true,
          message: 'Successfully connected to Supabase and verified the database!',
        });
        onConfigUpdated();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Could not connect to Supabase. Check your URL and Key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopySchema = async () => {
    try {
      const cleanSql = `-- 1. Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    payee VARCHAR(255),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    category VARCHAR(50) NOT NULL,
    monthly_limit NUMERIC(12, 2) NOT NULL CHECK (monthly_limit > 0),
    month VARCHAR(7) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_category_month UNIQUE (user_id, category, month)
);

-- 3. RLS Policies
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses policy" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Budgets policy" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Realtime Live Sync
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'expenses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
    END IF;
END $$;`;

      await navigator.clipboard.writeText(cleanSql);
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2500);
    } catch (e) {
      console.error('Failed to copy schema:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight font-sans">
                Supabase Backend Setup
              </h3>
              <p className="text-xs text-slate-400">
                PostgreSQL Cloud Sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleTestAndSave} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          
          {/* SQL Setup Helper Card */}
          <div className={`p-3.5 rounded-2xl border text-xs ${
            isDark ? 'bg-black/30 border-white/5' : 'bg-slate-50 border-slate-200/70'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                1. Table Schema Setup
              </span>
              <button
                type="button"
                onClick={handleCopySchema}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black text-white dark:bg-white dark:text-black font-bold text-[10px] shadow-xs active:scale-95 transition-all"
              >
                {copiedSchema ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSchema ? 'Copied SQL!' : 'Copy SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Open your Supabase dashboard, paste the copied SQL in the SQL Editor, and click RUN.
            </p>
            <a
              href="https://supabase.com/dashboard/project/fmwppzwuotupebtdiszv/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-bold text-blue-500 hover:underline text-[11px]"
            >
              <span>Open Supabase SQL Editor</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Project URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyz.supabase.co"
              className={`w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-black text-white border-white/10 focus:border-white/30' 
                  : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
              }`}
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Supabase Anon / Publishable Key
            </label>
            <textarea
              rows={2}
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sb_publishable_... or eyJhbGciOi..."
              className={`w-full text-xs font-mono px-3.5 py-2 rounded-xl border focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-black text-white border-white/10 focus:border-white/30' 
                  : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
              }`}
            />
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-tight">{testResult.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/5">
            {onWipeRequested ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onWipeRequested();
                }}
                className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:underline p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Wipe Data</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-black dark:hover:text-white"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isTesting}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                {isTesting ? (
                  <span>Testing...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save &amp; Connect</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
