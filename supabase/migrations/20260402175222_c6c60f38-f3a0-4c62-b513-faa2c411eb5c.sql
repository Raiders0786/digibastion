
CREATE POLICY "Block authenticated insert on api_usage_logs"
  ON public.api_usage_logs FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block authenticated update on api_usage_logs"
  ON public.api_usage_logs FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Block authenticated delete on api_usage_logs"
  ON public.api_usage_logs FOR DELETE TO authenticated
  USING (false);
