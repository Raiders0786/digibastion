-- Enable RLS on email_analytics_daily view
-- Note: This is a view, so we need to check if RLS can be applied
-- Views inherit RLS from underlying tables, but we can add security at the function level

-- Create a table for quiz sessions to validate score submissions
CREATE TABLE IF NOT EXISTS public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL UNIQUE,
  question_ids INTEGER[] NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  ip_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 minutes')
);

-- Enable RLS on quiz_sessions
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Service role only access for quiz_sessions
CREATE POLICY "Service role only for quiz sessions"
ON public.quiz_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Block all public access
CREATE POLICY "Block public access to quiz sessions"
ON public.quiz_sessions
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- Create index for session lookup
CREATE INDEX idx_quiz_sessions_token ON public.quiz_sessions (session_token);
CREATE INDEX idx_quiz_sessions_expires ON public.quiz_sessions (expires_at);

-- Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_quiz_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.quiz_sessions 
  WHERE expires_at < now();
END;
$$;