CREATE OR REPLACE FUNCTION public.get_threat_intel_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
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
REVOKE ALL ON FUNCTION public.get_threat_intel_health() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_threat_intel_health() TO service_role;