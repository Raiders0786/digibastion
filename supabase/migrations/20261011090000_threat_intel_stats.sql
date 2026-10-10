-- Threat Intel page: whole-result stats and server-side severity sort.
--
-- 1. threat_intel_stats(...) returns severity, category and verification
--    counts for exactly the rows search_news_articles can return for the same
--    filters, so the stat tiles describe the whole filtered result instead of
--    the 20 rows on screen.
-- 2. search_news_articles gains sort_by ('date' | 'severity'). Severity order
--    is applied before LIMIT/OFFSET, so page 2 continues page 1's ordering.
-- 3. search, count and stats exclude rows the cross-provider matcher marked
--    metadata.duplicate_of_uid. This matches isPublishable() in
--    src/lib/threatIntel/articleRow.ts and CLASSIFICATION_RELEVANCE_POSTGREST_FILTER
--    in src/utils/newsIncident.ts.
--
-- The WHERE clause is identical in all three functions (marked
-- THREAT_INTEL_FILTER_PREDICATE). Change all three together.

-- PostgREST resolves RPC calls by argument names. Older 6-, 7- and 8-argument
-- overloads of search_news_articles are still live (see
-- src/integrations/supabase/types.ts). A 9-argument version with all defaults
-- next to them makes calls that omit sort_by ambiguous (PGRST203), so drop
-- every historical signature first. The stale count overloads go too; the
-- frontend only calls the 6-argument count.
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz, text);

DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text);
DROP FUNCTION IF EXISTS public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean);

CREATE FUNCTION public.search_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  result_limit integer DEFAULT 100,
  result_offset integer DEFAULT 0,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false,
  sort_by text DEFAULT 'date'
)
RETURNS TABLE(
  id uuid, title text, summary text, content text, category text, severity text,
  tags text[], affected_technologies text[], link text, source_url text,
  source_name text, author text, cve_id text, published_at timestamptz,
  is_processed boolean, metadata jsonb, rank real
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
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
  -- THREAT_INTEL_FILTER_PREDICATE (keep identical in search/count/stats)
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND na.metadata->>'duplicate_of_uid' IS NULL
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
    -- Rank order mirrors SEVERITY_STYLES[*].rank in src/lib/threatIntel/taxonomy.ts.
    CASE WHEN sort_by = 'severity' THEN
      CASE na.severity
        WHEN 'critical' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END
    ELSE 0 END,
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0 END DESC,
    na.published_at DESC,
    na.id DESC
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
STABLE
SECURITY INVOKER
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
  -- THREAT_INTEL_FILTER_PREDICATE (keep identical in search/count/stats)
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND na.metadata->>'duplicate_of_uid' IS NULL
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

CREATE OR REPLACE FUNCTION public.threat_intel_stats(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_val tsquery;
  result jsonb;
BEGIN
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;

  SELECT jsonb_build_object(
    'total', count(*),
    'critical', count(*) FILTER (WHERE na.severity = 'critical'),
    'high', count(*) FILTER (WHERE na.severity = 'high'),
    'medium', count(*) FILTER (WHERE na.severity = 'medium'),
    'low', count(*) FILTER (WHERE na.severity = 'low'),
    -- The frontend maps unknown severities to 'info' (mapNewsArticleRow), so count them here too.
    'info', count(*) FILTER (WHERE na.severity IS NULL OR na.severity NOT IN ('critical', 'high', 'medium', 'low')),
    'supply_chain', count(*) FILTER (WHERE na.category = 'supply-chain'),
    'unconfirmed', count(*) FILTER (WHERE na.metadata->>'verification_status' = 'unverified')
  )
  INTO result
  FROM public.news_articles na
  -- THREAT_INTEL_FILTER_PREDICATE (keep identical in search/count/stats)
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND na.metadata->>'duplicate_of_uid' IS NULL
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

  RETURN result;
END;
$function$;

COMMENT ON FUNCTION public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text) IS
  'Public Threat Intel feed page. sort_by: date (default) or severity. Excludes classifier rejections and merged duplicates.';
COMMENT ON FUNCTION public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean) IS
  'Whole-result counts for the Threat Intel stat tiles. Same filters and predicate as search_news_articles.';

-- Earlier versions relied on default EXECUTE grants. The search function was
-- dropped and recreated, so grant explicitly.
GRANT EXECUTE ON FUNCTION public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_news_articles(text, text[], text[], timestamptz, text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean) TO anon, authenticated, service_role;

-- Make PostgREST forget the dropped overloads immediately.
NOTIFY pgrst, 'reload schema';
