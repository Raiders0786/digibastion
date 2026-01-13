-- Fix search_path for news_articles_search_vector function
CREATE OR REPLACE FUNCTION public.news_articles_search_vector(
  title text,
  summary text,
  content text,
  tags text[],
  affected_technologies text[],
  cve_id text
) RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
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

-- Fix search_path for news_articles_search_vector_trigger function
CREATE OR REPLACE FUNCTION public.news_articles_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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