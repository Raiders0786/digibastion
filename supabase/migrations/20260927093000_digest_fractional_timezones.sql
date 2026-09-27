-- Preserve quarter-hour UTC offsets so digest delivery is correct in regions
-- such as India, Nepal, Newfoundland, and parts of Australia.
ALTER TABLE public.subscriptions
  ALTER COLUMN timezone_offset TYPE numeric(5,2) USING timezone_offset::numeric,
  DROP CONSTRAINT IF EXISTS subscriptions_timezone_offset_check;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_timezone_offset_check
  CHECK (
    timezone_offset >= -12
    AND timezone_offset <= 14
    AND timezone_offset * 4 = trunc(timezone_offset * 4)
  );

COMMENT ON COLUMN public.subscriptions.preferred_hour IS 'Preferred local delivery hour (0-23)';
COMMENT ON COLUMN public.subscriptions.timezone_offset IS 'UTC offset in hours, including quarter-hour offsets (-12 to +14)';

-- Repair legacy quick-subscribe category IDs so existing subscribers match the
-- canonical feed taxonomy and can save through the stricter API validation.
UPDATE public.subscriptions AS subscription
SET categories = (
  SELECT coalesce(array_agg(mapped_category ORDER BY first_position), ARRAY[]::text[]) AS categories
  FROM (
    SELECT mapped_category, min(position) AS first_position
    FROM (
      SELECT
        CASE category
          WHEN 'wallet-security' THEN 'web3-security'
          WHEN 'smart-contract-vulnerabilities' THEN 'vulnerability-disclosure'
          ELSE category
        END AS mapped_category,
        position
      FROM unnest(subscription.categories) WITH ORDINALITY AS item(category, position)
    ) mapped
    GROUP BY mapped_category
  ) deduplicated
)
WHERE subscription.categories && ARRAY['wallet-security', 'smart-contract-vulnerabilities']::text[];

SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'send-hourly-digests';

SELECT cron.schedule('send-digests-quarter-hourly', '*/15 * * * *', $$
  SELECT public.record_cron_http_request(
    'send-digests-quarter-hourly',
    'https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/send-digest-emails',
    jsonb_build_object(
      'source', 'cron',
      'target_hour', extract(hour FROM now() AT TIME ZONE 'UTC')::integer,
      'target_minute', (extract(minute FROM now() AT TIME ZONE 'UTC')::integer / 15) * 15
    ),
    180000
  );
$$);
