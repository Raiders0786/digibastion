CREATE OR REPLACE FUNCTION public.advance_quillmonitor_sync_cursor(candidate timestamptz)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  advanced_value text;
BEGIN
  IF candidate IS NULL OR candidate > now() + interval '1 minute' THEN
    RAISE EXCEPTION 'Invalid QuillMonitor synchronization cursor';
  END IF;

  INSERT INTO public.app_config AS current_config (key, value, updated_at)
  VALUES ('QUILLMONITOR_SYNC_SINCE', candidate::text, now())
  ON CONFLICT (key) DO UPDATE
  SET
    value = greatest(
      current_config.value::timestamptz,
      excluded.value::timestamptz
    )::text,
    updated_at = CASE
      WHEN excluded.value::timestamptz > current_config.value::timestamptz THEN now()
      ELSE current_config.updated_at
    END
  RETURNING value INTO advanced_value;

  RETURN advanced_value::timestamptz;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_quillmonitor_sync_cursor(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.advance_quillmonitor_sync_cursor(timestamptz) TO service_role;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'fetch-quillmonitor-incidents-6hourly',
  'fetch-quillmonitor-incidents-30min'
);

SELECT cron.schedule('fetch-quillmonitor-incidents-30min', '17,47 * * * *', $$
  SELECT public.record_cron_http_request(
    'fetch-quillmonitor-incidents-30min',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/fetch-quillmonitor-incidents',
    '{}'::jsonb,
    120000
  );
$$);
