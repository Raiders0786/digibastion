-- Create table to store cron health snapshots for history tracking and alerting
CREATE TABLE public.cron_health_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'warning', 'critical')),
  total_jobs INTEGER NOT NULL DEFAULT 0,
  active_jobs INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  failed_runs INTEGER NOT NULL DEFAULT 0,
  timeout_errors INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  message TEXT
);

-- Create index for efficient querying by date
CREATE INDEX idx_cron_health_snapshots_recorded_at ON public.cron_health_snapshots(recorded_at DESC);

-- Enable RLS
ALTER TABLE public.cron_health_snapshots ENABLE ROW LEVEL SECURITY;

-- Only admins can read health snapshots
CREATE POLICY "Admins can view cron health snapshots"
  ON public.cron_health_snapshots
  FOR SELECT
  USING (public.is_admin());

-- Service role can insert (from edge function)
CREATE POLICY "Service role can insert health snapshots"
  ON public.cron_health_snapshots
  FOR INSERT
  WITH CHECK (true);

-- Cleanup old snapshots (keep 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_health_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.cron_health_snapshots 
  WHERE recorded_at < now() - INTERVAL '30 days';
END;
$$;