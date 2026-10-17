'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { ExpenseItem, TransactionType } from '@/types/expense';
import { CATEGORIES, PAYMENT_METHODS } from '@/lib/currencies';
import confetti from 'canvas-confetti';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<ExpenseItem, 'id'>, id?: string) => Promise<void>;
  editItem?: ExpenseItem | null;
  currencySymbol: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editItem,
  currencySymbol = '₹',
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState('');
  const [payee, setPayee] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState('Food & Dining');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editItem) {
      setType(editItem.type);
      setTitle(editItem.title);
      setPayee(editItem.payee || '');
      setAmount(String(editItem.amount));
      setCategory(editItem.category);
      setDate(editItem.date);
      setPaymentMethod(editItem.payment_method || 'UPI');
      setNotes(editItem.notes || '');
    } else {
      setType('expense');
      setTitle('');
      setPayee('');
      setAmount('');
      setCategory('Food & Dining');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setNotes('');
    }
  }, [editItem, isOpen]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      setCategory('Salary');
    } else {
      setCategory('Food & Dining');
    }
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = Number(amount) || 0;
    setAmount(String(current + addValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid title and positive amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          title: title.trim(),
          amount: parsedAmount,
          type,
          category,
          date,
          payment_method: paymentMethod,
          payee: payee.trim() || null,
          notes: notes.trim() || null,
        },
        editItem?.id
      );

      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}

      onClose();
    } catch (err) {
      console.error('Error saving transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = CATEGORIES.filter(
    (c) => c.type === 'both' || c.type === type
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              {editItem ? 'Edit Transaction' : 'New Transaction'}
            </h3>
            <p className="text-xs text-slate-400">
              Personal finance entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
          
          {/* Expense vs Income Toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-black/50 rounded-2xl border border-slate-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Amount ({currencySymbol}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">
                {currencySymbol}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white font-extrabold text-2xl pl-9 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            
            {/* Quick amount chips */}
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Quick:</span>
              {[100, 500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 font-semibold transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Title / Reason *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Swiggy food delivery, Grocery, Rent"
              className="w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Payee / Receiver / Sender */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {type === 'expense' ? 'Paid To (Kisko pay kiya)' : 'Received From (Kisse mila)'}
            </label>
            <input
              type="text"
              value={payee}
              onChange={(e) => setPayee(e.target.value)}
              placeholder={type === 'expense' ? 'e.g. Blinkit, Landlord, Amazon, Cafe' : 'e.g. Tech Corp, Rohan, Client'}
              className="w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Category & Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {filteredCategories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {['Bank / UPI', 'Cash', 'Credit Card'].map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Notes Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Description / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bill number, note, tag"
                className="w-full bg-slate-50 dark:bg-black text-slate-900 dark:text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-black dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {editItem ? 'Update' : 'Save'}
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
