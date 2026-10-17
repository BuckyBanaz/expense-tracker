'use client';

import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { ExpenseItem, CategoryBudget } from '@/types/expense';
import { CATEGORIES, formatCurrency } from '@/lib/currencies';
import { AlertTriangle, CheckCircle, TrendingDown, Layers, PieChart as PieIcon, SlidersHorizontal } from 'lucide-react';

interface AnalyticsChartsProps {
  expenses: ExpenseItem[];
  budgets: CategoryBudget[];
  currency: string;
  currentMonth: string;
  onOpenBudgetModal: () => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  expenses,
  budgets,
  currency,
  currentMonth,
  onOpenBudgetModal,
}) => {
  // Category breakdown for expenses
  const categoryData = useMemo(() => {
    const expenseOnly = expenses.filter((e) => e.type === 'expense');
    const categoryTotals: Record<string, number> = {};

    expenseOnly.forEach((item) => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount);
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => {
        const catMeta = CATEGORIES.find((c) => c.name === name);
        return {
          name,
          value,
          color: catMeta ? catMeta.color : '#64748b',
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Timeline / Trend data (group by date or last 7 days / weekly)
  const timelineData = useMemo(() => {
    const datesMap: Record<string, { date: string; income: number; expense: number }> = {};
    
    // Sort transactions by date ascending
    const sorted = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Take the last 10 distinct transaction dates
    sorted.forEach((item) => {
      const d = item.date;
      if (!datesMap[d]) {
        // format as DD MMM
        const formattedDate = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        datesMap[d] = { date: formattedDate, income: 0, expense: 0 };
      }
      if (item.type === 'income') {
        datesMap[d].income += Number(item.amount);
      } else {
        datesMap[d].expense += Number(item.amount);
      }
    });

    const entries = Object.values(datesMap);
    return entries.slice(-8); // latest 8 active days
  }, [expenses]);

  // Category Budget tracking
  const budgetComparisons = useMemo(() => {
    const monthExpenses = currentMonth 
      ? expenses.filter((e) => e.type === 'expense' && e.date.startsWith(currentMonth))
      : expenses.filter((e) => e.type === 'expense');
    
    const spentByCategory: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      spentByCategory[e.category] = (spentByCategory[e.category] || 0) + Number(e.amount);
    });

    return budgets.map((b) => {
      const spent = spentByCategory[b.category] || 0;
      const percent = b.monthly_limit > 0 ? Math.round((spent / b.monthly_limit) * 100) : 0;
      const catMeta = CATEGORIES.find((c) => c.name === b.category);

      return {
        category: b.category,
        limit: b.monthly_limit,
        spent,
        percent,
        color: catMeta?.color || '#3b82f6',
        isOver: spent > b.monthly_limit,
        isNear: percent >= 80 && spent <= b.monthly_limit,
      };
    });
  }, [expenses, budgets]);

  const totalExpense = useMemo(() => {
    return expenses
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Category Breakdown Donut Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <PieIcon className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-base">Expense by Category</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {categoryData.length} active
            </span>
          </div>

          <div className="h-64 mt-4 relative">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), 'Total']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '0.75rem',
                        color: '#f8fafc',
                        fontSize: '0.8rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stat */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-slate-400">Total Spent</span>
                  <span className="text-sm font-extrabold text-white">
                    {formatCurrency(totalExpense, currency)}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                No expense data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Legend Pills */}
        <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-slate-800">
          {categoryData.slice(0, 4).map((cat) => (
            <div key={cat.name} className="flex items-center gap-1.5 text-xs bg-slate-950/60 px-2 py-1 rounded-md border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="text-slate-300 font-medium truncate max-w-[90px]">{cat.name}</span>
              <span className="text-slate-400 text-[10px]">
                {totalExpense > 0 ? `${Math.round((cat.value / totalExpense) * 100)}%` : '0%'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Cash Flow Trends (Income vs Expense) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-base">Cash Flow Trend</h4>
            </div>
            <span className="text-xs text-slate-400 font-medium">Recent Activity</span>
          </div>

          <div className="h-64 mt-4">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      formatCurrency(Number(value) || 0, currency),
                      name === 'income' ? 'Income' : 'Expense'
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '0.8rem',
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    formatter={(val) => (
                      <span className="text-xs text-slate-300 font-medium capitalize">{val}</span>
                    )} 
                  />
                  <Bar dataKey="income" name="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="expense" name="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                No activity trend data available.
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 pt-3 text-xs text-slate-400 border-t border-slate-800 text-center">
          Compare daily inflow vs outflow to maintain a positive balance.
        </p>
      </div>

      {/* 3. Monthly Budget Health & Alerts */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-base">Monthly Budgets</h4>
            </div>
            <button
              onClick={onOpenBudgetModal}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
            >
              Edit Limits
            </button>
          </div>

          <div className="mt-4 space-y-3.5 max-h-64 overflow-y-auto pr-1">
            {budgetComparisons.length > 0 ? (
              budgetComparisons.map((b) => (
                <div key={b.category} className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span className="text-slate-200 font-semibold">{b.category}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {b.isOver ? (
                        <span className="text-rose-400 flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          Over Limit
                        </span>
                      ) : b.isNear ? (
                        <span className="text-amber-400 font-semibold">Near 80%</span>
                      ) : (
                        <span className="text-slate-400">{b.percent}%</span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        b.isOver
                          ? 'bg-rose-500'
                          : b.isNear
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, b.percent))}%` }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Spent: {formatCurrency(b.spent, currency)}</span>
                    <span>Cap: {formatCurrency(b.limit, currency)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No monthly budgets set yet. Click "Edit Limits" to set category caps.
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onOpenBudgetModal}
          className="mt-4 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 hover:bg-indigo-900/60 transition-all text-center"
        >
          Manage Category Budget Caps
        </button>
      </div>

    </div>
  );
};
