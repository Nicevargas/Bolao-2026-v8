-- Migration 02: Fix RLS policies for bets table
-- Problem: INSERT/UPDATE policies require user_id = auth.uid()::text
-- but the app's login fallback path (profile lookup) does not create
-- a Supabase Auth session, leaving auth.uid() as null.
-- Fix: use profile existence check instead of auth.uid().

-- 1. Drop existing INSERT policy on bets
DROP POLICY IF EXISTS "Users can insert own bets" ON public.bets;

-- 2. Create new INSERT policy that checks if user_id exists in profiles
CREATE POLICY "Users can insert own bets"
ON public.bets FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = user_id)
);

-- 3. Drop existing UPDATE policy on bets
DROP POLICY IF EXISTS "Users can update own bets if unlocked" ON public.bets;

-- 4. Create new UPDATE policy checking profile existence + match unlocked
CREATE POLICY "Users can update own bets if unlocked"
ON public.bets FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = user_id)
  AND EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = bets.match_id AND matches.locked = FALSE
  )
);
