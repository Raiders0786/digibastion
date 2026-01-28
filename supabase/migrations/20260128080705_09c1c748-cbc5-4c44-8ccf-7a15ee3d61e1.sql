-- Add enhanced tracking columns to email_events
ALTER TABLE public.email_events 
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS timestamp_utc TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS email_client TEXT;

-- Create index for faster country-based queries
CREATE INDEX IF NOT EXISTS idx_email_events_country ON public.email_events(country_code);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp ON public.email_events(timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_subscription ON public.email_events(subscription_id);