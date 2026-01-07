-- Drop the old check constraint and add a new one for 0-100 scale
ALTER TABLE public.quiz_scores DROP CONSTRAINT IF EXISTS quiz_scores_score_check;
ALTER TABLE public.quiz_scores ADD CONSTRAINT quiz_scores_score_check CHECK (score >= 0 AND score <= 100);