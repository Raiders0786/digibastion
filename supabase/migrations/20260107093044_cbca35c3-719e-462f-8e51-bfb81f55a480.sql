-- Clean up old permissive INSERT policy on quiz_scores
DROP POLICY IF EXISTS "Anyone can submit quiz scores" ON public.quiz_scores;

-- Also ensure no other legacy policies exist
DROP POLICY IF EXISTS "Anyone can submit scores" ON public.quiz_scores;