-- These non-security RSS items entered the public threat feed because the old
-- substring classifier matched `apt` in words such as "adaptations" and `tor`
-- in words such as "participatory". Keep the cleanup narrowly source/title/tag
-- scoped so legitimate Schneier security reporting is untouched.
DELETE FROM public.news_articles
WHERE source_name = 'Schneier on Security'
  AND title LIKE 'Friday Squid Blogging:%'
  AND tags && ARRAY['apt', 'tor']::text[]
  AND tags <@ ARRAY['apt', 'tor']::text[];
