-- Clean up duplicate cron jobs, keep only the ones we need
SELECT cron.unschedule('fetch-rss-news-frequent');
SELECT cron.unschedule('fetch-web3-incidents');

-- Update fetch-rss-news-hourly to run every 90 minutes (closest cron expression: 0,30 on alternating hours)
-- Since cron doesn't support 90-minute intervals directly, we'll run hourly at 0 minutes
-- which is already set. This provides consistent updates.