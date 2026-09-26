SELECT public.record_cron_http_request(
  'fetch-quillmonitor-final-verification',
  'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/fetch-quillmonitor-incidents',
  '{"pages":1,"page_size":10}'::jsonb,
  120000
);