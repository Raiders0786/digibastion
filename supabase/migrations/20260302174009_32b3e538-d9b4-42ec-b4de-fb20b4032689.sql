
-- Create api_keys table
CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,
  name text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '["read:threat-intel"]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  request_count bigint NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view api_keys" ON public.api_keys
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- Only admins can insert
CREATE POLICY "Admins can insert api_keys" ON public.api_keys
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- Only admins can update
CREATE POLICY "Admins can update api_keys" ON public.api_keys
  FOR UPDATE TO authenticated
  USING (public.is_admin());

-- Only admins can delete
CREATE POLICY "Admins can delete api_keys" ON public.api_keys
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Block all public/anon access
CREATE POLICY "Block public access to api_keys" ON public.api_keys
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

-- Service role full access (for edge function)
CREATE POLICY "Service role can manage api_keys" ON public.api_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);
