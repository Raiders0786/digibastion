-- lovable-cron-fallback-reviewed: the weekly deep-dive is built once a week after the Monday-to-Sunday UTC week closes; there is no row event to trigger on, and send-newsletters already polls each quarter hour for subscriber local hours.

-- Build the shared weekly deep-dive for the week that just ended (Monday 00:10 UTC).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'build-weekly-newsletter';

SELECT cron.schedule('build-weekly-newsletter', '10 0 * * 1', $$
  SELECT public.record_cron_http_request(
    'build-weekly-newsletter',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/build-weekly-newsletter',
    '{"source":"cron"}'::jsonb,
    240000
  );
$$);
