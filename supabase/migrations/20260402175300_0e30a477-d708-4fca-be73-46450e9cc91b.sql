
-- cron_health_snapshots: block authenticated UPDATE/DELETE + add service_role
CREATE POLICY "Block authenticated update on cron_health_snapshots"
  ON public.cron_health_snapshots FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Block authenticated delete on cron_health_snapshots"
  ON public.cron_health_snapshots FOR DELETE TO authenticated
  USING (false);

CREATE POLICY "Service role can manage cron_health_snapshots"
  ON public.cron_health_snapshots FOR ALL TO service_role
  USING (true) WITH CHECK (true);
