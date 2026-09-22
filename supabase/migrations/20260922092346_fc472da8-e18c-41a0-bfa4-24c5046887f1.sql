CREATE TABLE public.rate_limit_counters (
  scope text NOT NULL,
  identifier_hash text NOT NULL,
  window_started_at timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (scope, identifier_hash, window_started_at)
);
GRANT ALL ON public.rate_limit_counters TO service_role;
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages rate limits" ON public.rate_limit_counters FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "No client access to rate limits" ON public.rate_limit_counters FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  _scope text,
  _identifier_hash text,
  _max_attempts integer,
  _window_seconds integer DEFAULT 3600
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window timestamptz;
  current_count integer;
  reset_at timestamptz;
BEGIN
  IF _scope IS NULL OR length(_scope) < 1 OR length(_scope) > 100 OR
     _identifier_hash IS NULL OR length(_identifier_hash) < 8 OR length(_identifier_hash) > 128 OR
     _max_attempts < 1 OR _max_attempts > 10000 OR
     _window_seconds < 60 OR _window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  current_window := to_timestamp(floor(extract(epoch FROM now()) / _window_seconds) * _window_seconds);
  reset_at := current_window + make_interval(secs => _window_seconds);

  INSERT INTO public.rate_limit_counters(scope, identifier_hash, window_started_at, request_count, expires_at)
  VALUES (_scope, _identifier_hash, current_window, 1, reset_at + interval '1 hour')
  ON CONFLICT (scope, identifier_hash, window_started_at)
  DO UPDATE SET request_count = public.rate_limit_counters.request_count + 1
  RETURNING request_count INTO current_count;

  RETURN jsonb_build_object(
    'allowed', current_count <= _max_attempts,
    'remaining', greatest(_max_attempts - current_count, 0),
    'reset_at', reset_at
  );
END;
$$;
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, text, integer, integer) TO service_role;

CREATE TABLE public.api_key_admin_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE RESTRICT,
  actor_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'revoked', 'reactivated', 'retired')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.api_key_admin_audit TO authenticated;
GRANT ALL ON public.api_key_admin_audit TO service_role;
ALTER TABLE public.api_key_admin_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view API key audit" ON public.api_key_admin_audit FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Service role manages API key audit" ON public.api_key_admin_audit FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS retired_at timestamptz;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS retired_by uuid;
ALTER TABLE public.api_usage_logs DROP CONSTRAINT api_usage_logs_api_key_id_fkey;
ALTER TABLE public.api_usage_logs ADD CONSTRAINT api_usage_logs_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_keys(id) ON DELETE RESTRICT;
DROP POLICY IF EXISTS "Admins can insert api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can update api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can delete api_keys" ON public.api_keys;

ALTER TABLE public.cron_health_snapshots ADD COLUMN IF NOT EXISTS alert_error text;
ALTER TABLE public.cron_health_snapshots ADD COLUMN IF NOT EXISTS alert_recipients text[];

CREATE INDEX IF NOT EXISTS idx_news_articles_severity_published_recent ON public.news_articles (severity, published_at DESC) INCLUDE (created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_expires_at ON public.rate_limit_counters(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_key_admin_audit_key_created ON public.api_key_admin_audit(api_key_id, created_at DESC);

REVOKE ALL ON FUNCTION public.cleanup_expired_quiz_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_api_usage_logs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_health_snapshots() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_submission_logs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_cron_auth_headers() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_quiz_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_api_usage_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_health_snapshots() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_submission_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_cron_auth_headers() TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

INSERT INTO public.app_config(key, value)
VALUES ('ADMIN_ALERT_EMAILS', 'chiragkcv2020@gmail.com')
ON CONFLICT (key) DO NOTHING;

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cron-monitor-hourly';
SELECT cron.schedule(
  'cron-monitor-hourly',
  '7 * * * *',
  $$SELECT public.record_cron_http_request(
    'cron-monitor-hourly',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/cron-monitor',
    '{}'::jsonb,
    120000
  );$$
);

CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.rate_limit_counters WHERE expires_at < now();
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_expired_rate_limits() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_rate_limits() TO service_role;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cleanup-expired-rate-limits';
SELECT cron.schedule('cleanup-expired-rate-limits', '23 * * * *', 'SELECT public.cleanup_expired_rate_limits();');