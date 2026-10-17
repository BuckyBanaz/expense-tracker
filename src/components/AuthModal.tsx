'use client';

import React, { useState } from 'react';
import { 
  X, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Lock, 
  Mail, 
  AlertCircle, 
  CheckCircle2,
  Database
} from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onAuthChanged: () => void;
  onOpenSupabaseConfig: () => void;
  theme?: 'dark' | 'light';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onAuthChanged,
  onOpenSupabaseConfig,
  theme = 'light',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSupabase();
    if (!client) {
      setMessage({ type: 'error', text: 'Supabase is not configured yet. Please configure Supabase first.' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      if (mode === 'signin') {
        const { error } = await client.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Successfully signed in!' });
      } else {
        const { error } = await client.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Sign up successful! Please check your email for confirmation.' });
      }

      onAuthChanged();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Authentication error.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const client = getSupabase();
    if (client) {
      await client.auth.signOut();
      onAuthChanged();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-sm rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
        isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight font-sans">
                {user ? 'Account' : 'Cloud Sync Login'}
              </h3>
              <p className="text-xs text-slate-400">
                {user ? 'Signed in user' : 'Personal Supabase Account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {user ? (
            /* Logged in state */
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto text-xl font-bold">
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold truncate max-w-[240px] mx-auto">{user.email}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Private cloud sync active</p>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleAuthSubmit} className="space-y-3.5">
              
              {/* Sign In vs Sign Up toggle */}
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl ${
                isDark ? 'bg-black' : 'bg-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signin'
                      ? isDark ? 'bg-[#2c2c2e] text-white shadow' : 'bg-white text-black shadow-xs'
                      : 'text-slate-400'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signup'
                      ? isDark ? 'bg-[#2c2c2e] text-white shadow' : 'bg-white text-black shadow-xs'
                      : 'text-slate-400'
                  }`}
                >
                  Create
                </button>
              </div>

              {message && (
                <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-black text-white border-white/10 focus:border-white/30' 
                      : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                    isDark 
                      ? 'bg-black text-white border-white/10 focus:border-white/30' 
                      : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all mt-2"
              >
                {isLoading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
