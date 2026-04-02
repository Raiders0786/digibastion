
-- 1. CRITICAL: Block authenticated write on user_roles (prevent privilege escalation)
CREATE POLICY "Block authenticated insert on user_roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block authenticated update on user_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Block authenticated delete on user_roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (false);

-- 2. LOW: Add NULL warning in get_cron_auth_headers()
CREATE OR REPLACE FUNCTION public.get_cron_auth_headers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret_val text;
BEGIN
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
  
  IF secret_val IS NULL THEN
    RAISE WARNING '[get_cron_auth_headers] CRON_SECRET not found in app_config or vault — all cron jobs will fail authentication';
  END IF;
  
  RETURN jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || coalesce(secret_val, '')
  );
END;
$$;
