'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  ChevronDown, 
  Delete, 
  Sparkles, 
  Building2, 
  Coins, 
  CreditCard,
  FileText,
  Plus
} from 'lucide-react';
import { ExpenseItem, TransactionType, CategoryMeta } from '@/types/expense';
import { getAllCategories } from '@/lib/currencies';
import { CategoryIcon } from './CategoryIcon';
import { CreateCategoryModal } from './CreateCategoryModal';
import confetti from 'canvas-confetti';

interface FastInputViewProps {
  currencySymbol: string;
  onSave: (data: Omit<ExpenseItem, 'id'>) => Promise<void>;
  onClose: () => void;
  theme?: 'dark' | 'light';
  totalTransactionsCount?: number;
}

export const FastInputView: React.FC<FastInputViewProps> = ({
  currencySymbol = '₹',
  onSave,
  onClose,
  theme = 'light',
  totalTransactionsCount = 0,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('0');
  const [title, setTitle] = useState('');
  const [payee, setPayee] = useState('');
  // Bank & UPI combined as requested!
  const [paymentMethod, setPaymentMethod] = useState<'Bank / UPI' | 'Cash' | 'Credit Card'>('Bank / UPI');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [categoriesList, setCategoriesList] = useState<CategoryMeta[]>([]);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [dateStr, setDateStr] = useState('');
  const [dateFormatted, setDateFormatted] = useState('Today');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  useEffect(() => {
    const now = new Date();
    setDateStr(now.toISOString().split('T')[0]);
    setDateFormatted(`Today, ${now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`);
    setCategoriesList(getAllCategories());
  }, []);

  const handleKeypadPress = (key: string) => {
    if (key === 'backspace') {
      if (amountStr.length <= 1) {
        setAmountStr('0');
      } else {
        setAmountStr(amountStr.slice(0, -1));
      }
      return;
    }

    if (key === '.') {
      if (!amountStr.includes('.')) {
        setAmountStr(amountStr + '.');
      }
      return;
    }

    if (amountStr === '0') {
      setAmountStr(key);
    } else {
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
      if (amountStr.length >= 8) return;
      setAmountStr(amountStr + key);
    }
  };

  const handleConfirm = async () => {
    const parsed = parseFloat(amountStr);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const defaultTitle = type === 'income' ? 'Income' : category;
    const finalTitle = title.trim() || defaultTitle;

    setIsSubmitting(true);
    try {
      await onSave({
        title: finalTitle,
        amount: parsed,
        type,
        category,
        date: dateStr || new Date().toISOString().split('T')[0],
        payment_method: paymentMethod,
        payee: payee.trim() || null,
        notes: notes.trim() || null,
      });

      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      setAmountStr('0');
      setTitle('');
      setPayee('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryMeta = categoriesList.find((c) => c.name.toLowerCase() === category.toLowerCase()) || 
    categoriesList[0] || {
      name: category,
      color: '#f97316',
      bgLight: '#f973161a',
      icon: 'Utensils',
      type: 'both' as const
    };
  const filteredCategories = categoriesList.filter((c) => c.type === 'both' || c.type === type);

  return (
    <div className={`w-full h-full max-h-screen flex flex-col justify-between p-4 sm:p-5 select-none transition-colors overflow-y-auto no-scrollbar ${
      isDark ? 'bg-black text-white' : 'bg-white text-slate-900'
    }`}>
      
      {/* 1. Header: Close, Segmented Toggle, Category Icon */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <button
          onClick={onClose}
          className={`w-9 h-9 rounded-full flex items-center justify-center ios-press ${
            isDark ? 'bg-[#1c1c1e] text-slate-300' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <X className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Apple Segmented Control */}
        <div className={`flex items-center p-1 rounded-full ${
          isDark ? 'bg-[#1c1c1e]' : 'bg-[#e5e5ea]'
        }`}>
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategory('Food & Dining');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ios-press ${
              type === 'expense'
                ? isDark ? 'bg-[#2c2c2e] text-white shadow-sm' : 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expense (-)
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategory('Salary');
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ios-press ${
              type === 'income'
                ? isDark ? 'bg-[#2c2c2e] text-white shadow-sm' : 'bg-white text-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income (+)
          </button>
        </div>

        <button
          onClick={() => setShowCategoryPicker(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center ios-press text-emerald-500 bg-emerald-500/10 border border-emerald-500/20"
          title="Select Category"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Amount Display (Tightened spacing) */}
      <div className="text-center py-1 shrink-0">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-2xl sm:text-3xl font-semibold opacity-60">
            {currencySymbol}
          </span>
          <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-sans">
            {amountStr}
          </span>
        </div>

        {/* Inputs (Title & Payee) */}
        <div className="mt-2.5 max-w-xs mx-auto space-y-1.5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g. Swiggy, Groceries, Rent)"
            className={`w-full text-xs px-3.5 py-2 rounded-xl border text-center font-medium focus:outline-none transition-colors ${
              isDark 
                ? 'bg-[#1c1c1e] text-white border-white/10 focus:border-white/30' 
                : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
            }`}
          />

          <input
            type="text"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder={type === 'expense' ? 'Paid to: (e.g. Blinkit, Landlord, Amazon)' : 'Received from: (e.g. Tech Corp, Client)'}
            className={`w-full text-xs px-3.5 py-1.5 rounded-xl border text-center font-medium focus:outline-none transition-colors ${
              isDark 
                ? 'bg-[#1c1c1e] text-white border-white/10 focus:border-white/30' 
                : 'bg-slate-50 text-black border-slate-200 focus:border-slate-400'
            }`}
          />
        </div>

        {/* Payment Method Pills (Bank / UPI combined!) */}
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {(['Bank / UPI', 'Cash', 'Credit Card'] as const).map((pm) => (
            <button
              key={pm}
              type="button"
              onClick={() => setPaymentMethod(pm)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ios-press ${
                paymentMethod === pm
                  ? isDark 
                    ? 'bg-white text-black border-white shadow-xs' 
                    : 'bg-black text-white border-black shadow-xs'
                  : isDark 
                    ? 'bg-[#1c1c1e] text-slate-400 border-white/5 hover:border-white/20' 
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {pm}
            </button>
          ))}
        </div>

        {/* Optional Description / Notes */}
        <div className="mt-1 text-center">
          {showNotesInput ? (
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Description (Optional)"
              className={`w-full max-w-xs text-xs px-3 py-1 rounded-xl border text-center font-medium focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-[#1c1c1e] text-white border-white/10' 
                  : 'bg-slate-50 text-black border-slate-200'
              }`}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowNotesInput(true)}
              className="text-[10px] text-slate-400 hover:text-black dark:hover:text-white font-semibold"
            >
              + Add Description (Optional)
            </button>
          )}
        </div>

        {/* Sub-bar: Date & Category Chip */}
        <div className="mt-2 flex items-center justify-between px-3 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateFormatted}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowCategoryPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs ios-press"
            style={{
              backgroundColor: selectedCategoryMeta.bgLight || `${selectedCategoryMeta.color}1f`,
              color: selectedCategoryMeta.color,
            }}
          >
            <CategoryIcon name={selectedCategoryMeta.icon || selectedCategoryMeta.name} className="w-3.5 h-3.5" />
            <span>{selectedCategoryMeta.name}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

      </div>

      {/* 3. Category Picker Sheet */}
      {showCategoryPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-5 border shadow-2xl ${
            isDark ? 'bg-[#1c1c1e] border-white/10 text-white' : 'bg-white border-slate-200 text-black'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-sm">Select Category</h4>
                <p className="text-[10px] text-slate-400">Choose or create your own</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCategoryOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 active:scale-95 transition-all"
                  title="Create Custom Category"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Custom</span>
                </button>
                <button onClick={() => setShowCategoryPicker(false)} className="p-1 rounded-full text-slate-400 hover:text-black dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto no-scrollbar">
              {filteredCategories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setCategory(c.name);
                    setShowCategoryPicker(false);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    category.toLowerCase() === c.name.toLowerCase()
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                      : isDark ? 'border-white/5 bg-[#2c2c2e]' : 'border-slate-100 bg-slate-50 text-slate-800'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                    style={{ backgroundColor: c.color }}
                  >
                    <CategoryIcon name={c.icon || c.name} className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Integrated Numeric Keypad (Tight, responsive spacing without giant gaps) */}
      <div className="w-full max-w-xs mx-auto pb-1 shrink-0">
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 text-center">
          
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeypadPress(digit)}
              className={`h-12 sm:h-13 rounded-2xl text-xl sm:text-2xl font-medium ios-press transition-colors flex items-center justify-center ${
                isDark 
                  ? 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e]' 
                  : 'bg-[#f2f2f7] text-black hover:bg-[#e5e5ea]'
              }`}
            >
              {digit}
            </button>
          ))}

          {/* Row 4: . , 0 , Confirm */}
          <button
            type="button"
            onClick={() => handleKeypadPress('.')}
            className={`h-12 sm:h-13 rounded-2xl text-xl sm:text-2xl font-semibold ios-press transition-colors flex items-center justify-center ${
              isDark 
                ? 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e]' 
                : 'bg-[#f2f2f7] text-black hover:bg-[#e5e5ea]'
            }`}
          >
            .
          </button>

          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className={`h-12 sm:h-13 rounded-2xl text-xl sm:text-2xl font-medium ios-press transition-colors flex items-center justify-center ${
              isDark 
                ? 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e]' 
                : 'bg-[#f2f2f7] text-black hover:bg-[#e5e5ea]'
            }`}
          >
            0
          </button>

          {/* Save / Confirm Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className={`h-12 sm:h-13 rounded-2xl text-white font-bold ios-press transition-all flex items-center justify-center shadow-md active:scale-95 ${
              isDark
                ? 'bg-[#2c2c2e] hover:bg-[#3a3a3c] border border-white/10'
                : 'bg-black hover:bg-slate-800'
            }`}
            title="Save Transaction"
          >
            {isSubmitting ? (
              <span className="text-xs">Saving...</span>
            ) : (
              <Check className="w-6 h-6 stroke-[2.5]" />
            )}
          </button>

        </div>

        {/* Backspace Delete */}
        <div className="flex justify-end pt-1 pr-1">
          <button
            type="button"
            onClick={() => handleKeypadPress('backspace')}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-black dark:hover:text-white p-1 ios-press"
          >
            <Delete className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Custom Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        onCategoryCreated={(newCat) => {
          const updated = getAllCategories();
          setCategoriesList(updated);
          setCategory(newCat.name);
          setShowCategoryPicker(false);
        }}
        theme={theme}
      />

    </div>
  );
};
