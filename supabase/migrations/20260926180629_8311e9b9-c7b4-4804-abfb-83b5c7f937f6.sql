CREATE OR REPLACE FUNCTION public.search_news_articles(search_query text DEFAULT NULL::text, category_filter text[] DEFAULT NULL::text[], severity_filter text[] DEFAULT NULL::text[], date_from timestamp with time zone DEFAULT NULL::timestamp with time zone, result_limit integer DEFAULT 100, result_offset integer DEFAULT 0, source_filter text DEFAULT NULL::text)
RETURNS TABLE(id uuid, title text, summary text, content text, category text, severity text, tags text[], affected_technologies text[], link text, source_url text, source_name text, author text, cve_id text, published_at timestamp with time zone, is_processed boolean, metadata jsonb, rank real)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_val tsquery;
BEGIN
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
    na.metadata,
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0.0 END AS rank
  FROM public.news_articles na
  WHERE
    (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND (category_filter IS NULL OR na.category = ANY(category_filter))
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
  ORDER BY
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0 END DESC,
    na.published_at DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.count_news_articles(search_query text DEFAULT NULL::text, category_filter text[] DEFAULT NULL::text[], severity_filter text[] DEFAULT NULL::text[], date_from timestamp with time zone DEFAULT NULL::timestamp with time zone, source_filter text DEFAULT NULL::text)
RETURNS bigint
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
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
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter);

  RETURN total_count;
END;
$function$;