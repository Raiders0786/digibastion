-- Create table to store anonymous quiz scores
CREATE TABLE public.quiz_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 8),
  badge_count INTEGER NOT NULL DEFAULT 0,
  character_rank TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_scores ENABLE ROW LEVEL SECURITY;

-- Anyone can view leaderboard
CREATE POLICY "Anyone can view quiz scores"
ON public.quiz_scores
FOR SELECT
USING (true);

-- Anyone can insert their score (anonymous)
CREATE POLICY "Anyone can submit quiz scores"
ON public.quiz_scores
FOR INSERT
WITH CHECK (true);

-- Create index for leaderboard queries
CREATE INDEX idx_quiz_scores_leaderboard ON public.quiz_scores (score DESC, badge_count DESC, created_at ASC);