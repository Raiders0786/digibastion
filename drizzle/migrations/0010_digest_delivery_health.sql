-- Digest delivery health (October 2026 incident follow-up).
--
-- 1. Every verified subscription gets a management token. send-newsletters
--    and send-critical-alerts skip rows without one; on 11 October 2026
--    send-newsletters saw 10 of 13 active subscribers. A December 2025
--    version of verify-email cleared the token on confirmation, the likely
--    cause.
-- 2. get_delivery_health() reports when RSS last inserted an article and
--    which active subscriptions are overdue for their digest. cron-monitor
--    reads it every hour and emails the admins; delivery_health_alerts keeps
--    it to one email per problem every 12 hours.
--
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Management tokens
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions DISABLE TRIGGER update_subscriptions_updated_at;
UPDATE public.subscriptions
SET verification_token = gen_random_uuid(),
    verification_token_expires_at = NULL
WHERE is_verified
  AND verification_token IS NULL;
ALTER TABLE public.subscriptions ENABLE TRIGGER update_subscriptions_updated_at;

-- ---------------------------------------------------------------------------
-- 2. Delivery health
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_health_alerts (
  kind text PRIMARY KEY CHECK (kind IN ('rss-stale', 'digest-overdue')),
  last_sent_at timestamptz NOT NULL,
  detail text CHECK (detail IS NULL OR length(detail) <= 300)
);

GRANT ALL ON public.delivery_health_alerts TO service_role;
REVOKE ALL ON public.delivery_health_alerts FROM anon, authenticated;

ALTER TABLE public.delivery_health_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages delivery health alerts" ON public.delivery_health_alerts;
CREATE POLICY "Service role manages delivery health alerts"
ON public.delivery_health_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Overdue: an active, verified daily subscription with no digest for 36
-- hours, or a weekly one with none for 8 days, counted from sign-up when it
-- has never had one. Quiet days still send an email, so any overdue row is a
-- real delivery failure. Returns ids only, never email addresses.
CREATE OR REPLACE FUNCTION public.get_delivery_health()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  WITH overdue AS (
    SELECT id, frequency, last_notified_at
    FROM public.subscriptions
    WHERE is_active
      AND is_verified
      AND (
        (frequency = 'daily' AND coalesce(last_notified_at, created_at) < now() - interval '36 hours')
        OR (frequency = 'weekly' AND coalesce(last_notified_at, created_at) < now() - interval '8 days')
      )
  )
  SELECT jsonb_build_object(
    'rss_last_inserted_at', (
      SELECT max(created_at) FROM public.news_articles WHERE metadata->>'provider' = 'rss'
    ),
    'active_digest_subscriptions', (
      SELECT count(*) FROM public.subscriptions
      WHERE is_active AND is_verified AND frequency IN ('daily', 'weekly')
    ),
    'overdue_count', (SELECT count(*) FROM overdue),
    'overdue', coalesce((
      SELECT jsonb_agg(jsonb_build_object('id', id, 'frequency', frequency, 'last_notified_at', last_notified_at)
        ORDER BY last_notified_at NULLS FIRST)
      FROM (SELECT * FROM overdue ORDER BY last_notified_at NULLS FIRST LIMIT 20) shown
    ), '[]'::jsonb),
    'generated_at', now()
  );
$function$;

REVOKE ALL ON FUNCTION public.get_delivery_health() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_delivery_health() TO service_role;
