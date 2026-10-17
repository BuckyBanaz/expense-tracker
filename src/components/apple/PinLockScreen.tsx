'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Delete, KeyRound, ShieldAlert, Check, X } from 'lucide-react';
import { fetchAppPinFromDb, saveAppPinToDb } from '@/lib/supabaseClient';

interface PinLockScreenProps {
  onUnlock: () => void;
  savedPin: string;
  theme?: 'dark' | 'light';
  onPinChanged?: (newPin: string) => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  onUnlock,
  savedPin,
  theme = 'light',
  onPinChanged,
}) => {
  const [activePin, setActivePin] = useState(savedPin);
  const [enteredPin, setEnteredPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Recovery modal state
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    setActivePin(savedPin);
  }, [savedPin]);

  // Sync latest PIN directly from Supabase cloud on load
  useEffect(() => {
    fetchAppPinFromDb().then((cloudPin) => {
      if (cloudPin) {
        setActivePin(cloudPin);
        if (onPinChanged && cloudPin !== savedPin) {
          onPinChanged(cloudPin);
        }
      }
    });
  }, []);

  const handleDigit = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const newPin = enteredPin + digit;
    setEnteredPin(newPin);
    setIsError(false);
    setErrorMessage('');

    if (newPin.length === 4) {
      if (newPin === activePin || newPin === savedPin) {
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else {
        setTimeout(() => {
          setIsError(true);
          setErrorMessage('Incorrect PIN. Tap "Forgot PIN?" below');
          setEnteredPin('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(enteredPin.slice(0, -1));
      setIsError(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    // Check master recovery password "momdad143"
    if (recoveryPassword.trim().toLowerCase() === 'momdad143') {
      setRecoverySuccess(true);
      // Reset PIN to 1234 in cloud and local
      saveAppPinToDb('1234');
      if (typeof window !== 'undefined') {
        localStorage.setItem('spendwise_app_pin', '1234');
      }
      setActivePin('1234');
      if (onPinChanged) {
        onPinChanged('1234');
      }

      setTimeout(() => {
        setShowRecoveryModal(false);
        setRecoverySuccess(false);
        setRecoveryPassword('');
        onUnlock();
      }, 1200);
    } else {
      setRecoveryError('Incorrect recovery password.');
    }
  };

  const keypadNumbers = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between py-10 px-6 select-none transition-colors ${
      isDark ? 'bg-black text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'
    }`}>
      
      {/* Top Header & Lock Icon */}
      <div className="flex flex-col items-center pt-4 text-center animate-in fade-in duration-300">
        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shadow-md mb-3 transition-transform ${
          isDark 
            ? 'bg-[#1c1c1e] border border-white/10 text-white' 
            : 'bg-white border border-slate-200/80 text-black'
        }`}>
          <Lock className="w-6 h-6 stroke-[2.2]" />
        </div>

        <h2 className="text-xl font-extrabold tracking-tight font-sans">
          SpendWise
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Personal Tracker &bull; Enter PIN
        </p>

        {/* 4 PIN Dots */}
        <div className={`flex items-center gap-4 mt-6 transition-transform duration-200 ${
          isError ? 'animate-shake' : ''
        }`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < enteredPin.length;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? isDark 
                      ? 'bg-white scale-110 shadow-sm' 
                      : 'bg-black scale-110 shadow-sm'
                    : isDark 
                      ? 'border-2 border-white/30 bg-transparent' 
                      : 'border-2 border-slate-300 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error or Hint Message */}
        <div className="h-6 mt-3">
          {errorMessage ? (
            <p className="text-xs font-semibold text-rose-500 animate-in fade-in">
              {errorMessage}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 font-medium">
              Enter your 4-digit passcode
            </p>
          )}
        </div>
      </div>

      {/* Numeric Apple Keypad (3x4 Grid) */}
      <div className="w-full max-w-[280px] pb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          
          {keypadNumbers.map(({ num, letters }) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              className={`h-15 rounded-full flex flex-col items-center justify-center ios-press transition-all active:scale-95 ${
                isDark 
                  ? 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/5 shadow-sm' 
                  : 'bg-white text-black hover:bg-slate-100 border border-slate-200/80 shadow-xs'
              }`}
            >
              <span className="text-2xl font-bold font-sans leading-none">{num}</span>
              {letters && (
                <span className="text-[9px] font-bold text-slate-400 tracking-widest mt-0.5">
                  {letters}
                </span>
              )}
            </button>
          ))}

          {/* Row 4: Forgot PIN Button */}
          <button
            type="button"
            onClick={() => {
              setRecoveryError('');
              setShowRecoveryModal(true);
            }}
            className="h-15 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-400 hover:text-black dark:hover:text-white ios-press transition-colors"
          >
            Forgot PIN?
          </button>

          {/* 0 digit */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className={`h-15 rounded-full flex flex-col items-center justify-center ios-press transition-all active:scale-95 ${
              isDark 
                ? 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/5 shadow-sm' 
                : 'bg-white text-black hover:bg-slate-100 border border-slate-200/80 shadow-xs'
            }`}
          >
            <span className="text-2xl font-bold font-sans leading-none">0</span>
          </button>

          {/* Delete / Backspace Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-15 rounded-full flex items-center justify-center text-slate-400 hover:text-black dark:hover:text-white ios-press transition-colors"
            title="Delete"
          >
            <Delete className="w-6 h-6 stroke-[2]" />
          </button>

        </div>
      </div>

      {/* 🔑 MASTER RECOVERY MODAL (Password: momdad143) */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl relative transition-all ${
            isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            
            <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-sans">Reset Lock PIN</h3>
                  <p className="text-[10px] text-slate-400">Master password verification</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRecoveryModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recoverySuccess ? (
              <div className="py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h4 className="text-sm font-bold text-emerald-500">PIN Reset to 1234!</h4>
                <p className="text-xs text-slate-400 mt-1">Unlocking your app now...</p>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4 pt-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your master recovery password to reset your PIN to default <strong>1234</strong> and unlock your app.
                </p>

                {recoveryError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                    {recoveryError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Master Password
                  </label>
                  <input
                    type="password"
                    autoFocus
                    required
                    value={recoveryPassword}
                    onChange={(e) => setRecoveryPassword(e.target.value)}
                    placeholder="Enter password"
                    className={`w-full text-sm px-3.5 py-2.5 rounded-xl border focus:outline-none transition-colors ${
                      isDark 
                        ? 'bg-black text-white border-white/10 focus:border-white/30' 
                        : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                    }`}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-black dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-sm"
                  >
                    Unlock &amp; Reset
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
