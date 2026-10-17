import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ExpenseItem, CategoryBudget } from '@/types/expense';

const DEFAULT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const DEFAULT_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

const STORAGE_KEY_URL = 'expensee_supabase_url';
const STORAGE_KEY_KEY = 'expensee_supabase_key';
const STORAGE_KEY_LOCAL_DATA = 'expensee_local_expenses';
const STORAGE_KEY_LOCAL_BUDGETS = 'expensee_local_budgets';

// CLEAN STATE: Zero mock data
export const INITIAL_DEMO_EXPENSES: ExpenseItem[] = [];
export const INITIAL_DEMO_BUDGETS: CategoryBudget[] = [];

let cachedClient: SupabaseClient | null = null;
let currentConfigString = '';

export function getActiveSupabaseCredentials(): { url: string; key: string } {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_KEY_URL);
    const customKey = localStorage.getItem(STORAGE_KEY_KEY);
    if (customUrl && customKey) {
      return { url: customUrl.trim(), key: customKey.trim() };
    }
  }
  return {
    url: (DEFAULT_SUPABASE_URL || '').trim(),
    key: (DEFAULT_SUPABASE_ANON_KEY || '').trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getActiveSupabaseCredentials();
  return Boolean(
    url && 
    key && 
    url.startsWith('https://') && 
    !url.includes('your-project-id') &&
    key.length > 20
  );
}

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getActiveSupabaseCredentials();
  if (!url || !key || !url.startsWith('https://')) {
    return null;
  }

  const configString = `${url}:${key}`;
  if (cachedClient && currentConfigString === configString) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigString = configString;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function saveCustomSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, key.trim());
    cachedClient = null;
    currentConfigString = '';
  }
}

export function clearCustomSupabaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
    cachedClient = null;
    currentConfigString = '';
  }
}

// ---------------- LOCAL STORAGE FALLBACK HELPERS ----------------
function getLocalExpenses(): ExpenseItem[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_LOCAL_DATA);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    // Filter out old demo items if any existed
    if (Array.isArray(parsed)) {
      const clean = parsed.filter((item: any) => !String(item.id).startsWith('demo-'));
      return clean;
    }
    return [];
  } catch {
    return [];
  }
}

function saveLocalExpenses(items: ExpenseItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LOCAL_DATA, JSON.stringify(items));
  }
}

function getLocalBudgets(): CategoryBudget[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY_LOCAL_BUDGETS);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalBudgets(budgets: CategoryBudget[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_LOCAL_BUDGETS, JSON.stringify(budgets));
  }
}

// ---------------- CRUD API FOR EXPENSES ----------------
export async function fetchExpensesFromDb(user?: User | null): Promise<{ data: ExpenseItem[]; isSupabase: boolean; error?: string }> {
  const client = getSupabase();
  if (!client || !isSupabaseConfigured()) {
    return { data: getLocalExpenses(), isSupabase: false };
  }

  try {
    let query = client
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (user?.id) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase fetch failed, falling back to clean local storage:', error.message);
      return { data: getLocalExpenses(), isSupabase: false, error: error.message };
    }

    return { data: (data as ExpenseItem[]) || [], isSupabase: true };
  } catch (err: any) {
    console.warn('Error querying Supabase:', err);
    return { data: getLocalExpenses(), isSupabase: false, error: err?.message };
  }
}

export async function addExpenseToDb(item: Omit<ExpenseItem, 'id'>, user?: User | null): Promise<ExpenseItem> {
  const client = getSupabase();
  const newItem: ExpenseItem = {
    ...item,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'exp-' + Date.now(),
    payee: item.payee || null,
    user_id: user?.id || null,
  };

  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('expenses')
        .insert([{
          title: item.title,
          amount: item.amount,
          type: item.type,
          category: item.category,
          date: item.date,
          payment_method: item.payment_method,
          payee: item.payee || null,
          notes: item.notes || null,
          user_id: user?.id || null,
        }])
        .select()
        .single();

      if (!error && data) {
        return data as ExpenseItem;
      }
      console.warn('Supabase insert failed, saving locally:', error?.message);
    } catch (e) {
      console.warn('Supabase error inserting:', e);
    }
  }

  // Fallback to local storage
  const current = getLocalExpenses();
  const updated = [newItem, ...current];
  saveLocalExpenses(updated);
  return newItem;
}

export async function updateExpenseInDb(id: string, updates: Partial<ExpenseItem>): Promise<boolean> {
  const client = getSupabase();
  if (client && isSupabaseConfigured()) {
    try {
      const { error } = await client
        .from('expenses')
        .update(updates)
        .eq('id', id);

      if (!error) return true;
    } catch (e) {
      console.warn('Supabase error updating:', e);
    }
  }

  const current = getLocalExpenses();
  const index = current.findIndex((item) => item.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    saveLocalExpenses(current);
    return true;
  }
  return false;
}

export async function deleteExpenseFromDb(id: string): Promise<boolean> {
  const client = getSupabase();
  if (client && isSupabaseConfigured()) {
    try {
      const { error } = await client
        .from('expenses')
        .delete()
        .eq('id', id);

      if (!error) return true;
    } catch (e) {
      console.warn('Supabase error deleting:', e);
    }
  }

  const current = getLocalExpenses();
  const filtered = current.filter((item) => item.id !== id);
  saveLocalExpenses(filtered);
  return true;
}

// ---------------- CRUD API FOR BUDGETS ----------------
export async function fetchBudgetsFromDb(month: string, user?: User | null): Promise<CategoryBudget[]> {
  const client = getSupabase();
  if (!client || !isSupabaseConfigured()) {
    const local = getLocalBudgets();
    return local.filter((b) => b.month === month);
  }

  try {
    let query = client
      .from('budgets')
      .select('*')
      .eq('month', month);

    if (user?.id) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching budgets from Supabase:', error.message);
      const local = getLocalBudgets();
      return local.filter((b) => b.month === month);
    }

    return (data as CategoryBudget[]) || [];
  } catch (err) {
    console.warn('Supabase budgets query error:', err);
    const local = getLocalBudgets();
    return local.filter((b) => b.month === month);
  }
}

export async function upsertBudgetInDb(budget: CategoryBudget, user?: User | null): Promise<CategoryBudget> {
  const client = getSupabase();
  const toSave: CategoryBudget = {
    ...budget,
    user_id: user?.id || null,
  };

  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('budgets')
        .upsert([{
          category: budget.category,
          monthly_limit: budget.monthly_limit,
          month: budget.month,
          user_id: user?.id || null,
        }], {
          onConflict: 'user_id,category,month',
        })
        .select()
        .single();

      if (!error && data) {
        return data as CategoryBudget;
      }
      console.warn('Supabase upsert budget failed:', error?.message);
    } catch (err) {
      console.warn('Supabase budget upsert error:', err);
    }
  }

  // Fallback to local storage
  const current = getLocalBudgets();
  const idx = current.findIndex(
    (b) => b.category === budget.category && b.month === budget.month
  );
  if (idx >= 0) {
    current[idx] = toSave;
  } else {
    current.push(toSave);
  }
  saveLocalBudgets(current);
  return toSave;
}

export async function clearAllData(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_LOCAL_DATA);
    localStorage.removeItem(STORAGE_KEY_LOCAL_BUDGETS);
    localStorage.setItem(STORAGE_KEY_LOCAL_DATA, '[]');
    localStorage.setItem(STORAGE_KEY_LOCAL_BUDGETS, '[]');
  }

  const client = getSupabase();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('Could not clear Supabase expenses:', e);
    }
    try {
      await client.from('budgets').delete().neq('month', '__never__');
    } catch (e) {
      console.warn('Could not clear Supabase budgets:', e);
    }
  }
}
