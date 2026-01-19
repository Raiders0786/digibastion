-- Email analytics tracking tables

-- 1. Email events table - tracks opens, clicks, etc.
CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL, -- 'digest', 'critical_alert'
  event_type TEXT NOT NULL, -- 'sent', 'open', 'click'
  tracking_id UUID NOT NULL, -- unique per email sent
  link_url TEXT, -- for click events
  user_agent TEXT,
  ip_hash TEXT, -- hashed for privacy
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying
CREATE INDEX idx_email_events_tracking_id ON public.email_events(tracking_id);
CREATE INDEX idx_email_events_created_at ON public.email_events(created_at DESC);
CREATE INDEX idx_email_events_type ON public.email_events(email_type, event_type);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Block all public access - analytics are private
CREATE POLICY "Block public access to email_events"
ON public.email_events
FOR ALL
TO anon, authenticated
USING (false);

-- Service role only
CREATE POLICY "Service role can manage email_events"
ON public.email_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. User roles for admin authentication
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Block public access to roles
CREATE POLICY "Block public access to user_roles"
ON public.user_roles
FOR ALL
TO anon
USING (false);

-- Users can only see their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only service role can manage roles
CREATE POLICY "Service role can manage user_roles"
ON public.user_roles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- 5. Aggregated email stats view (for dashboard performance)
CREATE OR REPLACE VIEW public.email_analytics_daily AS
SELECT 
  DATE_TRUNC('day', created_at) AS day,
  email_type,
  event_type,
  COUNT(*) as event_count
FROM public.email_events
GROUP BY DATE_TRUNC('day', created_at), email_type, event_type
ORDER BY day DESC;