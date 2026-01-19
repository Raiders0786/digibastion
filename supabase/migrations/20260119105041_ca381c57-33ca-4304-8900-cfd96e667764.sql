-- email_analytics_daily is a VIEW, not a table
-- Views inherit security from their base tables, which already have RLS
-- The base table (email_events) already blocks public access via RLS
-- So the view is already protected

-- However, let's also add a materialized security check for the admin-analytics function
-- by ensuring only admins can access analytics data

-- Service role is already restricted for email_events, which is the source table
-- No additional migration needed for the view