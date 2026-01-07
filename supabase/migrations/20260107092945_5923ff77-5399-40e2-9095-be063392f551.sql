-- =====================================================
-- ADDITIONAL SECURITY HARDENING
-- Add explicit RESTRICTIVE policies to block modifications
-- =====================================================

-- 1. RSS_FEEDS TABLE - Explicit blocks for modification
CREATE POLICY "Block public insert on rss_feeds"
ON public.rss_feeds
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block public update on rss_feeds"
ON public.rss_feeds
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Block public delete on rss_feeds"
ON public.rss_feeds
FOR DELETE
TO anon, authenticated
USING (false);

-- Service role can manage RSS feeds
CREATE POLICY "Service role can manage rss_feeds"
ON public.rss_feeds
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. SECURITY_KEYWORDS TABLE - Explicit blocks for modification
CREATE POLICY "Block public insert on security_keywords"
ON public.security_keywords
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block public update on security_keywords"
ON public.security_keywords
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Block public delete on security_keywords"
ON public.security_keywords
FOR DELETE
TO anon, authenticated
USING (false);

-- Service role can manage security keywords
CREATE POLICY "Service role can manage security_keywords"
ON public.security_keywords
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. NEWS_ARTICLES TABLE - Explicit blocks for modification
CREATE POLICY "Block public insert on news_articles"
ON public.news_articles
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "Block public update on news_articles"
ON public.news_articles
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Block public delete on news_articles"
ON public.news_articles
FOR DELETE
TO anon, authenticated
USING (false);

-- Service role can manage news articles
CREATE POLICY "Service role can manage news_articles"
ON public.news_articles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);