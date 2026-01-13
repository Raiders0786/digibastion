-- Create cron job to fetch web3 incidents every 1.5 hours (90 minutes)
SELECT cron.schedule(
  'fetch-web3-incidents',
  '0 */1 * * *', -- Run every hour at minute 0 (closest to 1.5h with cron limitations)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.edge_function_base_url') || '/fetch-web3-incidents',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
      ),
      body := jsonb_build_object('source', 'cron')
    ) AS request_id;
  $$
);

-- Also add a cron job to run RSS fetch more frequently (every 1.5 hours)
-- First remove existing RSS fetch job if it exists, then recreate
SELECT cron.unschedule('fetch-rss-news') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'fetch-rss-news');

SELECT cron.schedule(
  'fetch-rss-news-frequent',
  '30 */1 * * *', -- Run every hour at minute 30 (offset from web3 to spread load)
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.edge_function_base_url') || '/fetch-rss-news',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('supabase.service_role_key')
      ),
      body := jsonb_build_object('source', 'cron')
    ) AS request_id;
  $$
);