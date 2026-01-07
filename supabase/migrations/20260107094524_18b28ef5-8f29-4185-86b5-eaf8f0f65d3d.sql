-- Fix quiz_scores RLS policy - change from RESTRICTIVE to PERMISSIVE for SELECT
-- Drop the current restrictive SELECT policy
DROP POLICY IF EXISTS "Public can view quiz scores for leaderboard" ON public.quiz_scores;

-- Create a PERMISSIVE SELECT policy so leaderboard can read data
CREATE POLICY "Public can view quiz scores for leaderboard"
ON public.quiz_scores
FOR SELECT
TO public
USING (true);

-- Also need to fix the INSERT/DELETE policies to be service-role only properly
-- Currently they use RESTRICTIVE which won't work correctly
DROP POLICY IF EXISTS "Only service role can insert quiz scores" ON public.quiz_scores;
DROP POLICY IF EXISTS "Only service role can delete quiz scores" ON public.quiz_scores;
DROP POLICY IF EXISTS "No updates to quiz scores" ON public.quiz_scores;

-- Service role bypasses RLS anyway, so we just need to block anon/authenticated
-- For service-role operations, we don't need explicit policies (service role bypasses RLS)
-- We just need to ensure public users cannot insert/update/delete
CREATE POLICY "Block public insert on quiz_scores"
ON public.quiz_scores
FOR INSERT
TO public
WITH CHECK (false);

CREATE POLICY "Block public update on quiz_scores"
ON public.quiz_scores
FOR UPDATE
TO public
USING (false);

CREATE POLICY "Block public delete on quiz_scores"
ON public.quiz_scores
FOR DELETE
TO public
USING (false);