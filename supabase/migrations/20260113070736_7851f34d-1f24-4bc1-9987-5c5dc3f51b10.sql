-- 1. Add full-text search column to news_articles
ALTER TABLE public.news_articles 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create function to generate search vector from all relevant fields
CREATE OR REPLACE FUNCTION public.news_articles_search_vector(
  title text,
  summary text,
  content text,
  tags text[],
  affected_technologies text[],
  cve_id text
) RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  RETURN (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(affected_technologies, ' '), '')), 'A') ||
    setweight(to_tsvector('english', coalesce(cve_id, '')), 'A')
  );
END;
$$;

-- 3. Create trigger function to auto-update search vector
CREATE OR REPLACE FUNCTION public.news_articles_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := public.news_articles_search_vector(
    NEW.title,
    NEW.summary,
    NEW.content,
    NEW.tags,
    NEW.affected_technologies,
    NEW.cve_id
  );
  RETURN NEW;
END;
$$;

-- 4. Create trigger on insert/update
DROP TRIGGER IF EXISTS news_articles_search_update ON public.news_articles;
CREATE TRIGGER news_articles_search_update
BEFORE INSERT OR UPDATE OF title, summary, content, tags, affected_technologies, cve_id
ON public.news_articles
FOR EACH ROW
EXECUTE FUNCTION public.news_articles_search_vector_trigger();

-- 5. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_news_articles_search_vector 
ON public.news_articles USING GIN(search_vector);

-- 6. Backfill existing articles with search vectors
UPDATE public.news_articles 
SET search_vector = public.news_articles_search_vector(
  title, summary, content, tags, affected_technologies, cve_id
)
WHERE search_vector IS NULL;

-- 7. Create function to search articles with ranking
CREATE OR REPLACE FUNCTION public.search_news_articles(
  search_query text,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  result_limit int DEFAULT 100,
  result_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  summary text,
  content text,
  category text,
  severity text,
  tags text[],
  affected_technologies text[],
  link text,
  source_url text,
  source_name text,
  author text,
  cve_id text,
  published_at timestamptz,
  is_processed boolean,
  rank real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tsquery_val tsquery;
BEGIN
  -- Convert search query to tsquery with prefix matching
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;
  
  RETURN QUERY
  SELECT 
    na.id,
    na.title,
    na.summary,
    na.content,
    na.category,
    na.severity,
    na.tags,
    na.affected_technologies,
    na.link,
    na.source_url,
    na.source_name,
    na.author,
    na.cve_id,
    na.published_at,
    na.is_processed,
    CASE 
      WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val)
      ELSE 0.0
    END as rank
  FROM public.news_articles na
  WHERE 
    (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND (category_filter IS NULL OR na.category = ANY(category_filter))
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
  ORDER BY 
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0 END DESC,
    na.published_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$;

-- 8. Create function to get total count for pagination
CREATE OR REPLACE FUNCTION public.count_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tsquery_val tsquery;
  total_count bigint;
BEGIN
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;
  
  SELECT COUNT(*)
  INTO total_count
  FROM public.news_articles na
  WHERE 
    (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND (category_filter IS NULL OR na.category = ANY(category_filter))
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from);
  
  RETURN total_count;
END;
$$;

-- 9. Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 10. Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- 11. Schedule RSS news fetch every 90 minutes (1.5 hours)
SELECT cron.unschedule('fetch-rss-news-hourly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'fetch-rss-news-hourly'
);

SELECT cron.schedule(
  'fetch-rss-news-hourly',
  '0 */1 * * *',  -- Every hour at minute 0 (closest to 1.5h we can get with cron)
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-rss-news',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 12. Schedule Web3 incidents fetch every 6 hours
SELECT cron.unschedule('fetch-web3-incidents-6h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'fetch-web3-incidents-6h'
);

SELECT cron.schedule(
  'fetch-web3-incidents-6h',
  '30 */6 * * *',  -- Every 6 hours at minute 30
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/fetch-web3-incidents',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);