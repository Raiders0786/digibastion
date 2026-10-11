-- Phase 3 newsletters data model (spec 8.1).
--
-- 1. subscriptions gains delivery channels (wants_realtime/daily/weekly), an
--    IANA timezone, include_preliminary, chains, an opt-in consent audit,
--    unsubscribed_at and a single-use re-subscribe token. The channels are
--    backfilled from frequency, and sync_subscription_delivery_channels keeps
--    frequency and wants_* in step in both directions, so old and new versions
--    of every function and form keep working in any deploy order. frequency is
--    not dropped in this phase.
-- 2. New service-role-only tables: newsletter_issues (one shared edition per
--    period), email_suppressions (bounces and complaints, by email hash),
--    email_sends (idempotency ledger for every send, backfilled from
--    notification_log) and incident_status_events (confirmed, revised and
--    retracted incidents for the daily brief, written by a trigger on
--    news_articles).
--
-- Safe to re-run: columns, tables and indexes use IF NOT EXISTS, backfills
-- only touch rows they have not filled yet, triggers and policies are
-- dropped and re-created.

-- ---------------------------------------------------------------------------
-- 1. subscriptions
-- ---------------------------------------------------------------------------
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS wants_realtime boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_daily boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS wants_weekly boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timezone text NULL
    CHECK (timezone IS NULL OR (length(timezone) BETWEEN 1 AND 64 AND timezone ~ '^[A-Za-z]+(/[A-Za-z0-9_+-]+){0,2}$')),
  ADD COLUMN IF NOT EXISTS include_preliminary boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS chains text[] NOT NULL DEFAULT '{}' CHECK (cardinality(chains) <= 10),
  ADD COLUMN IF NOT EXISTS consented_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_source text
    CHECK (consent_source IN ('threat-intel-form', 'quick-subscribe', 'manage', 'resubscribe', 'legacy')),
  ADD COLUMN IF NOT EXISTS consent_ip_hash text CHECK (consent_ip_hash IS NULL OR consent_ip_hash ~ '^[0-9a-f]{64}$'),
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS optin_token uuid,
  ADD COLUMN IF NOT EXISTS optin_token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS optin_pending jsonb;

COMMENT ON COLUMN public.subscriptions.wants_realtime IS 'Real-time incident alerts. Kept in sync with frequency by sync_subscription_delivery_channels.';
COMMENT ON COLUMN public.subscriptions.wants_daily IS 'Daily brief.';
COMMENT ON COLUMN public.subscriptions.wants_weekly IS 'Weekly deep-dive (Mondays, local preferred_hour).';
COMMENT ON COLUMN public.subscriptions.timezone IS 'IANA time zone such as Asia/Kolkata; timezone_offset is the fallback.';
COMMENT ON COLUMN public.subscriptions.include_preliminary IS 'false skips unconfirmed (unverified) incidents.';
COMMENT ON COLUMN public.subscriptions.chains IS 'Lower-cased chain names; empty means every chain. Applies to Web3 incidents only.';
COMMENT ON COLUMN public.subscriptions.consent_ip_hash IS 'sha256 hex of the IP address that confirmed the opt-in.';
COMMENT ON COLUMN public.subscriptions.optin_token IS 'Single-use token confirming a re-subscribe of an unsubscribed address.';
COMMENT ON COLUMN public.subscriptions.optin_pending IS 'Preferences applied when the re-subscribe is confirmed.';

-- Backfills in one statement; every SET expression reads the row as it was
-- before this UPDATE, so unsubscribed_at copies the real updated_at. The
-- updated_at trigger is paused so the backfill does not stamp every row as
-- changed today.
ALTER TABLE public.subscriptions DISABLE TRIGGER update_subscriptions_updated_at;
UPDATE public.subscriptions
SET
  wants_realtime = CASE WHEN NOT (wants_realtime OR wants_daily OR wants_weekly) THEN frequency = 'immediate' ELSE wants_realtime END,
  wants_daily = CASE WHEN NOT (wants_realtime OR wants_daily OR wants_weekly) THEN frequency = 'daily' ELSE wants_daily END,
  wants_weekly = CASE WHEN NOT (wants_realtime OR wants_daily OR wants_weekly) THEN frequency = 'weekly' ELSE wants_weekly END,
  consented_at = CASE WHEN is_verified AND consented_at IS NULL THEN created_at ELSE consented_at END,
  consent_source = CASE WHEN is_verified AND consented_at IS NULL THEN 'legacy' ELSE consent_source END,
  unsubscribed_at = CASE WHEN NOT is_active AND unsubscribed_at IS NULL THEN updated_at ELSE unsubscribed_at END
WHERE NOT (wants_realtime OR wants_daily OR wants_weekly)
   OR (is_verified AND consented_at IS NULL)
   OR (NOT is_active AND unsubscribed_at IS NULL);
ALTER TABLE public.subscriptions ENABLE TRIGGER update_subscriptions_updated_at;

-- Keeps frequency (read by the legacy senders and forms) and wants_* (read by
-- the new ones) consistent. frequency priority: immediate, daily, weekly.
CREATE OR REPLACE FUNCTION public.sync_subscription_delivery_channels()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT (NEW.wants_realtime OR NEW.wants_daily OR NEW.wants_weekly) THEN
      NEW.wants_realtime := NEW.frequency = 'immediate';
      NEW.wants_daily := NEW.frequency = 'daily';
      NEW.wants_weekly := NEW.frequency = 'weekly';
    ELSE
      NEW.frequency := CASE
        WHEN NEW.wants_realtime THEN 'immediate'
        WHEN NEW.wants_daily THEN 'daily'
        ELSE 'weekly'
      END;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.wants_realtime IS DISTINCT FROM OLD.wants_realtime
     OR NEW.wants_daily IS DISTINCT FROM OLD.wants_daily
     OR NEW.wants_weekly IS DISTINCT FROM OLD.wants_weekly THEN
    NEW.frequency := CASE
      WHEN NEW.wants_realtime THEN 'immediate'
      WHEN NEW.wants_daily THEN 'daily'
      WHEN NEW.wants_weekly THEN 'weekly'
      ELSE OLD.frequency
    END;
  ELSIF NEW.frequency IS DISTINCT FROM OLD.frequency THEN
    NEW.wants_realtime := NEW.frequency = 'immediate';
    NEW.wants_daily := NEW.frequency = 'daily';
    NEW.wants_weekly := NEW.frequency = 'weekly';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS sync_subscription_delivery_channels ON public.subscriptions;
CREATE TRIGGER sync_subscription_delivery_channels
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_subscription_delivery_channels();

CREATE INDEX IF NOT EXISTS subscriptions_delivery_channels_idx
ON public.subscriptions (is_active, is_verified)
WHERE wants_realtime OR wants_daily OR wants_weekly;

-- ---------------------------------------------------------------------------
-- 2. newsletter_issues, email_suppressions, email_sends
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.newsletter_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('daily', 'weekly')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL CHECK (period_end > period_start),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'failed')),
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text CHECK (error IS NULL OR length(error) <= 300),
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, period_start)
);

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email_hash text PRIMARY KEY CHECK (email_hash ~ '^[0-9a-f]{64}$'),
  reason text NOT NULL CHECK (reason IN ('bounce', 'complaint', 'manual')),
  source_event_id text CHECK (length(source_event_id) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('alert', 'alert_followup', 'daily', 'weekly')),
  item_key text NOT NULL CHECK (length(item_key) BETWEEN 1 AND 300),
  issue_id uuid REFERENCES public.newsletter_issues(id) ON DELETE SET NULL,
  article_id uuid REFERENCES public.news_articles(id) ON DELETE SET NULL,
  article_uid text,
  idempotency_key text NOT NULL CHECK (length(idempotency_key) <= 256),
  status text NOT NULL CHECK (status IN ('claimed', 'sent', 'failed', 'unknown', 'suppressed', 'skipped')),
  attempts integer NOT NULL DEFAULT 0,
  resend_id text,
  snapshot jsonb,
  last_event text CHECK (last_event IN ('delivered', 'bounced', 'complained', 'delivery_delayed')),
  error text CHECK (error IS NULL OR length(error) <= 300),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, kind, item_key)
);

CREATE INDEX IF NOT EXISTS email_sends_resend_id_idx ON public.email_sends (resend_id);
CREATE INDEX IF NOT EXISTS email_sends_kind_status_created_idx ON public.email_sends (kind, status, created_at DESC);
CREATE INDEX IF NOT EXISTS newsletter_issues_kind_period_end_idx ON public.newsletter_issues (kind, period_end DESC);

DROP TRIGGER IF EXISTS update_newsletter_issues_updated_at ON public.newsletter_issues;
CREATE TRIGGER update_newsletter_issues_updated_at
BEFORE UPDATE ON public.newsletter_issues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_suppressions_updated_at ON public.email_suppressions;
CREATE TRIGGER update_email_suppressions_updated_at
BEFORE UPDATE ON public.email_suppressions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_sends_updated_at ON public.email_sends;
CREATE TRIGGER update_email_sends_updated_at
BEFORE UPDATE ON public.email_sends
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Real-time alerts already sent stay sent: notification_log rows become
-- 'alert' ledger rows keyed by the article's stable uid. The snapshot records
-- what the article looks like now, so follow-ups compare against it.
INSERT INTO public.email_sends (
  subscription_id, kind, item_key, article_id, article_uid, idempotency_key,
  status, attempts, snapshot, created_at, sent_at, updated_at
)
SELECT
  nl.subscription_id,
  'alert',
  na.uid,
  na.id,
  na.uid,
  'legacy/' || nl.id::text,
  'sent',
  1,
  jsonb_build_object(
    'sent_severity', na.severity,
    'sent_verification', na.metadata->>'verification_status'
  ),
  nl.sent_at,
  nl.sent_at,
  nl.sent_at
FROM public.notification_log nl
JOIN public.news_articles na ON na.id = nl.article_id
WHERE nl.status = 'sent'
  AND nl.subscription_id IS NOT NULL
  AND length(na.uid) BETWEEN 1 AND 300
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. incident_status_events
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_status_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_uid text NOT NULL,
  article_id uuid REFERENCES public.news_articles(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('confirmed', 'revised', 'retracted')),
  snapshot jsonb NOT NULL,
  previous_amount_usd numeric,
  amount_usd numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS incident_status_events_created_idx ON public.incident_status_events (created_at DESC);

-- Service-role only, like telegram_posts.
GRANT ALL ON public.newsletter_issues, public.email_suppressions, public.email_sends, public.incident_status_events TO service_role;
REVOKE ALL ON public.newsletter_issues, public.email_suppressions, public.email_sends, public.incident_status_events FROM anon, authenticated;

ALTER TABLE public.newsletter_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_status_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages newsletter issues" ON public.newsletter_issues;
CREATE POLICY "Service role manages newsletter issues"
ON public.newsletter_issues FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages email suppressions" ON public.email_suppressions;
CREATE POLICY "Service role manages email suppressions"
ON public.email_suppressions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages email sends" ON public.email_sends;
CREATE POLICY "Service role manages email sends"
ON public.email_sends FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages incident status events" ON public.incident_status_events;
CREATE POLICY "Service role manages incident status events"
ON public.incident_status_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Logs confirmed, revised and retracted Web3 incidents for the daily brief.
-- Importers upsert every row on each sync, so the function returns before any
-- write unless one of the conditions holds. Merged duplicates are skipped: a
-- row being marked as a duplicate is a merge, not a retraction.
-- The snapshot is the old row: id, title, severity, category, link,
-- source_name, tags, affected_technologies, created_at, and a nested
-- `metadata` object with the incident keys (read by statusChangeItem in
-- supabase/functions/_shared/newsletter-content.ts).
CREATE OR REPLACE FUNCTION public.log_incident_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  old_amount numeric;
  new_amount numeric;
  kinds text[] := ARRAY[]::text[];
  event_kind text;
  snap jsonb;
BEGIN
  IF OLD.metadata ? 'duplicate_of_uid' THEN
    RETURN NULL;
  END IF;

  old_amount := CASE
    WHEN jsonb_typeof(OLD.metadata->'amount_lost_usd') = 'number' THEN (OLD.metadata->>'amount_lost_usd')::numeric
  END;

  IF TG_OP = 'DELETE' THEN
    kinds := ARRAY['retracted'];
  ELSE
    IF NEW.metadata ? 'duplicate_of_uid' THEN
      RETURN NULL;
    END IF;
    new_amount := CASE
      WHEN jsonb_typeof(NEW.metadata->'amount_lost_usd') = 'number' THEN (NEW.metadata->>'amount_lost_usd')::numeric
    END;

    IF NEW.metadata->>'classification_relevant' = 'false'
       AND (OLD.metadata->>'classification_relevant') IS DISTINCT FROM 'false' THEN
      kinds := ARRAY['retracted'];
    ELSE
      IF OLD.metadata->>'verification_status' = 'unverified'
         AND NEW.metadata->>'verification_status' = 'verified' THEN
        kinds := kinds || 'confirmed'::text;
      END IF;
      IF old_amount IS NOT NULL AND new_amount IS NOT NULL
         AND abs(new_amount - old_amount) > greatest(1, 0.005 * old_amount) THEN
        kinds := kinds || 'revised'::text;
      END IF;
    END IF;
  END IF;

  IF cardinality(kinds) = 0 THEN
    RETURN NULL;
  END IF;

  snap := jsonb_build_object(
    'id', OLD.id,
    'title', OLD.title,
    'severity', OLD.severity,
    'category', OLD.category,
    'link', OLD.link,
    'source_name', OLD.source_name,
    'tags', to_jsonb(OLD.tags),
    'affected_technologies', to_jsonb(OLD.affected_technologies),
    'created_at', OLD.created_at,
    'metadata', jsonb_strip_nulls(jsonb_build_object(
      'provider', OLD.metadata->'provider',
      'project_name', OLD.metadata->'project_name',
      'chain', OLD.metadata->'chain',
      'attack_type', OLD.metadata->'attack_type',
      'amount_lost_usd', OLD.metadata->'amount_lost_usd',
      'amount_display', OLD.metadata->'amount_display',
      'verification_status', OLD.metadata->'verification_status',
      'is_web3_incident', OLD.metadata->'is_web3_incident',
      'incident_date', OLD.metadata->'incident_date',
      'sources', OLD.metadata->'sources'
    ))
  );

  FOREACH event_kind IN ARRAY kinds LOOP
    INSERT INTO public.incident_status_events (article_uid, article_id, kind, snapshot, previous_amount_usd, amount_usd)
    VALUES (
      OLD.uid,
      -- The row is gone after a DELETE; ON DELETE SET NULL would clear it anyway.
      CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE OLD.id END,
      event_kind,
      snap,
      old_amount,
      CASE WHEN TG_OP = 'DELETE' THEN old_amount ELSE new_amount END
    );
  END LOOP;
  RETURN NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.log_incident_status_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS log_incident_status_change ON public.news_articles;
CREATE TRIGGER log_incident_status_change
AFTER UPDATE OR DELETE ON public.news_articles
FOR EACH ROW
WHEN (OLD.metadata->>'is_web3_incident' = 'true')
EXECUTE FUNCTION public.log_incident_status_change();
