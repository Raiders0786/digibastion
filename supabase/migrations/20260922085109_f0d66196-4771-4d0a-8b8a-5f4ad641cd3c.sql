REVOKE ALL ON FUNCTION public.record_cron_http_request(text, text, jsonb, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_cron_http_request(text, text, jsonb, integer) FROM anon;
REVOKE ALL ON FUNCTION public.record_cron_http_request(text, text, jsonb, integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_cron_http_request(text, text, jsonb, integer) TO service_role;

REVOKE ALL ON FUNCTION public.get_cron_monitor_data(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_cron_monitor_data(integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_cron_monitor_data(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_cron_monitor_data(integer) TO service_role;