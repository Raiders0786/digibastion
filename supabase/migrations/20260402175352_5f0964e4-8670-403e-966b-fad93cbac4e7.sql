
CREATE POLICY "Service role can manage quiz_scores"
  ON public.quiz_scores FOR ALL TO service_role
  USING (true) WITH CHECK (true);
