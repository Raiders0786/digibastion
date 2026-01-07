-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cleanup job to run daily at midnight UTC
SELECT cron.schedule(
  'cleanup-quiz-submission-logs', -- job name
  '0 0 * * *', -- daily at midnight UTC
  $$SELECT public.cleanup_old_submission_logs()$$
);