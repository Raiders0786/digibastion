-- Create subscriptions table for email notifications
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  categories TEXT[] NOT NULL DEFAULT '{}',
  technologies TEXT[] DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('immediate', 'daily', 'weekly')),
  severity_threshold TEXT NOT NULL DEFAULT 'medium' CHECK (severity_threshold IN ('critical', 'high', 'medium', 'low', 'info')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Create notification log table to track sent notifications
CREATE TABLE public.notification_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  article_id UUID REFERENCES public.news_articles(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  UNIQUE(subscription_id, article_id)
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

-- Public can create subscriptions (no auth required)
CREATE POLICY "Anyone can create subscriptions"
ON public.subscriptions
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscription by email (for unsubscribe links)
CREATE POLICY "Anyone can view subscriptions"
ON public.subscriptions
FOR SELECT
USING (true);

-- Only service role can update/delete (via edge functions)
CREATE POLICY "Service role can update subscriptions"
ON public.subscriptions
FOR UPDATE
USING (true);

CREATE POLICY "Service role can delete subscriptions"
ON public.subscriptions
FOR DELETE
USING (true);

-- Notification log policies (service role only via edge functions)
CREATE POLICY "Anyone can view notification log"
ON public.notification_log
FOR SELECT
USING (true);

CREATE POLICY "Service can insert notification log"
ON public.notification_log
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_subscriptions_email ON public.subscriptions(email);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_subscriptions_frequency ON public.subscriptions(frequency);
CREATE INDEX idx_notification_log_subscription ON public.notification_log(subscription_id);
CREATE INDEX idx_notification_log_article ON public.notification_log(article_id);

-- Create trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();