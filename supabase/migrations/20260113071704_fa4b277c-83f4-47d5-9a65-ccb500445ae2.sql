-- Add metadata column for storing additional incident details (amount lost, chain, attack type, etc.)
-- This allows future extensibility without schema changes
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_news_articles_metadata 
ON public.news_articles USING GIN(metadata);

-- Add comment explaining the metadata structure
COMMENT ON COLUMN public.news_articles.metadata IS 'Extensible JSON metadata: amount_lost_usd, chain, attack_type, post_mortem_url, project_category, etc.';