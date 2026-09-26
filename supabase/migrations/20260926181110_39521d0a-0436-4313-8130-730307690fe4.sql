SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'fetch-quillmonitor-incidents-6hourly';

SELECT cron.schedule('fetch-quillmonitor-incidents-6hourly', '17 */6 * * *', $$
  SELECT public.record_cron_http_request(
    'fetch-quillmonitor-incidents-6hourly',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/fetch-quillmonitor-incidents',
    '{"pages":3,"page_size":100}'::jsonb,
    120000
  );
$$);