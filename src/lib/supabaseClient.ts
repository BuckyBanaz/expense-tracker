import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { ExpenseItem, CategoryBudget } from '@/types/expense';

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

const STORAGE_KEY_URL = 'expensee_supabase_url';
const STORAGE_KEY_KEY = 'expensee_supabase_key';
const STORAGE_KEY_LOCAL_DATA = 'expensee_local_expenses';
const STORAGE_KEY_LOCAL_BUDGETS = 'expensee_local_budgets';
// Expenses that failed to save to the cloud and still need uploading
const STORAGE_KEY_PENDING = 'expensee_pending_expenses';
// Set once this browser's pre-cloud local data has been uploaded
const STORAGE_KEY_LEGACY_SYNCED = 'expensee_legacy_synced';

// CLEAN STATE: Zero mock data
export const INITIAL_DEMO_EXPENSES: ExpenseItem[] = [];
export const INITIAL_DEMO_BUDGETS: CategoryBudget[] = [];

let cachedClient: SupabaseClient | null = null;
let currentConfigString = '';

// Last cloud sync failure, surfaced in the UI so local-only fallbacks are never silent
let lastSyncError: string | null = null;

export function getLastSyncError(): string | null {
  return lastSyncError;
}

function setSyncError(context: string, message?: string | null) {
  lastSyncError = `${context}: ${message || 'unknown error'}`;
  console.warn(lastSyncError);
}

export function getActiveSupabaseCredentials(): { url: string; key: string } {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(STORAGE_KEY_URL)?.trim();
    const customKey = localStorage.getItem(STORAGE_KEY_KEY)?.trim();
    if (
      customUrl &&
      customKey &&
      customUrl.startsWith('https://') &&
      !customUrl.includes('your-project-id') &&
      !customUrl.startsWith('sb_') &&
      customKey.length > 20
    ) {
      return { url: customUrl, key: customKey };
    }
  }
  return {
    url: DEFAULT_SUPABASE_URL,
    key: DEFAULT_SUPABASE_ANON_KEY,
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

const isUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

function newUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getPendingExpenses(): ExpenseItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY_PENDING) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePendingExpenses(items: ExpenseItem[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_PENDING, JSON.stringify(items));
  }
}

function toExpenseRow(item: ExpenseItem, user?: User | null) {
  return {
    id: item.id,
    title: item.title,
    amount: item.amount,
    type: item.type,
    category: item.category,
    date: item.date,
    payment_method: item.payment_method,
    payee: item.payee || null,
    notes: item.notes || null,
    user_id: item.user_id || user?.id || null,
  };
}

// ---------------- CRUD API FOR EXPENSES ----------------
type FetchExpensesResult = { data: ExpenseItem[]; isSupabase: boolean; error?: string };

let syncRunning: Promise<FetchExpensesResult> | null = null;
let syncQueued: Promise<FetchExpensesResult> | null = null;

// Mount, month change and realtime events all call this, often at the same time.
// Overlapping runs would upload the same local items twice, so only one runs at a
// time; a call made during a run gets one fresh run after it.
export function fetchExpensesFromDb(user?: User | null): Promise<FetchExpensesResult> {
  if (!syncRunning) {
    syncRunning = syncExpenses(user).finally(() => {
      syncRunning = null;
    });
    return syncRunning;
  }
  if (!syncQueued) {
    syncQueued = syncRunning.then(() => {
      syncQueued = null;
      return fetchExpensesFromDb(user);
    });
  }
  return syncQueued;
}

async function syncExpenses(user?: User | null): Promise<FetchExpensesResult> {
  const client = getSupabase();
  if (!client || !isSupabaseConfigured()) {
    setSyncError('Supabase not configured', `invalid URL "${getActiveSupabaseCredentials().url.slice(0, 20)}"`);
    return { data: getLocalExpenses(), isSupabase: false, error: lastSyncError ?? undefined };
  }

  const selectAll = () => {
    let query = client
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (user?.id) {
      query = query.or(`user_id.eq.${user.id},user_id.is.null`);
    }
    return query;
  };

  try {
    const { data, error } = await selectAll();
    if (error) {
      setSyncError('Fetch failed', error.message);
      return { data: getLocalExpenses(), isSupabase: false, error: error.message };
    }

    let supabaseExpenses = (data as ExpenseItem[]) || [];
    const cloudIds = new Set(supabaseExpenses.map((e) => e.id));

    // Upload only items that explicitly failed to save, plus (once per browser) data
    // entered before cloud sync worked. Never diff the whole local cache, or items
    // deleted on another device would be re-uploaded.
    const toUpload = getPendingExpenses().filter((p) => !cloudIds.has(p.id));
    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY_LEGACY_SYNCED)) {
      for (const loc of getLocalExpenses()) {
        const inCloud = supabaseExpenses.some((sub) =>
          sub.id === loc.id ||
          (sub.title === loc.title &&
            Math.abs(Number(sub.amount) - Number(loc.amount)) < 0.001 &&
            sub.date === loc.date &&
            sub.payment_method === loc.payment_method)
        );
        if (!inCloud && !toUpload.some((p) => p.id === loc.id)) {
          toUpload.push(loc);
        }
      }
    }

    if (toUpload.length > 0) {
      // Stable UUIDs make the upload idempotent: re-sending an item can never duplicate it
      const rows = toUpload.map((item) => toExpenseRow({ ...item, id: isUUID(item.id) ? item.id : newUUID() }, user));
      const upload = (batch: typeof rows) =>
        client.from('expenses').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

      const failed: ExpenseItem[] = [];
      let lastError: string | null = null;
      const { error: batchErr } = await upload(rows);
      if (batchErr) {
        // One bad row fails the whole statement; retry individually so the rest get through
        for (const row of rows) {
          const { error: rowErr } = await upload([row]);
          if (rowErr) {
            failed.push(row as ExpenseItem);
            lastError = rowErr.message;
          }
        }
      }

      savePendingExpenses(failed);
      if (failed.length > 0) {
        setSyncError(`Upload of ${failed.length} local item(s) failed`, lastError);
      }

      const { data: refreshed, error: refreshErr } = await selectAll();
      if (refreshErr) {
        setSyncError('Fetch failed', refreshErr.message);
        return { data: getLocalExpenses(), isSupabase: false, error: refreshErr.message };
      }
      supabaseExpenses = (refreshed as ExpenseItem[]) || [];
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LEGACY_SYNCED, '1');
    }

    // Keep local cache synced with Supabase for fast load and offline resilience
    saveLocalExpenses(supabaseExpenses);
    if (getPendingExpenses().length === 0) {
      lastSyncError = null;
      return { data: supabaseExpenses, isSupabase: true };
    }
    return { data: supabaseExpenses, isSupabase: true, error: lastSyncError ?? undefined };
  } catch (err: any) {
    setSyncError('Fetch failed', err?.message);
    return { data: getLocalExpenses(), isSupabase: false, error: err?.message };
  }
}

export async function addExpenseToDb(item: Omit<ExpenseItem, 'id'>, user?: User | null): Promise<ExpenseItem> {
  const client = getSupabase();
  const newItem: ExpenseItem = {
    ...item,
    id: newUUID(),
    payee: item.payee || null,
    user_id: user?.id || null,
  };

  if (client && isSupabaseConfigured()) {
    try {
      const { data, error } = await client
        .from('expenses')
        .insert([toExpenseRow(newItem, user)])
        .select()
        .single();

      if (!error && data) {
        const saved = data as ExpenseItem;
        const current = getLocalExpenses();
        saveLocalExpenses([saved, ...current.filter((x) => x.id !== saved.id)]);
        return saved;
      }
      setSyncError('Save failed (kept on this device only)', error?.message);
    } catch (e: any) {
      setSyncError('Save failed (kept on this device only)', e?.message);
    }
  }

  // Fallback to local storage, queued for upload on the next successful sync
  saveLocalExpenses([newItem, ...getLocalExpenses()]);
  savePendingExpenses([newItem, ...getPendingExpenses()]);
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

      if (!error) {
        const current = getLocalExpenses();
        const index = current.findIndex((item) => item.id === id);
        if (index !== -1) {
          current[index] = { ...current[index], ...updates };
          saveLocalExpenses(current);
        }
        return true;
      }
    } catch (e) {
      console.warn('Supabase error updating:', e);
    }
  }

  savePendingExpenses(getPendingExpenses().map((item) => (item.id === id ? { ...item, ...updates } : item)));
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

      if (!error) {
        const current = getLocalExpenses();
        saveLocalExpenses(current.filter((item) => item.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Supabase error deleting:', e);
    }
  }

  savePendingExpenses(getPendingExpenses().filter((item) => item.id !== id));
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

    let supabaseBudgets = (data as CategoryBudget[]) || [];
    const local = getLocalBudgets();
    const localMonthBudgets = local.filter((b) => b.month === month);
    if (localMonthBudgets.length > 0) {
      const unsynced = localMonthBudgets.filter(
        (loc) => !supabaseBudgets.some((sub) => sub.category === loc.category && sub.month === loc.month)
      );
      if (unsynced.length > 0) {
        for (const item of unsynced) {
          await upsertBudgetInDb(item, user);
        }
        const { data: refreshed } = await query;
        if (refreshed) supabaseBudgets = refreshed as CategoryBudget[];
      }
    }

    saveLocalBudgets(supabaseBudgets);
    return supabaseBudgets;
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
        const saved = data as CategoryBudget;
        const current = getLocalBudgets();
        const idx = current.findIndex(
          (b) => b.category === saved.category && b.month === saved.month
        );
        if (idx >= 0) current[idx] = saved;
        else current.push(saved);
        saveLocalBudgets(current);
        return saved;
      }
      setSyncError('Budget save failed', error?.message);
    } catch (err: any) {
      setSyncError('Budget save failed', err?.message);
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

export async function deleteBudgetFromDb(budget: CategoryBudget): Promise<boolean> {
  const client = getSupabase();
  if (client && isSupabaseConfigured()) {
    try {
      let query = client.from('budgets').delete();
      query = budget.id
        ? query.eq('id', budget.id)
        : query.eq('category', budget.category).eq('month', budget.month);
      const { error } = await query;
      if (error) {
        setSyncError('Budget delete failed', error.message);
        return false;
      }
    } catch (e: any) {
      setSyncError('Budget delete failed', e?.message);
      return false;
    }
  }

  saveLocalBudgets(
    getLocalBudgets().filter((b) => !(b.category === budget.category && b.month === budget.month))
  );
  return true;
}

export async function clearAllData(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_LOCAL_DATA);
    localStorage.removeItem(STORAGE_KEY_LOCAL_BUDGETS);
    localStorage.setItem(STORAGE_KEY_LOCAL_DATA, '[]');
    localStorage.setItem(STORAGE_KEY_LOCAL_BUDGETS, '[]');
    localStorage.removeItem(STORAGE_KEY_PENDING);
  }

  const client = getSupabase();
  if (client && isSupabaseConfigured()) {
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
}

// ---------------- CLOUD APP CONFIG / PIN API ----------------
export async function fetchAppPinFromDb(): Promise<string> {
  const localPin = typeof window !== 'undefined' ? localStorage.getItem('spendwise_app_pin') || '1234' : '1234';
  const client = getSupabase();
  if (!client || !isSupabaseConfigured()) {
    return localPin;
  }

  try {
    const { data, error } = await client
      .from('budgets')
      .select('monthly_limit')
      .eq('category', '__APP_PIN__')
      .eq('month', '9999-12')
      .limit(1);

    if (error) {
      setSyncError('PIN fetch failed', error.message);
    } else if (data && data.length > 0) {
      const pinNum = Math.floor(Number(data[0].monthly_limit));
      const pinVal = String(pinNum).padStart(4, '0');
      if (typeof window !== 'undefined') {
        localStorage.setItem('spendwise_app_pin', pinVal);
      }
      return pinVal;
    }
  } catch (e) {
    console.warn('Could not fetch PIN from Supabase:', e);
  }
  return localPin;
}

export async function saveAppPinToDb(newPin: string): Promise<boolean> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('spendwise_app_pin', newPin);
  }
  const client = getSupabase();
  if (!client || !isSupabaseConfigured()) {
    return true;
  }

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
  } catch (e) {
    console.warn('Could not save PIN to Supabase:', e);
    return false;
  }
}

