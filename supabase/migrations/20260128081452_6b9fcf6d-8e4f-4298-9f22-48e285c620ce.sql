-- Step 1: Drop the problematic RLS policy that causes infinite recursion
DROP POLICY IF EXISTS "Public can view top leaderboard scores" ON public.quiz_scores;

-- Step 2: Create a security definer function that bypasses RLS to get top score IDs
CREATE OR REPLACE FUNCTION public.get_top_leaderboard_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.quiz_scores
  ORDER BY score DESC, created_at DESC
  LIMIT 100;
$$;

-- Step 3: Create new RLS policy using the function (no recursion)
CREATE POLICY "Public can view top 100 scores"
ON public.quiz_scores
FOR SELECT
USING (id IN (SELECT public.get_top_leaderboard_ids()));