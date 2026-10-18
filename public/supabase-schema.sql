-- ==============================================================================
-- EXPENSE TRACKER - SUPABASE DATABASE SCHEMA (CLEAN - NO MOCK DATA)
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

-- 1. Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income')),
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    payee VARCHAR(255),
    notes TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payee VARCHAR(255);

-- 2. Create budgets table
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    category VARCHAR(50) NOT NULL,
    monthly_limit NUMERIC(12, 2) NOT NULL CHECK (monthly_limit > 0),
    month VARCHAR(7) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_category_month UNIQUE (user_id, category, month)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses (type);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses (category);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses (user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets (user_id, month);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for Expenses
DROP POLICY IF EXISTS "Expenses select policy" ON public.expenses;
CREATE POLICY "Expenses select policy" ON public.expenses FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Expenses insert policy" ON public.expenses;
CREATE POLICY "Expenses insert policy" ON public.expenses FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Expenses update policy" ON public.expenses;
CREATE POLICY "Expenses update policy" ON public.expenses FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Expenses delete policy" ON public.expenses;
CREATE POLICY "Expenses delete policy" ON public.expenses FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 6. RLS Policies for Budgets
DROP POLICY IF EXISTS "Budgets select policy" ON public.budgets;
CREATE POLICY "Budgets select policy" ON public.budgets FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Budgets insert policy" ON public.budgets;
CREATE POLICY "Budgets insert policy" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Budgets update policy" ON public.budgets;
CREATE POLICY "Budgets update policy" ON public.budgets FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Budgets delete policy" ON public.budgets;
CREATE POLICY "Budgets delete policy" ON public.budgets FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 7. Realtime setup
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'expenses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
    END IF;
END $$;

-- 8. Custom categories (synced across devices)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('expense', 'income', 'both')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- One category per name (case-insensitive) per owner; COALESCE so NULL owners collide too
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_owner_name
    ON public.categories (COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories select policy" ON public.categories;
CREATE POLICY "Categories select policy" ON public.categories
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Categories insert policy" ON public.categories;
CREATE POLICY "Categories insert policy" ON public.categories
FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Categories update policy" ON public.categories;
CREATE POLICY "Categories update policy" ON public.categories
FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Categories delete policy" ON public.categories;
CREATE POLICY "Categories delete policy" ON public.categories
FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
