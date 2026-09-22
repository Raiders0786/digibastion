CREATE POLICY "No client access to cron HTTP requests"
ON public.cron_http_requests
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);