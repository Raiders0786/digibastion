-- lovable-cron-fallback-reviewed: real-time alerts batch every record ingested since the last run and dedupe through email_sends, so a half-hour poll (five minutes after each QuillMonitor sync, after the Telegram post) is the fallback; the clean-up is a daily SQL statement with no HTTP call.

-- Real-time alerts move from hourly to every 30 minutes (48 runs a day).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN ('send-critical-alerts-hourly', 'send-critical-alerts-30min');

SELECT cron.schedule('send-critical-alerts-30min', '25,55 * * * *', $$
  SELECT public.record_cron_http_request(
    'send-critical-alerts-30min',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/send-critical-alerts',
    '{}'::jsonb,
    150000
  );
$$);

-- Sign-ups that never confirmed their address are removed after 7 days,
-- unless a fresh verification link is still valid.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'cleanup-unverified-subscriptions';

SELECT cron.schedule('cleanup-unverified-subscriptions', '40 3 * * *', $$
  DELETE FROM public.subscriptions
  WHERE is_verified = false
    AND created_at < now() - interval '7 days'
    AND (verification_token_expires_at IS NULL OR verification_token_expires_at < now());
$$);
