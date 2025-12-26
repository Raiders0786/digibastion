-- Add verification token column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS verification_token uuid DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS verification_token_expires_at timestamp with time zone DEFAULT (now() + interval '24 hours');

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_verification_token 
ON public.subscriptions(verification_token) 
WHERE is_verified = false;