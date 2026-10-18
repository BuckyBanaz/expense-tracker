-- ==============================================================================
-- CUSTOM CATEGORIES (synced across devices)
-- Run once in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ==============================================================================

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
