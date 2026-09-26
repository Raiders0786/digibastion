CREATE TABLE public.threat_intel_ingestion_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline text NOT NULL CHECK (pipeline IN ('rss', 'web3-incidents', 'quillmonitor', 'ai-summary', 'critical-alerts', 'digest-emails')),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  success boolean NOT NULL DEFAULT false,
  records_found integer NOT NULL DEFAULT 0 CHECK (records_found >= 0),
  records_inserted integer NOT NULL DEFAULT 0 CHECK (records_inserted >= 0),
  records_updated integer NOT NULL DEFAULT 0 CHECK (records_updated >= 0),
  records_invalid integer NOT NULL DEFAULT 0 CHECK (records_invalid >= 0),
  duration_ms integer CHECK (duration_ms IS NULL OR duration_ms >= 0),
  error_summary text CHECK (error_summary IS NULL OR length(error_summary) <= 500),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT ALL ON public.threat_intel_ingestion_runs TO service_role;
ALTER TABLE public.threat_intel_ingestion_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages threat intel ingestion runs"
ON public.threat_intel_ingestion_runs
FOR ALL TO service_role
USING (true) WITH CHECK (true);
CREATE INDEX threat_intel_ingestion_runs_pipeline_attempted_idx
ON public.threat_intel_ingestion_runs (pipeline, attempted_at DESC);

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
  SELECT
    na.id, na.title, na.summary, na.content, na.category, na.severity,
    na.tags, na.affected_technologies, na.link, na.source_url,
    na.source_name, na.author, na.cve_id, na.published_at,
    na.is_processed, na.metadata,
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0.0 END AS rank
  FROM public.news_articles na
  WHERE
    (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND (category_filter IS NULL OR na.category = ANY(category_filter))
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
    AND (
      NOT web3_incidents_only
      OR na.category IN ('web3-security', 'defi-exploits')
      OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
      OR na.metadata->>'provider' = 'quillmonitor'
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
  WHERE
    (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND (category_filter IS NULL OR na.category = ANY(category_filter))
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
    AND (
      NOT web3_incidents_only
      OR na.category IN ('web3-security', 'defi-exploits')
      OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
      OR na.metadata->>'provider' = 'quillmonitor'
    );
  RETURN total_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_threat_intel_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  WITH pipelines(name, expected_hours) AS (
    VALUES ('rss'::text, 2), ('web3-incidents'::text, 8), ('quillmonitor'::text, 8),
           ('critical-alerts'::text, 2), ('digest-emails'::text, 2), ('ai-summary'::text, 8)
  ), latest_runs AS (
    SELECT DISTINCT ON (pipeline)
      pipeline, attempted_at, completed_at, success, records_found,
      records_inserted, records_updated, records_invalid, duration_ms, error_summary
    FROM public.threat_intel_ingestion_runs
    ORDER BY pipeline, attempted_at DESC
  ), source_times AS (
    SELECT
      CASE
        WHEN metadata->>'provider' = 'quillmonitor' THEN 'quillmonitor'
        WHEN metadata->>'provider' IN ('web3-incidents', 'web3') OR uid LIKE 'web3:%' THEN 'web3-incidents'
        ELSE 'rss'
      END AS pipeline,
      max(created_at) AS latest_ingested_at,
      max(published_at) AS latest_published_at,
      count(*) FILTER (WHERE created_at >= now() - interval '24 hours') AS records_24h
    FROM public.news_articles
    GROUP BY 1
  ), pipeline_rows AS (
    SELECT jsonb_build_object(
      'pipeline', p.name,
      'expected_hours', p.expected_hours,
      'last_attempted_at', lr.attempted_at,
      'last_completed_at', lr.completed_at,
      'last_success', lr.success,
      'records_found', coalesce(lr.records_found, 0),
      'records_inserted', coalesce(lr.records_inserted, 0),
      'records_updated', coalesce(lr.records_updated, 0),
      'records_invalid', coalesce(lr.records_invalid, 0),
      'duration_ms', lr.duration_ms,
      'error_summary', lr.error_summary,
      'latest_ingested_at', st.latest_ingested_at,
      'latest_published_at', st.latest_published_at,
      'records_24h', coalesce(st.records_24h, 0),
      'status', CASE
        WHEN lr.success = false THEN 'failed'
        WHEN coalesce(lr.completed_at, st.latest_ingested_at) IS NULL THEN 'unknown'
        WHEN coalesce(lr.completed_at, st.latest_ingested_at) < now() - make_interval(hours => p.expected_hours) THEN 'stale'
        ELSE 'healthy'
      END
    ) AS value
    FROM pipelines p
    LEFT JOIN latest_runs lr ON lr.pipeline = p.name
    LEFT JOIN source_times st ON st.pipeline = p.name
  ), quality AS (
    SELECT
      count(*) FILTER (WHERE published_at > now() + interval '5 minutes') AS future_dated,
      count(*) FILTER (WHERE title IS NULL OR btrim(title) = '' OR link IS NULL OR btrim(link) = '') AS missing_required,
      count(*) FILTER (WHERE severity IN ('critical', 'high')) AS active_alerts,
      count(*) FILTER (WHERE severity = 'critical') AS critical_alerts,
      count(*) FILTER (WHERE severity = 'high') AS high_alerts,
      max(published_at) FILTER (WHERE severity IN ('critical', 'high')) AS latest_alert_at
    FROM public.news_articles
  ), duplicate_ids AS (
    SELECT count(*) AS duplicate_groups FROM (
      SELECT uid FROM public.news_articles GROUP BY uid HAVING count(*) > 1
    ) duplicates
  ), category_counts AS (
    SELECT coalesce(jsonb_object_agg(category, total), '{}'::jsonb) AS value
    FROM (SELECT category, count(*) AS total FROM public.news_articles GROUP BY category) grouped
  ), severity_counts AS (
    SELECT coalesce(jsonb_object_agg(severity, total), '{}'::jsonb) AS value
    FROM (SELECT severity, count(*) AS total FROM public.news_articles GROUP BY severity) grouped
  )
  SELECT jsonb_build_object(
    'pipelines', coalesce((SELECT jsonb_agg(value ORDER BY value->>'pipeline') FROM pipeline_rows), '[]'::jsonb),
    'quality', jsonb_build_object(
      'future_dated', quality.future_dated,
      'missing_required', quality.missing_required,
      'duplicate_uid_groups', duplicate_ids.duplicate_groups,
      'category_counts', category_counts.value,
      'severity_counts', severity_counts.value
    ),
    'active_alerts', jsonb_build_object(
      'total', quality.active_alerts,
      'critical', quality.critical_alerts,
      'high', quality.high_alerts,
      'latest_at', quality.latest_alert_at
    ),
    'generated_at', now()
  ) INTO result
  FROM quality, duplicate_ids, category_counts, severity_counts;

  RETURN result;
END;
$function$;
REVOKE ALL ON FUNCTION public.get_threat_intel_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_threat_intel_health() TO authenticated, service_role;