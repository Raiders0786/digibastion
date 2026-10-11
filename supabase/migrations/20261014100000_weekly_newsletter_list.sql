-- Public archive of weekly deep-dives for /threat-intel/weekly. Summary
-- fields only, for ready and sent issues; never the private archive (model
-- prompt, raw output and validation log). period_start is Monday 00:00 UTC,
-- so the date is read as a UTC midnight whatever the session time zone is.
DROP FUNCTION IF EXISTS public.list_weekly_newsletters(integer);

CREATE FUNCTION public.list_weekly_newsletters(p_limit integer DEFAULT 52)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT coalesce(jsonb_agg(item ORDER BY week_start DESC), '[]'::jsonb)
  FROM (
    SELECT (issue.period_start AT TIME ZONE 'UTC')::date AS week_start,
      jsonb_build_object(
        'week_start', (issue.period_start AT TIME ZONE 'UTC')::date,
        'week_end', issue.content->>'weekEnd',
        'generated_at', issue.generated_at,
        'incident_count', coalesce(nullif(issue.content->'totals'->>'incidentCount', '')::numeric, 0),
        'loss_usd', coalesce(nullif(issue.content->'totals'->>'lossUsd', '')::numeric, 0)
      ) AS item
    FROM public.newsletter_issues issue
    WHERE issue.kind = 'weekly' AND issue.status IN ('ready', 'sent')
    ORDER BY issue.period_start DESC
    LIMIT least(greatest(coalesce(p_limit, 52), 1), 200)
  ) issues;
$function$;

REVOKE ALL ON FUNCTION public.list_weekly_newsletters(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_weekly_newsletters(integer) TO anon, authenticated, service_role;
