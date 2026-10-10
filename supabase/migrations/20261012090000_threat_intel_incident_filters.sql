-- Threat Intel page: status, chain, attack-type and source filters (spec 7.2).
--
-- 1. search_news_articles, count_news_articles and threat_intel_stats gain four
--    optional arguments, all DEFAULT NULL:
--      verification_filter text      metadata.verification_status ('verified' | 'unverified')
--      chain_filter        text[]    lower(btrim(metadata.chain)) values
--      attack_type_filter  text[]    lower(btrim(metadata.attack_type)) values
--      provider_filter     text[]    'quillmonitor' | 'web3-incidents' | 'slowmist' | 'rss'
--    'web3-incidents' also matches the legacy provider value 'web3'. 'rss'
--    matches provider 'rss' and rows with no provider that are not Web3
--    incidents (rows written before fetch-rss-news set a provider).
--    NULL or an empty array means "no filter".
-- 2. search_news_articles also returns created_at, so cards and incident pages
--    loaded through the RPC show the date Digibastion added the record.
-- 3. New threat_intel_facets(p_scope, p_since): the 15 most common chains and
--    attack types in the scope over the last 90 days, for the filter chips.
--
-- The WHERE clause is identical in search/count/stats (marked
-- THREAT_INTEL_FILTER_PREDICATE). It is migration 20261011090000's predicate
-- plus the four incident filters. Change all three together.
--
-- The frontend only sends the new arguments when a filter is set, so it works
-- against both the 20261011090000 signatures and these.

-- Adding arguments creates a new overload, and PostgREST cannot choose between
-- two overloads whose arguments all have defaults (PGRST203). Drop the
-- signatures migration 20261011090000 left live (search 9 args, count 6,
-- stats 6) and, defensively, every older one before creating the new ones.
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz, text);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz, text, boolean);
DROP FUNCTION IF EXISTS public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean);

-- This file's own signatures, so it can be re-run. The CREATE statements
-- below are plain CREATE FUNCTION: a leftover overload makes them fail loudly
-- instead of leaving two candidates for PostgREST.
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text, text, text[], text[], text[]);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz, text, boolean, text, text[], text[], text[]);
DROP FUNCTION IF EXISTS public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean, text, text[], text[], text[]);
DROP FUNCTION IF EXISTS public.threat_intel_facets(text, timestamptz);

CREATE FUNCTION public.search_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  result_limit integer DEFAULT 100,
  result_offset integer DEFAULT 0,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false,
  sort_by text DEFAULT 'date',
  verification_filter text DEFAULT NULL,
  chain_filter text[] DEFAULT NULL,
  attack_type_filter text[] DEFAULT NULL,
  provider_filter text[] DEFAULT NULL
)
RETURNS TABLE(
  id uuid, title text, summary text, content text, category text, severity text,
  tags text[], affected_technologies text[], link text, source_url text,
  source_name text, author text, cve_id text, published_at timestamptz,
  created_at timestamptz, is_processed boolean, metadata jsonb, rank real
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
    na.author, na.cve_id, na.published_at, na.created_at, na.is_processed, na.metadata,
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
    AND (verification_filter IS NULL OR na.metadata->>'verification_status' = verification_filter)
    AND (
      chain_filter IS NULL
      OR cardinality(chain_filter) = 0
      OR lower(btrim(na.metadata->>'chain')) = ANY(chain_filter)
    )
    AND (
      attack_type_filter IS NULL
      OR cardinality(attack_type_filter) = 0
      OR lower(btrim(na.metadata->>'attack_type')) = ANY(attack_type_filter)
    )
    AND (
      provider_filter IS NULL
      OR cardinality(provider_filter) = 0
      OR ('quillmonitor' = ANY(provider_filter) AND na.metadata->>'provider' = 'quillmonitor')
      OR ('web3-incidents' = ANY(provider_filter) AND na.metadata->>'provider' IN ('web3-incidents', 'web3'))
      OR ('slowmist' = ANY(provider_filter) AND na.metadata->>'provider' = 'slowmist')
      OR (
        'rss' = ANY(provider_filter)
        AND (
          na.metadata->>'provider' = 'rss'
          OR (
            na.metadata->>'provider' IS NULL
            AND coalesce(na.metadata->>'is_web3_incident', 'false') != 'true'
          )
        )
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

CREATE FUNCTION public.count_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false,
  verification_filter text DEFAULT NULL,
  chain_filter text[] DEFAULT NULL,
  attack_type_filter text[] DEFAULT NULL,
  provider_filter text[] DEFAULT NULL
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
    )
    AND (verification_filter IS NULL OR na.metadata->>'verification_status' = verification_filter)
    AND (
      chain_filter IS NULL
      OR cardinality(chain_filter) = 0
      OR lower(btrim(na.metadata->>'chain')) = ANY(chain_filter)
    )
    AND (
      attack_type_filter IS NULL
      OR cardinality(attack_type_filter) = 0
      OR lower(btrim(na.metadata->>'attack_type')) = ANY(attack_type_filter)
    )
    AND (
      provider_filter IS NULL
      OR cardinality(provider_filter) = 0
      OR ('quillmonitor' = ANY(provider_filter) AND na.metadata->>'provider' = 'quillmonitor')
      OR ('web3-incidents' = ANY(provider_filter) AND na.metadata->>'provider' IN ('web3-incidents', 'web3'))
      OR ('slowmist' = ANY(provider_filter) AND na.metadata->>'provider' = 'slowmist')
      OR (
        'rss' = ANY(provider_filter)
        AND (
          na.metadata->>'provider' = 'rss'
          OR (
            na.metadata->>'provider' IS NULL
            AND coalesce(na.metadata->>'is_web3_incident', 'false') != 'true'
          )
        )
      )
    );

  RETURN total_count;
END;
$function$;

CREATE FUNCTION public.threat_intel_stats(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false,
  verification_filter text DEFAULT NULL,
  chain_filter text[] DEFAULT NULL,
  attack_type_filter text[] DEFAULT NULL,
  provider_filter text[] DEFAULT NULL
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
    )
    AND (verification_filter IS NULL OR na.metadata->>'verification_status' = verification_filter)
    AND (
      chain_filter IS NULL
      OR cardinality(chain_filter) = 0
      OR lower(btrim(na.metadata->>'chain')) = ANY(chain_filter)
    )
    AND (
      attack_type_filter IS NULL
      OR cardinality(attack_type_filter) = 0
      OR lower(btrim(na.metadata->>'attack_type')) = ANY(attack_type_filter)
    )
    AND (
      provider_filter IS NULL
      OR cardinality(provider_filter) = 0
      OR ('quillmonitor' = ANY(provider_filter) AND na.metadata->>'provider' = 'quillmonitor')
      OR ('web3-incidents' = ANY(provider_filter) AND na.metadata->>'provider' IN ('web3-incidents', 'web3'))
      OR ('slowmist' = ANY(provider_filter) AND na.metadata->>'provider' = 'slowmist')
      OR (
        'rss' = ANY(provider_filter)
        AND (
          na.metadata->>'provider' = 'rss'
          OR (
            na.metadata->>'provider' IS NULL
            AND coalesce(na.metadata->>'is_web3_incident', 'false') != 'true'
          )
        )
      )
    );

  RETURN result;
END;
$function$;

-- Filter chips. Counts cover the scope over the window (default 90 days, at
-- most 365) and ignore the other filters, so selecting a chain never hides
-- the remaining chains. Values use the same rule as normalizeFacetValue() in
-- src/lib/threatIntel/query.ts: trimmed, lower-cased, at most 64 characters,
-- letters, digits, spaces and . & ( ) + ' / - only. Values outside that rule
-- are not offered as filters.
CREATE FUNCTION public.threat_intel_facets(
  p_scope text DEFAULT 'web3-incidents',
  p_since timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  WITH scoped AS (
    SELECT na.metadata
    FROM public.news_articles na
    WHERE na.published_at >= greatest(
        coalesce(p_since, now() - interval '90 days'),
        now() - interval '365 days'
      )
      AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
      AND na.metadata->>'duplicate_of_uid' IS NULL
      AND (
        p_scope IS DISTINCT FROM 'web3-incidents'
        OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
        OR (
          na.metadata->>'is_web3_incident' IS NULL
          AND na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
        )
      )
  ),
  facet_values AS (
    SELECT 'chain' AS facet, btrim(metadata->>'chain') AS raw_value FROM scoped
    UNION ALL
    SELECT 'attack_type' AS facet, btrim(metadata->>'attack_type') AS raw_value FROM scoped
  ),
  counted AS (
    SELECT facet, lower(raw_value) AS value, min(raw_value) AS label, count(*) AS n
    FROM facet_values
    WHERE raw_value IS NOT NULL
      AND char_length(raw_value) BETWEEN 1 AND 64
      AND raw_value ~ '^[[:alnum:]][[:alnum:] .&()+''/-]*$'
    GROUP BY facet, lower(raw_value)
  ),
  ranked AS (
    SELECT counted.*, row_number() OVER (PARTITION BY facet ORDER BY n DESC, value) AS position
    FROM counted
  )
  SELECT jsonb_build_object(
    'chains', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('value', value, 'label', label, 'count', n) ORDER BY position)
       FROM ranked WHERE facet = 'chain' AND position <= 15),
      '[]'::jsonb
    ),
    'attack_types', coalesce(
      (SELECT jsonb_agg(jsonb_build_object('value', value, 'label', label, 'count', n) ORDER BY position)
       FROM ranked WHERE facet = 'attack_type' AND position <= 15),
      '[]'::jsonb
    )
  );
$function$;

COMMENT ON FUNCTION public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text, text, text[], text[], text[]) IS
  'Public Threat Intel feed page. sort_by: date (default) or severity. Optional status, chain, attack-type and provider filters. Excludes classifier rejections and merged duplicates.';
COMMENT ON FUNCTION public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean, text, text[], text[], text[]) IS
  'Whole-result counts for the Threat Intel stat tiles. Same filters and predicate as search_news_articles.';
COMMENT ON FUNCTION public.threat_intel_facets(text, timestamptz) IS
  'Top 15 chains and attack types (value, label, count) for the Threat Intel filter chips. Scope web3-incidents or all; default window 90 days.';

-- The three filter functions were dropped and recreated, so grant explicitly,
-- as migration 20261011090000 did.
GRANT EXECUTE ON FUNCTION public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text, text, text[], text[], text[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_news_articles(text, text[], text[], timestamptz, text, boolean, text, text[], text[], text[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean, text, text[], text[], text[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.threat_intel_facets(text, timestamptz) TO anon, authenticated, service_role;

-- Make PostgREST forget the dropped signatures immediately.
NOTIFY pgrst, 'reload schema';
