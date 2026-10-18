import { CategoryMeta } from '@/types/expense';

export const CURRENCIES: Record<string, { code: string; symbol: string; label: string; rate: number }> = {
  INR: { code: 'INR', symbol: '₹', label: 'INR (₹)', rate: 1 },
};

export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  { name: 'Food & Dining', color: '#f97316', bgLight: 'rgba(249, 115, 22, 0.12)', icon: 'Utensils', type: 'expense' },
  { name: 'Housing', color: '#6366f1', bgLight: 'rgba(99, 102, 241, 0.12)', icon: 'Home', type: 'expense' },
  { name: 'Transportation', color: '#0ea5e9', bgLight: 'rgba(14, 165, 233, 0.12)', icon: 'Car', type: 'expense' },
  { name: 'Bills & Utilities', color: '#eab308', bgLight: 'rgba(234, 179, 8, 0.12)', icon: 'Zap', type: 'expense' },
  { name: 'Entertainment', color: '#a855f7', bgLight: 'rgba(168, 85, 247, 0.12)', icon: 'Film', type: 'expense' },
  { name: 'Shopping', color: '#ec4899', bgLight: 'rgba(236, 72, 153, 0.12)', icon: 'ShoppingBag', type: 'expense' },
  { name: 'Health & Fitness', color: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.12)', icon: 'HeartPulse', type: 'expense' },
  { name: 'Salary', color: '#10b981', bgLight: 'rgba(16, 185, 129, 0.12)', icon: 'Briefcase', type: 'income' },
  { name: 'Freelance', color: '#06b6d4', bgLight: 'rgba(6, 182, 212, 0.12)', icon: 'Laptop', type: 'income' },
  { name: 'Investment', color: '#8b5cf6', bgLight: 'rgba(139, 92, 246, 0.12)', icon: 'TrendingUp', type: 'income' },
  { name: 'Other', color: '#64748b', bgLight: 'rgba(100, 116, 139, 0.12)', icon: 'Tag', type: 'both' },
];

export const CATEGORIES = DEFAULT_CATEGORIES;

export const AVAILABLE_ICONS = [
  { name: 'Utensils', label: 'Food & Meals' },
  { name: 'Coffee', label: 'Chai & Coffee' },
  { name: 'Pizza', label: 'Fast Food' },
  { name: 'Apple', label: 'Groceries' },
  { name: 'Car', label: 'Car / Cab' },
  { name: 'Bike', label: 'Bike / Scooter' },
  { name: 'Fuel', label: 'Petrol / Fuel' },
  { name: 'Plane', label: 'Travel / Flight' },
  { name: 'Bus', label: 'Bus / Metro' },
  { name: 'Home', label: 'Rent / Home' },
  { name: 'Zap', label: 'Electricity / Power' },
  { name: 'Wifi', label: 'WiFi / Internet' },
  { name: 'Phone', label: 'Mobile Recharge' },
  { name: 'ShoppingBag', label: 'Shopping' },
  { name: 'ShoppingCart', label: 'Supermarket' },
  { name: 'Gift', label: 'Gift / Presents' },
  { name: 'Shirt', label: 'Clothing' },
  { name: 'Film', label: 'Movies & OTT' },
  { name: 'Gamepad2', label: 'Gaming' },
  { name: 'Music', label: 'Music & Audio' },
  { name: 'BookOpen', label: 'Education / Books' },
  { name: 'HeartPulse', label: 'Healthcare' },
  { name: 'Dumbbell', label: 'Gym / Fitness' },
  { name: 'Briefcase', label: 'Salary / Job' },
  { name: 'Laptop', label: 'Tech / Work' },
  { name: 'Wallet', label: 'Cash / Wallet' },
  { name: 'Coins', label: 'Coins' },
  { name: 'TrendingUp', label: 'Investment / Stocks' },
  { name: 'PiggyBank', label: 'Savings' },
  { name: 'Sparkles', label: 'Special' },
  { name: 'Star', label: 'Favorites' },
  { name: 'Users', label: 'Family / Friends' },
  { name: 'Tag', label: 'General / Tag' },
];

export const COLOR_PRESETS = [
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#0ea5e9', // Blue
  '#eab308', // Amber
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#64748b', // Slate
];

export const PAYMENT_METHODS = [
  'Bank / UPI',
  'Cash',
  'Credit Card',
];

// Custom categories loaded from Supabase (see fetchCustomCategoriesFromDb)
let customCategories: CategoryMeta[] = [];

export function setCustomCategories(list: CategoryMeta[]) {
  customCategories = list;
}

// Only the user's own categories (defaults excluded), for the manage screen
export function getCustomCategories(): CategoryMeta[] {
  const defaultNames = new Set(DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase()));
  return customCategories.filter((c) => !defaultNames.has(c.name.toLowerCase()));
}

export function getAllCategories(): CategoryMeta[] {
  // Merge without duplicates
  const existingNames = new Set(DEFAULT_CATEGORIES.map((c) => c.name.toLowerCase()));
  const customUnique = customCategories.filter((c) => !existingNames.has(c.name.toLowerCase()));
  return [...DEFAULT_CATEGORIES, ...customUnique];
}

export function formatCurrency(amount: number, _currency?: string): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}
