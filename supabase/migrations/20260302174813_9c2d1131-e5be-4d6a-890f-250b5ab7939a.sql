
-- Create api_usage_logs table for audit trail
CREATE TABLE public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL DEFAULT 'threat-intel-api',
  method text NOT NULL DEFAULT 'POST',
  status_code integer NOT NULL,
  response_time_ms integer,
  ip_hash text,
  request_params jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for rate limiting lookups (key + time window)
CREATE INDEX idx_api_usage_logs_rate_limit ON public.api_usage_logs (api_key_id, created_at DESC);

-- Index for admin dashboard queries
CREATE INDEX idx_api_usage_logs_created_at ON public.api_usage_logs (created_at DESC);

-- Enable RLS
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admin can view logs
CREATE POLICY "Admins can view api_usage_logs" ON public.api_usage_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Block public access
CREATE POLICY "Block public access to api_usage_logs" ON public.api_usage_logs
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

-- Service role full access (edge function writes)
CREATE POLICY "Service role can manage api_usage_logs" ON public.api_usage_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup old logs (keep 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_api_usage_logs()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  DELETE FROM public.api_usage_logs
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$;
