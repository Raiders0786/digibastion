
-- Reschedule fetch-web3-incidents and summarize-article cron jobs to use
-- CRON_SECRET (via get_cron_auth_headers) instead of the anon key, so they
-- pass the new edge-function auth gate.

SELECT cron.unschedule('fetch-web3-incidents-6hourly');
SELECT cron.unschedule('summarize-articles-6hourly');

SELECT cron.schedule(
  'fetch-web3-incidents-6hourly',
  '30 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/fetch-web3-incidents',
    headers := public.get_cron_auth_headers(),
    body := '{"source": "cron"}'::jsonb,
    timeout_milliseconds := 120000
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'summarize-articles-6hourly',
  '45 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/summarize-article',
    headers := public.get_cron_auth_headers(),
    body := '{"limit": 20}'::jsonb,
    timeout_milliseconds := 180000
  ) AS request_id;
  $$
);
