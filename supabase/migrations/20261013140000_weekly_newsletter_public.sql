-- lovable-cron-fallback-reviewed: the weekly Telegram link post follows the Monday 00:10 UTC weekly build; there is no row event to trigger on, so a once-a-week poll at 01:00 UTC posts the link.

-- Public read of one weekly deep-dive for /threat-intel/weekly/:weekStart.
-- newsletter_issues stays service-role only; this definer function exposes
-- ready or sent weekly issues without the private `archive` (model prompt,
-- raw output and validation log), plus the neighbouring published weeks.
-- period_start is Monday 00:00 UTC, so the date is read as a UTC midnight
-- whatever the session time zone is.
DROP FUNCTION IF EXISTS public.get_weekly_newsletter(date);

CREATE FUNCTION public.get_weekly_newsletter(p_week_start date)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT jsonb_build_object(
    'content', issue.content - 'archive',
    'generated_at', issue.generated_at,
    'previous_week_start', (
      SELECT (max(earlier.period_start) AT TIME ZONE 'UTC')::date
      FROM public.newsletter_issues earlier
      WHERE earlier.kind = 'weekly'
        AND earlier.status IN ('ready', 'sent')
        AND earlier.period_start < issue.period_start
    ),
    'next_week_start', (
      SELECT (min(later.period_start) AT TIME ZONE 'UTC')::date
      FROM public.newsletter_issues later
      WHERE later.kind = 'weekly'
        AND later.status IN ('ready', 'sent')
        AND later.period_start > issue.period_start
    )
  )
  FROM public.newsletter_issues issue
  WHERE issue.kind = 'weekly'
    AND issue.status IN ('ready', 'sent')
    AND issue.period_start = (p_week_start::timestamp AT TIME ZONE 'UTC')
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_weekly_newsletter(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_weekly_newsletter(date) TO anon, authenticated, service_role;

-- Post the link to the latest weekly issue on Telegram (Monday 01:00 UTC).
-- post-telegram-alerts applies the TELEGRAM_POSTING_ENABLED gate and test mode.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'post-weekly-telegram';

SELECT cron.schedule('post-weekly-telegram', '0 1 * * 1', $$
  SELECT public.record_cron_http_request(
    'post-weekly-telegram',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/post-telegram-alerts',
    '{"mode":"weekly"}'::jsonb,
    120000
  );
$$);
