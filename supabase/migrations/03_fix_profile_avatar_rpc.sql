-- Migration 03: Add RPC to update profile avatar bypassing RLS
-- This allows users without a direct Supabase Auth session (fallback login) to update their own avatar

CREATE OR REPLACE FUNCTION public.update_my_avatar(
  p_user_id TEXT,
  p_avatar_url TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.profiles
  SET avatar_url = p_avatar_url, updated_at = NOW()
  WHERE id = p_user_id;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
