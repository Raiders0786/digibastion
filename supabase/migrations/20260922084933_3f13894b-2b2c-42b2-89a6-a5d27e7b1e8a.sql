CREATE TABLE public.cron_http_requests (
  request_id bigint PRIMARY KEY,
  jobname text NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.cron_http_requests TO service_role;

ALTER TABLE public.cron_http_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX cron_http_requests_requested_at_idx
  ON public.cron_http_requests (requested_at DESC);

CREATE OR REPLACE FUNCTION public.record_cron_http_request(
  _jobname text,
  _url text,
  _body jsonb DEFAULT '{}'::jsonb,
  _timeout_milliseconds integer DEFAULT 120000
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  request_id bigint;
  expected_prefix constant text := 'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/';
BEGIN
  IF _jobname IS NULL OR length(_jobname) > 100 THEN
    RAISE EXCEPTION 'Invalid cron job name';
  END IF;
  IF _url IS NULL OR left(_url, length(expected_prefix)) <> expected_prefix THEN
    RAISE EXCEPTION 'Cron URL is not allowed';
  END IF;
  IF _timeout_milliseconds < 1000 OR _timeout_milliseconds > 300000 THEN
    RAISE EXCEPTION 'Invalid cron timeout';
  END IF;

  SELECT net.http_post(
    url := _url,
    headers := public.get_cron_auth_headers(),
    body := _body,
    timeout_milliseconds := _timeout_milliseconds
  ) INTO request_id;

  INSERT INTO public.cron_http_requests (request_id, jobname)
  VALUES (request_id, _jobname);

  RETURN request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_cron_http_request(text, text, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cron_http_request(text, text, jsonb, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.get_cron_monitor_data(hours_back integer DEFAULT 24)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron, net
AS $$
DECLARE
  cutoff timestamptz;
  result jsonb;
BEGIN
  IF hours_back < 1 OR hours_back > 168 THEN
    RAISE EXCEPTION 'hours_back must be between 1 and 168';
  END IF;
  cutoff := now() - make_interval(hours => hours_back);

  WITH http_runs AS (
    SELECT
      tracked.jobname,
      tracked.requested_at,
      response.status_code,
      response.error_msg,
      CASE
        WHEN response.error_msg IS NOT NULL THEN 'failed'
        WHEN response.status_code BETWEEN 200 AND 299 THEN 'succeeded'
        WHEN response.status_code IS NULL THEN 'pending'
        ELSE 'failed'
      END AS outcome
    FROM public.cron_http_requests tracked
    LEFT JOIN net._http_response response ON response.id = tracked.request_id
    WHERE tracked.requested_at >= cutoff
  ),
  direct_runs AS (
    SELECT
      job.jobname,
      details.start_time AS requested_at,
      NULL::integer AS status_code,
      CASE WHEN details.status = 'failed' THEN details.return_message ELSE NULL END AS error_msg,
      CASE WHEN details.status = 'succeeded' THEN 'succeeded' ELSE 'failed' END AS outcome
    FROM cron.job job
    JOIN cron.job_run_details details ON details.jobid = job.jobid
    WHERE details.start_time >= cutoff
      AND job.command NOT LIKE '%record_cron_http_request%'
  ),
  all_runs AS (
    SELECT jobname, requested_at, status_code, error_msg, outcome FROM http_runs
    UNION ALL
    SELECT jobname, requested_at, status_code, error_msg, outcome FROM direct_runs
  ),
  job_rows AS (
    SELECT jsonb_build_object(
      'jobname', job.jobname,
      'schedule', job.schedule,
      'active', job.active,
      'last_run', latest.requested_at,
      'last_status', latest.outcome,
      'last_error', latest.error_msg,
      'recent_successes', count(*) FILTER (WHERE runs.outcome = 'succeeded'),
      'recent_failures', count(*) FILTER (WHERE runs.outcome = 'failed')
    ) AS value
    FROM cron.job job
    LEFT JOIN all_runs runs ON runs.jobname = job.jobname
    LEFT JOIN LATERAL (
      SELECT requested_at, outcome, error_msg
      FROM all_runs latest_run
      WHERE latest_run.jobname = job.jobname
      ORDER BY requested_at DESC
      LIMIT 1
    ) latest ON true
    GROUP BY job.jobname, job.schedule, job.active,
      latest.requested_at, latest.outcome, latest.error_msg
    ORDER BY job.jobname
  ),
  error_rows AS (
    SELECT jsonb_build_object(
      'id', row_number() OVER (ORDER BY requested_at DESC),
      'created', requested_at,
      'error', coalesce(error_msg, 'HTTP ' || status_code::text),
      'status_code', status_code
    ) AS value
    FROM all_runs
    WHERE outcome = 'failed'
    ORDER BY requested_at DESC
    LIMIT 10
  ),
  totals AS (
    SELECT
      count(*) FILTER (WHERE outcome <> 'pending') AS total_runs,
      count(*) FILTER (WHERE outcome = 'failed') AS failed_runs,
      count(*) FILTER (WHERE error_msg ILIKE '%timeout%') AS timeout_errors,
      count(*) FILTER (WHERE status_code >= 400) AS http_errors
    FROM all_runs
  )
  SELECT jsonb_build_object(
    'jobs', coalesce((SELECT jsonb_agg(value) FROM job_rows), '[]'::jsonb),
    'recent_errors', coalesce((SELECT jsonb_agg(value) FROM error_rows), '[]'::jsonb),
    'total_runs', totals.total_runs,
    'failed_runs', totals.failed_runs,
    'timeout_errors', totals.timeout_errors,
    'http_errors', totals.http_errors
  ) INTO result
  FROM totals;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cron_monitor_data(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_monitor_data(integer) TO service_role;

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'fetch-rss-news-hourly',
  'fetch-web3-incidents-6hourly',
  'summarize-articles-6hourly',
  'send-hourly-digests',
  'send-critical-alerts-hourly',
  'weekly-admin-summary'
);

SELECT cron.schedule('fetch-rss-news-hourly', '15 * * * *', $$
  SELECT public.record_cron_http_request(
    'fetch-rss-news-hourly',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/fetch-rss-news',
    '{"source":"cron"}'::jsonb,
    120000
  );
$$);

SELECT cron.schedule('send-critical-alerts-hourly', '15 * * * *', $$
  SELECT public.record_cron_http_request(
    'send-critical-alerts-hourly',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/send-critical-alerts',
    '{}'::jsonb,
    120000
  );
$$);

SELECT cron.schedule('send-hourly-digests', '0 * * * *', $$
  SELECT public.record_cron_http_request(
    'send-hourly-digests',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/send-digest-emails',
    '{"source":"cron"}'::jsonb,
    180000
  );
$$);

SELECT cron.schedule('weekly-admin-summary', '5 7 * * 1', $$
  SELECT public.record_cron_http_request(
    'weekly-admin-summary',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/weekly-admin-summary',
    '{"source":"cron"}'::jsonb,
    120000
  );
$$);

SELECT cron.schedule('fetch-web3-incidents-6hourly', '30 */6 * * *', $$
  SELECT public.record_cron_http_request(
    'fetch-web3-incidents-6hourly',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/fetch-web3-incidents',
    '{"source":"cron"}'::jsonb,
    120000
  );
$$);

SELECT cron.schedule('summarize-articles-6hourly', '45 */6 * * *', $$
  SELECT public.record_cron_http_request(
    'summarize-articles-6hourly',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/summarize-article',
    '{"limit":20}'::jsonb,
    180000
  );
$$);

UPDATE public.rss_feeds
SET is_active = false
WHERE name = 'NVD Analyzed CVEs'
  AND is_active = true;