'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, KeyRound, Eye, EyeOff, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChangePinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPin: string;
  onPinChanged: (newPin: string) => Promise<boolean>;
  theme?: 'dark' | 'light';
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  isOpen,
  onClose,
  currentPin,
  onPinChanged,
  theme = 'light',
}) => {
  const [mode, setMode] = useState<'change' | 'recovery'>('change');
  const [oldPin, setOldPin] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('PIN Updated Successfully!');

  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      setOldPin('');
      setRecoveryPassword('');
      setNewPin('');
      setConfirmPin('');
      setError('');
      setSuccess(false);
      setMode('change');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getEffectiveStoredPin = () => currentPin || '1234';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const storedPin = getEffectiveStoredPin();

    if (mode === 'recovery') {
      if (recoveryPassword.trim().toLowerCase() !== 'momdad143') {
        setError('Incorrect recovery password (Enter momdad143)');
        return;
      }
    } else {
      const isOldPinValid =
        oldPin === storedPin ||
        oldPin === currentPin ||
        oldPin.trim().toLowerCase() === 'momdad143' ||
        oldPin === '1234';

      if (!isOldPinValid) {
        setError('Current PIN is incorrect. You can tap "Forgot PIN? (momdad143)" below.');
        return;
      }
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits (0-9)');
      return;
    }

    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match');
      return;
    }

    // Parent saves to the cloud; only report success once that worked
    const ok = await onPinChanged(newPin);
    if (!ok) {
      setError('Could not save the new PIN. Check your connection and try again.');
      return;
    }

    setSuccessMessage(`New PIN (${newPin}) is now active!`);
    setSuccess(true);

    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1400);
  };

  // Quick reset to 1234 with master password
  const handleQuickResetTo1234 = () => {
    const input = prompt('Enter recovery password (momdad143) to reset PIN to 1234:');
    if (input && input.trim().toLowerCase() === 'momdad143') {
      onPinChanged('1234');
      setSuccessMessage('PIN reset to default: 1234');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } else if (input) {
      alert('Incorrect recovery password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl relative transition-all ${
        isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'
            }`}>
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm font-sans">
                {mode === 'recovery' ? 'Reset PIN with Master Key' : 'Change App PIN'}
              </h3>
              <p className="text-[10px] text-slate-400">4-digit security passcode</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Pill */}
        <div className={`mt-3 flex items-center p-1 rounded-xl ${
          isDark ? 'bg-black' : 'bg-slate-100'
        }`}>
          <button
            type="button"
            onClick={() => {
              setMode('change');
              setError('');
            }}
            className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
              mode === 'change'
                ? isDark ? 'bg-[#2c2c2e] text-white shadow' : 'bg-white text-black shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Change PIN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('recovery');
              setError('');
            }}
            className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
              mode === 'recovery'
                ? isDark ? 'bg-[#2c2c2e] text-purple-400 shadow' : 'bg-white text-purple-600 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Forgot PIN? (momdad143)
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h4 className="text-sm font-bold text-emerald-500">{successMessage}</h4>
            <p className="text-xs text-slate-400 mt-1">Ready to use.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 pt-3">
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Mode 1: Standard Change (Old PIN) */}
            {mode === 'change' ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-400">
                    Current PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setMode('recovery')}
                    className="text-[10px] text-purple-500 hover:underline font-semibold"
                  >
                    Forgot Current PIN?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPins ? 'text' : 'password'}
                    maxLength={15}
                    required
                    value={oldPin}
                    onChange={(e) => setOldPin(e.target.value)}
                    placeholder="Current 4 digits (or momdad143)"
                    className={`w-full text-center tracking-[0.3em] text-base font-bold py-2 px-8 rounded-xl border focus:outline-none transition-colors ${
                      isDark 
                        ? 'bg-black text-white border-white/10 focus:border-white/30' 
                        : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPins(!showPins)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black dark:hover:text-white"
                  >
                    {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              /* Mode 2: Master Password Recovery */
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Recovery Password (Master Key)
                </label>
                <div className="relative">
                  <input
                    type={showPins ? 'text' : 'password'}
                    required
                    autoFocus
                    value={recoveryPassword}
                    onChange={(e) => setRecoveryPassword(e.target.value)}
                    placeholder="Enter momdad143"
                    className={`w-full text-center text-sm font-bold py-2 px-8 rounded-xl border focus:outline-none transition-colors ${
                      isDark 
                        ? 'bg-black text-white border-purple-500/40 focus:border-purple-400' 
                        : 'bg-purple-50/50 text-black border-purple-300 focus:border-purple-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPins(!showPins)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black dark:hover:text-white"
                  >
                    {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 text-center">
                  Use master password <span className="font-mono font-bold text-purple-500">momdad143</span> to set any new PIN
                </p>
              </div>
            )}

            {/* New 4-Digit PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                New 4-Digit PIN
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="New 4 digits"
                className={`w-full text-center tracking-[0.5em] text-lg font-bold py-2 rounded-xl border focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-black text-white border-white/10 focus:border-white/30' 
                    : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                }`}
              />
            </div>

            {/* Confirm New PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Confirm New PIN
              </label>
              <input
                type={showPins ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Confirm 4 digits"
                className={`w-full text-center tracking-[0.5em] text-lg font-bold py-2 rounded-xl border focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-black text-white border-white/10 focus:border-white/30' 
                    : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
                }`}
              />
            </div>

            {/* Quick Reset Option */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleQuickResetTo1234}
                className="text-[11px] text-slate-400 hover:text-black dark:hover:text-white font-medium flex items-center justify-center gap-1 mx-auto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Quick Reset PIN to 1234</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-black dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                {mode === 'recovery' ? 'Reset PIN' : 'Update PIN'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
