-- Fix the view to use security_invoker instead of security_definer
DROP VIEW IF EXISTS public.email_analytics_daily;

CREATE VIEW public.email_analytics_daily 
WITH (security_invoker = on) AS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  email_type,
  event_type,
  COUNT(*) as event_count
FROM public.email_events
GROUP BY DATE_TRUNC('day', created_at), email_type, event_type
ORDER BY day DESC;