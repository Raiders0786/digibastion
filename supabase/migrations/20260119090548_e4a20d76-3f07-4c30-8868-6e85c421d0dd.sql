-- Add preferred delivery time columns to subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS preferred_hour integer DEFAULT 9 CHECK (preferred_hour >= 0 AND preferred_hour <= 23),
ADD COLUMN IF NOT EXISTS timezone_offset integer DEFAULT 0 CHECK (timezone_offset >= -12 AND timezone_offset <= 14),
ADD COLUMN IF NOT EXISTS preferred_day integer DEFAULT 0 CHECK (preferred_day >= 0 AND preferred_day <= 6);

-- Add comment for clarity
COMMENT ON COLUMN public.subscriptions.preferred_hour IS 'Preferred hour for digest delivery (0-23 in UTC)';
COMMENT ON COLUMN public.subscriptions.timezone_offset IS 'UTC offset in hours (-12 to +14)';
COMMENT ON COLUMN public.subscriptions.preferred_day IS 'Preferred day for weekly digest (0=Sunday, 6=Saturday)';

-- Create a secure function to get privacy-safe subscriber count (rounded)
CREATE OR REPLACE FUNCTION public.get_subscriber_count()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count integer;
  rounded_count integer;
BEGIN
  SELECT COUNT(*) INTO total_count
  FROM subscriptions 
  WHERE is_active = true AND is_verified = true;
  
  -- Round to nearest 10 for privacy (never show exact count)
  IF total_count < 10 THEN
    rounded_count := 0;
  ELSIF total_count < 100 THEN
    rounded_count := (total_count / 10) * 10;
  ELSE
    rounded_count := (total_count / 50) * 50;
  END IF;
  
  RETURN jsonb_build_object(
    'count', rounded_count,
    'label', CASE 
      WHEN rounded_count = 0 THEN 'Join our community'
      WHEN rounded_count < 50 THEN rounded_count || '+ security professionals'
      WHEN rounded_count < 100 THEN rounded_count || '+ subscribers'
      ELSE rounded_count || '+ subscribers'
    END
  );
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_subscriber_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_subscriber_count() TO authenticated;