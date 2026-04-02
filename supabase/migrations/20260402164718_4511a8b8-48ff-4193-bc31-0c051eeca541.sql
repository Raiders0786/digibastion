CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only for app_config"
  ON public.app_config FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Block public access to app_config"
  ON public.app_config FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Update get_cron_auth_headers to read from app_config instead of vault
CREATE OR REPLACE FUNCTION public.get_cron_auth_headers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_val text;
BEGIN
  -- Try app_config first, fallback to vault
  SELECT value INTO secret_val 
  FROM public.app_config 
  WHERE key = 'CRON_SECRET' 
  LIMIT 1;
  
  IF secret_val IS NULL THEN
    SELECT decrypted_secret INTO secret_val 
    FROM vault.decrypted_secrets 
    WHERE name = 'CRON_SECRET' 
    LIMIT 1;
  END IF;
  
  RETURN jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || coalesce(secret_val, '')
  );
END;
$$;