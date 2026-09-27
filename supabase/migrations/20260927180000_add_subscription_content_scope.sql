-- Keep the article taxonomy precise while allowing subscribers to choose the
-- same orthogonal All Intelligence / Web3 Incidents scope used by the feed.
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS content_scope text NOT NULL DEFAULT 'all';

ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_content_scope_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_content_scope_check
  CHECK (content_scope IN ('all', 'web3-incidents'));

COMMENT ON COLUMN public.subscriptions.content_scope IS
  'Delivery scope applied before category and technology preferences: all or web3-incidents';

-- Canonicalize trusted legacy provider rows. RSS rows are deliberately not
-- rewritten here: the protected fetch-rss-news reclassification mode applies
-- the current classifier in bounded, dry-run-first batches.
UPDATE public.news_articles
SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
  'security_domain', 'web3',
  'is_web3_incident', true,
  'taxonomy_version', coalesce(metadata->>'taxonomy_version', 'legacy-provider-backfill-2026-09-27')
)
WHERE (
    metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
    OR source_name = 'QuillMonitor'
  )
  AND (
    metadata->>'security_domain' IS DISTINCT FROM 'web3'
    OR metadata->>'is_web3_incident' IS DISTINCT FROM 'true'
  );

CREATE INDEX IF NOT EXISTS idx_news_articles_security_domain
  ON public.news_articles ((metadata->>'security_domain'));

CREATE INDEX IF NOT EXISTS idx_news_articles_web3_incident
  ON public.news_articles ((metadata->>'is_web3_incident'));

-- Keep ranked search/count behavior aligned with the direct feed query:
-- Web3 Security is an umbrella domain, Web3 Incidents is an orthogonal scope,
-- and records explicitly rejected by reclassification remain stored for audit
-- but are not publicly discoverable.
CREATE OR REPLACE FUNCTION public.search_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  result_limit integer DEFAULT 100,
  result_offset integer DEFAULT 0,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false
)
RETURNS TABLE(
  id uuid, title text, summary text, content text, category text, severity text,
  tags text[], affected_technologies text[], link text, source_url text,
  source_name text, author text, cve_id text, published_at timestamptz,
  is_processed boolean, metadata jsonb, rank real
)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_val tsquery;
BEGIN
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  SELECT na.id, na.title, na.summary, na.content, na.category, na.severity,
    na.tags, na.affected_technologies, na.link, na.source_url, na.source_name,
    na.author, na.cve_id, na.published_at, na.is_processed, na.metadata,
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0.0 END
  FROM public.news_articles na
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND (
      category_filter IS NULL
      OR na.category = ANY(array_remove(category_filter, 'web3-security'))
      OR (
        'web3-security' = ANY(category_filter)
        AND (
          na.metadata->>'security_domain' = 'web3'
          OR (
            na.metadata->>'security_domain' IS NULL
            AND (
              na.category IN ('web3-security', 'defi-exploits')
              OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
              OR na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
            )
          )
        )
      )
    )
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
    AND (
      NOT web3_incidents_only
      OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
      OR (
        na.metadata->>'is_web3_incident' IS NULL
        AND na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
      )
    )
  ORDER BY
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0 END DESC,
    na.published_at DESC
  LIMIT greatest(1, least(result_limit, 100))
  OFFSET greatest(result_offset, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.count_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false
)
RETURNS bigint
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_val tsquery;
  total_count bigint;
BEGIN
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;

  SELECT count(*) INTO total_count
  FROM public.news_articles na
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND (
      category_filter IS NULL
      OR na.category = ANY(array_remove(category_filter, 'web3-security'))
      OR (
        'web3-security' = ANY(category_filter)
        AND (
          na.metadata->>'security_domain' = 'web3'
          OR (
            na.metadata->>'security_domain' IS NULL
            AND (
              na.category IN ('web3-security', 'defi-exploits')
              OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
              OR na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
            )
          )
        )
      )
    )
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
    AND (
      NOT web3_incidents_only
      OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
      OR (
        na.metadata->>'is_web3_incident' IS NULL
        AND na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
      )
    );

  RETURN total_count;
END;
$function$;
