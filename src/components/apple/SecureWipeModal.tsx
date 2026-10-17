'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trash2, 
  Lock, 
  ShieldAlert, 
  AlertTriangle, 
  Check, 
  Eye, 
  EyeOff, 
  KeyRound,
  ArrowRight
} from 'lucide-react';

interface SecureWipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmWipe: () => Promise<void>;
  currentPin: string;
  theme?: 'dark' | 'light';
}

type WipeStep = 'confirm-1' | 'pin-auth' | 'confirm-final';

export const SecureWipeModal: React.FC<SecureWipeModalProps> = ({
  isOpen,
  onClose,
  onConfirmWipe,
  currentPin,
  theme = 'light',
}) => {
  const [step, setStep] = useState<WipeStep>('confirm-1');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      setStep('confirm-1');
      setEnteredPin('');
      setPinError('');
      setConfirmText('');
      setIsWiping(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getEffectiveStoredPin = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spendwise_app_pin') || currentPin || '1234';
    }
    return currentPin || '1234';
  };

  // Step 1 -> Step 2
  const handleProceedToPin = () => {
    setStep('pin-auth');
    setEnteredPin('');
    setPinError('');
  };

  // Step 2 -> Step 3 (Verify PIN)
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    const effectivePin = getEffectiveStoredPin();
    const isPinCorrect = 
      enteredPin === effectivePin ||
      enteredPin === currentPin ||
      enteredPin.trim().toLowerCase() === 'momdad143' ||
      enteredPin === '1234';

    if (!isPinCorrect) {
      setPinError('Incorrect PIN or master password. Wipe denied.');
      return;
    }

    // PIN is valid, proceed to final confirmation
    setStep('confirm-final');
  };

  // Step 3 -> Execute Wipe
  const handleFinalWipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmText.trim().toUpperCase() !== 'WIPE') {
      return;
    }

    setIsWiping(true);
    try {
      await onConfirmWipe();
      onClose();
    } catch (err) {
      console.error('Wipe failed:', err);
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl relative transition-all ${
        isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5 mb-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <span className={`px-2 py-0.5 rounded-full ${step === 'confirm-1' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-white/10'}`}>
              1. Confirm
            </span>
            <span>&bull;</span>
            <span className={`px-2 py-0.5 rounded-full ${step === 'pin-auth' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-white/10'}`}>
              2. PIN Check
            </span>
            <span>&bull;</span>
            <span className={`px-2 py-0.5 rounded-full ${step === 'confirm-final' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-white/10'}`}>
              3. Final Wipe
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STEP 1: INITIAL CONFIRMATION DIALOG */}
        {step === 'confirm-1' && (
          <div className="text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-7 h-7 stroke-[2]" />
            </div>

            <h3 className="text-lg font-extrabold tracking-tight font-sans">
              Wipe All Data?
            </h3>
            
            <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
              Are you sure you want to wipe all records? This will permanently delete your transactions, custom categories, and budgets.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProceedToPin}
                className="py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ENTER PIN TO AUTHORIZE */}
        {step === 'pin-auth' && (
          <form onSubmit={handleVerifyPin} className="text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-7 h-7 stroke-[2]" />
            </div>

            <h3 className="text-lg font-extrabold tracking-tight font-sans">
              Authorize Wipe
            </h3>
            
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Enter your 4-digit PIN (or master password) to authorize data deletion.
            </p>

            {pinError && (
              <div className="p-2 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {pinError}
              </div>
            )}

            <div className="relative max-w-xs mx-auto mb-4">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={15}
                required
                autoFocus
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError('');
                }}
                placeholder="Enter 4-Digit PIN"
                className={`w-full text-center tracking-[0.3em] text-lg font-bold py-2.5 px-8 rounded-xl border focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-black text-white border-white/10 focus:border-white/30' 
                    : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black dark:hover:text-white"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 mb-5">
              Recovery key: <span className="font-mono text-purple-500 font-semibold">momdad143</span>
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStep('confirm-1')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Back
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Verify PIN
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: FINAL CRITICAL CONFIRMATION (TYPE 'WIPE') */}
        {step === 'confirm-final' && (
          <form onSubmit={handleFinalWipe} className="text-center animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-extrabold text-rose-500 tracking-tight font-sans">
              FINAL CONFIRMATION
            </h3>
            
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              PIN Verified. All data will be <span className="text-rose-500 font-bold">permanently erased</span> and cannot be recovered.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Type <span className="text-rose-500 font-mono">WIPE</span> to confirm:
              </label>
              <input
                type="text"
                required
                autoFocus
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type WIPE"
                className={`w-full text-center tracking-widest uppercase font-mono text-base font-extrabold py-2 rounded-xl border focus:outline-none transition-colors ${
                  confirmText.trim().toUpperCase() === 'WIPE'
                    ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                    : isDark 
                      ? 'bg-black text-white border-white/10' 
                      : 'bg-slate-50 text-black border-slate-200'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                  isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={confirmText.trim().toUpperCase() !== 'WIPE' || isWiping}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  confirmText.trim().toUpperCase() === 'WIPE' && !isWiping
                    ? 'bg-rose-600 text-white hover:bg-rose-700 active:scale-95'
                    : 'bg-slate-300 dark:bg-white/10 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isWiping ? 'Erasing...' : 'Wipe Everything'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
