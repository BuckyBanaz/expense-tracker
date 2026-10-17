export type TransactionType = 'expense' | 'income';

export interface ExpenseItem {
  id: string;
  created_at?: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string; // YYYY-MM-DD
  payment_method: string; // 'Bank' | 'UPI' | 'Cash' | 'Credit Card'
  payee?: string | null; // Kisko pay kiya ya Kisse mila
  notes?: string | null; // Description (optional)
  user_id?: string | null;
}

export interface CategoryBudget {
  id?: string;
  created_at?: string;
  category: string;
  monthly_limit: number;
  month: string; // YYYY-MM
  user_id?: string | null;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  rate: number; // vs INR base
}

export interface ExpenseFilter {
  type: 'all' | 'expense' | 'income';
  category: string;
  search: string;
  startDate?: string;
  endDate?: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface CategoryMeta {
  name: string;
  color: string;
  bgLight: string;
  icon: string;
  type: 'expense' | 'income' | 'both';
}
