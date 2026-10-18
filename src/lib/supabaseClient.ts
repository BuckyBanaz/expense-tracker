import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ExpenseItem, CategoryBudget, CategoryMeta } from '@/types/expense';
import { setCustomCategories } from '@/lib/currencies';

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const DEFAULT_SUPABASE_URL =
  (envUrl && envUrl.startsWith('https://') && !envUrl.startsWith('sb_'))
    ? envUrl
    : 'https://fmwppzwuotupebtdiszv.supabase.co';

const envKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim();
const DEFAULT_SUPABASE_ANON_KEY =
  (envKey && (envKey.startsWith('sb_') || envKey.startsWith('eyJ')))
    ? envKey
    : 'sb_publishable_DLEQZS7p9oTSvqaeyLXaGA_JtKpscPd';

const DEFAULT_PIN = '1234';

// Supabase is the only store for app data. These keys held per-browser copies in
// older versions; they are removed on load so stale data can never resurface.
const LEGACY_STORAGE_KEYS = [
  'expensee_supabase_url',
  'expensee_supabase_key',
  'expensee_local_expenses',
  'expensee_local_budgets',
  'expensee_pending_expenses',
  'expensee_legacy_synced',
  'spendwise_app_pin',
];

if (typeof window !== 'undefined') {
  try {
    LEGACY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Storage can be unavailable (private mode); nothing to clean then
  }
}

// CLEAN STATE: Zero mock data
export const INITIAL_DEMO_EXPENSES: ExpenseItem[] = [];
export const INITIAL_DEMO_BUDGETS: CategoryBudget[] = [];

let cachedClient: SupabaseClient | null = null;

// Last cloud failure, surfaced in the UI so nothing fails silently
let lastSyncError: string | null = null;

export function getLastSyncError(): string | null {
  return lastSyncError;
}

function setSyncError(context: string, message?: string | null) {
  lastSyncError = `${context}: ${message || 'unknown error'}`;
  console.warn(lastSyncError);
}

export function getActiveSupabaseCredentials(): { url: string; key: string } {
  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_ANON_KEY,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getActiveSupabaseCredentials();
  return Boolean(url && key && url.startsWith('https://') && key.length > 20);
}

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const { url, key } = getActiveSupabaseCredentials();
  if (!isSupabaseConfigured()) return null;

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

function requireClient(): SupabaseClient {
  const client = getSupabase();
  if (!client) {
    const msg = 'Supabase is not configured';
    setSyncError('Cloud unavailable', msg);
    throw new Error(msg);
  }
  return client;
}

export function sortExpensesRecentFirst(items: ExpenseItem[]): ExpenseItem[] {
  return [...items].sort((a, b) => {
    // 1. Compare date first (YYYY-MM-DD descending)
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    // 2. If same date, newest created_at timestamp first
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });
}

// ---------------- CRUD API FOR EXPENSES ----------------
type FetchExpensesResult = { data: ExpenseItem[]; isSupabase: boolean; error?: string };

export async function fetchExpensesFromDb(user?: User | null): Promise<FetchExpensesResult> {
  const client = getSupabase();
  if (!client) {
    setSyncError('Cloud unavailable', 'Supabase is not configured');
    return { data: [], isSupabase: false, error: lastSyncError ?? undefined };
  }

  try {
    let query = client
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (user?.id) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) {
      setSyncError('Could not load transactions', error.message);
      return { data: [], isSupabase: false, error: error.message };
    }

    lastSyncError = null;
    return { data: sortExpensesRecentFirst((data as ExpenseItem[]) || []), isSupabase: true };
  } catch (err: any) {
    setSyncError('Could not load transactions', err?.message);
    return { data: [], isSupabase: false, error: err?.message };
  }
}

// Throws if the cloud save fails, so the caller can tell the user instead of
// pretending the entry was saved
export async function addExpenseToDb(item: Omit<ExpenseItem, 'id'>, user?: User | null): Promise<ExpenseItem> {
  const client = requireClient();
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

  if (error || !data) {
    setSyncError('Save failed', error?.message);
    throw new Error(error?.message || 'Save failed');
  }
  return data as ExpenseItem;
}

export async function updateExpenseInDb(id: string, updates: Partial<ExpenseItem>): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  const { error } = await client.from('expenses').update(updates).eq('id', id);
  if (error) {
    setSyncError('Update failed', error.message);
    return false;
  }
  return true;
}

export async function deleteExpenseFromDb(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    const { error } = await client.from('expenses').delete().eq('id', id);
    if (error) {
      setSyncError('Delete failed', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    setSyncError('Delete failed', e?.message);
    return false;
  }
}

// ---------------- CRUD API FOR BUDGETS ----------------
// Returns null when the cloud can't be reached, so callers keep what they show
export async function fetchBudgetsFromDb(month: string, user?: User | null): Promise<CategoryBudget[] | null> {
  const client = getSupabase();
  if (!client) return null;

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
      setSyncError('Could not load budgets', error.message);
      return null;
    }
    return (data as CategoryBudget[]) || [];
  } catch (err: any) {
    setSyncError('Could not load budgets', err?.message);
    return null;
  }
}

// Throws if the cloud save fails
export async function upsertBudgetInDb(budget: CategoryBudget, user?: User | null): Promise<CategoryBudget> {
  const client = requireClient();

  // Postgres treats NULL user_ids as distinct, so the (user_id, category, month)
  // unique constraint never fires for signed-out use and an upsert would insert
  // a duplicate. Update the existing row(s) explicitly, insert only if none.
  let update = client
    .from('budgets')
    .update({ monthly_limit: budget.monthly_limit })
    .eq('category', budget.category)
    .eq('month', budget.month);
  update = user?.id ? update.eq('user_id', user.id) : update.is('user_id', null);
  const { data: updated, error: updateErr } = await update.select();

  const { data, error } = updateErr
    ? { data: null, error: updateErr }
    : updated && updated.length > 0
      ? { data: updated[updated.length - 1], error: null }
      : await client
          .from('budgets')
          .insert([{
            category: budget.category,
            monthly_limit: budget.monthly_limit,
            month: budget.month,
            user_id: user?.id || null,
          }])
          .select()
          .single();

  if (error || !data) {
    setSyncError('Budget save failed', error?.message);
    throw new Error(error?.message || 'Budget save failed');
  }
  return data as CategoryBudget;
}

export async function deleteBudgetFromDb(budget: CategoryBudget): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  try {
    // Delete by category + month so older duplicate rows go too
    const { error } = await client
      .from('budgets')
      .delete()
      .eq('category', budget.category)
      .eq('month', budget.month);
    if (error) {
      setSyncError('Budget delete failed', error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    setSyncError('Budget delete failed', e?.message);
    return false;
  }
}

export async function clearAllData(): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  try {
    await client.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch (e) {
    console.warn('Could not clear Supabase expenses:', e);
  }
  try {
    await client.from('budgets').delete().neq('category', '__APP_PIN__');
  } catch (e) {
    console.warn('Could not clear Supabase budgets:', e);
  }
}

// ---------------- CUSTOM CATEGORIES ----------------
// Custom categories used to live only in this browser's localStorage
const LEGACY_CATEGORIES_KEY = 'spendwise_custom_categories';

function readLegacyCategories(): CategoryMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_CATEGORIES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toCategoryMeta(row: any): CategoryMeta {
  return {
    name: row.name,
    color: row.color,
    bgLight: `${row.color}1f`,
    icon: row.icon,
    type: row.type,
  };
}

async function writeCategory(client: SupabaseClient, category: CategoryMeta) {
  const fields = { color: category.color, icon: category.icon, type: category.type };
  const { data: updated, error: updateErr } = await client
    .from('categories')
    .update(fields)
    .ilike('name', category.name.replace(/[\\%_]/g, '\\$&'))
    .is('user_id', null)
    .select();
  if (updateErr) return updateErr;
  if (updated && updated.length > 0) return null;
  const { error } = await client
    .from('categories')
    .insert([{ name: category.name, ...fields, user_id: null }]);
  return error;
}

// Loads custom categories into the shared cache read by getAllCategories().
// Categories still sitting in this browser's localStorage are uploaded once.
export async function fetchCustomCategoriesFromDb(): Promise<CategoryMeta[]> {
  const client = getSupabase();
  const legacy = readLegacyCategories();
  if (!client) {
    setCustomCategories(legacy);
    return legacy;
  }

  try {
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      // Table not created yet: keep showing this browser's old categories until it is
      setSyncError('Could not load categories', error.message);
      setCustomCategories(legacy);
      return legacy;
    }

    let cloud = (data || []).map(toCategoryMeta);
    const cloudNames = new Set(cloud.map((c) => c.name.toLowerCase()));
    const toUpload = legacy.filter((c) => c?.name && !cloudNames.has(c.name.toLowerCase()));
    let uploadFailed = false;
    for (const cat of toUpload) {
      const err = await writeCategory(client, cat);
      if (err) {
        uploadFailed = true;
        setSyncError('Category upload failed', err.message);
      } else {
        cloud = [...cloud, cat];
      }
    }
    if (!uploadFailed && legacy.length > 0 && typeof window !== 'undefined') {
      localStorage.removeItem(LEGACY_CATEGORIES_KEY);
    }

    setCustomCategories(cloud);
    return cloud;
  } catch (e: any) {
    setSyncError('Could not load categories', e?.message);
    setCustomCategories(legacy);
    return legacy;
  }
}

// Throws if the cloud save fails
export async function saveCustomCategoryToDb(category: CategoryMeta): Promise<void> {
  const client = requireClient();
  const error = await writeCategory(client, category);
  if (error) {
    setSyncError('Category save failed', error.message);
    throw new Error(error.message);
  }
  await fetchCustomCategoriesFromDb();
}

// ---------------- CLOUD APP CONFIG / PIN API ----------------
// Returns the cloud PIN (DEFAULT_PIN when none has been set yet), or null when the
// cloud can't be reached, so the lock screen never guesses a PIN
export async function fetchAppPinFromDb(): Promise<string | null> {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('budgets')
      .select('monthly_limit')
      .eq('category', '__APP_PIN__')
      .eq('month', '9999-12')
      .limit(1);

    if (error) {
      setSyncError('PIN fetch failed', error.message);
      return null;
    }
    if (data && data.length > 0) {
      return String(Math.floor(Number(data[0].monthly_limit))).padStart(4, '0');
    }
    return DEFAULT_PIN;
  } catch (e: any) {
    setSyncError('PIN fetch failed', e?.message);
    return null;
  }
}

export async function saveAppPinToDb(newPin: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  try {
    const pinNum = parseInt(newPin, 10);
    if (isNaN(pinNum)) return false;

    const { data, error: selectErr } = await client
      .from('budgets')
      .select('id')
      .eq('category', '__APP_PIN__')
      .eq('month', '9999-12')
      .limit(1);
    if (selectErr) {
      setSyncError('PIN save failed', selectErr.message);
      return false;
    }

    const { error: writeErr } = data && data.length > 0
      ? await client
          .from('budgets')
          .update({ monthly_limit: pinNum })
          .eq('id', data[0].id)
      : await client
          .from('budgets')
          .insert([{
            category: '__APP_PIN__',
            monthly_limit: pinNum,
            month: '9999-12',
            user_id: null,
          }]);
    if (writeErr) {
      setSyncError('PIN save failed', writeErr.message);
      return false;
    }
    return true;
  } catch (e: any) {
    setSyncError('PIN save failed', e?.message);
    return false;
  }
}
