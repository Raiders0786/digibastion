-- Add rate limiting function for quiz scores queries to prevent bulk scraping
-- This limits the number of rows returned per query to the top 100 scores

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Public can view quiz scores for leaderboard" ON public.quiz_scores;

-- Create a new policy that only allows viewing top 100 scores
-- This prevents bulk data extraction while still supporting the leaderboard feature
CREATE POLICY "Public can view top leaderboard scores" 
ON public.quiz_scores 
FOR SELECT 
USING (
  id IN (
    SELECT id FROM public.quiz_scores 
    ORDER BY score DESC, created_at DESC 
    LIMIT 100
  )
);

-- Add an index to support efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_quiz_scores_leaderboard 
ON public.quiz_scores (score DESC, created_at DESC);