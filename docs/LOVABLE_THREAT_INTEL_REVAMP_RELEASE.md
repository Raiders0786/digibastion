# Lovable Threat Intel revamp release (Phase 0 + Phase 2)

Ships one record per incident with correct amounts, dates and sources
(Phase 0), then the new Threat Intel page: Web3 incidents by default,
whole-result stats and severity sort, incident filters, rebuilt cards and
incident page, and a methodology page (Phase 2).

No new secrets. Run the stages in order. Stage 2 must finish before Stage 4,
because the new page calls RPC arguments that only exist after the
migrations.

## Stage 1: backend data fixes (Phase 0)

Every `dedupe-incidents` call below is an authorized POST. Lovable sends it
with `Authorization: Bearer <CRON_SECRET>`, reading the project's CRON_SECRET
from the backend secrets without displaying it.

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub
main commit <EXACT_SHA>. Do not rewrite application source, create another
backend, or print any secret value. Do not apply any migration in this stage.

1. Deploy the repository versions of these edge functions with their shared
   imports under supabase/functions/_shared/: fetch-web3-incidents,
   fetch-quillmonitor-incidents, fetch-slowmist-incidents, summarize-article,
   fetch-rss-news, post-telegram-alerts, and the new dedupe-incidents. Confirm
   dedupe-incidents has platform JWT verification disabled as declared in
   supabase/config.toml; the function itself requires CRON_SECRET, the
   service-role key, or an admin.
2. Authenticate every dedupe-incidents call with the project's CRON_SECRET from
   the backend secrets, sent as "Authorization: Bearer <secret>". Never display,
   log or return the secret.
3. Invoke dedupe-incidents with the POST body
   {"dryRun":true,"repairLegacyAmounts":true,"days":3650} and return the full
   JSON response.
4. Return the deployed Git revision and the response. Do not run anything with
   dryRun false yet.
```

Behaviour changes in this stage:

- Severity for QuillMonitor attack strings with punctuation (for example
  "Flash-loan") now rates High, where it previously could rate lower.
- Telegram posts label AI-written summaries with "AI summary:". The
  post-update sync edits posts from the last 14 days that carry an AI summary
  so they show the label too. That is expected; those edits are not new
  incidents.

### Step 1a: repair legacy loss figures (required)

The old web3-incidents importer read "$50,000" as $50,000M ("$50000M") and
rated those rows Critical, which inflates the Critical tile, severity sort and
alerts. The new page (Stage 4) shows no loss figure for unrepaired rows. The repair
re-reads each figure from the row's title, summary and content, recomputes the
severity from the amount and attack type, and stamps `amount_parser: "v2"`.

Review the dry-run response from step 3 above:

- `legacyAmountRows` is the number of old-importer rows; each one is stamped.
- `legacyAmountChanges` counts the rows whose figure or severity changes, and
  `samples` shows up to 20 of them as `before` and `after`.
- Each `after.amountUsd` must be the figure in that row's title or text (for
  example "$50,000" becomes 50000 and severity medium). A row with no figure
  in its text loses its amount and is rated from its attack type.

Do not paste the next block until you have reviewed the samples.

```text
Invoke dedupe-incidents with the POST body
{"dryRun":false,"repairLegacyAmounts":true,"days":3650}, authenticated with the
project's CRON_SECRET from the backend secrets without displaying it, and
return the JSON response. Then invoke it again with
{"dryRun":true,"repairLegacyAmounts":true,"days":3650} and return that
response too. The second response must show legacyAmountRows 0.
```

If the write run returns HTTP 207 with `writeErrors`, run it again; repaired
rows are skipped. `legacyAmountSkipped` counts rows the importer rewrote
during the run; they already carry correct figures.

### Step 1b: mark cross-provider duplicates

Run this after the repair, so the duplicate pass compares corrected amounts.

```text
Invoke dedupe-incidents with the POST body {"dryRun":true,"days":90},
authenticated with the project's CRON_SECRET from the backend secrets without
displaying it, and return the full JSON response. Do not run it with dryRun
false yet.
```

Review the dry-run samples yourself. They should pair the NEAR Intents
reports and the Meter reports, must not pair Limit Break with Magic Eden,
and must contain no pair that is two different incidents.

Do not paste the next block until you have reviewed the samples.

```text
Invoke dedupe-incidents with the POST body {"dryRun":false,"days":90},
authenticated with the project's CRON_SECRET from the backend secrets without
displaying it, and return the JSON response. Then invoke it again with
{"dryRun":true,"days":90} and return that response too. The second response
must show duplicatesToMark 0 and canonicalSourceUpdates 0. Then show the last
20 log lines of fetch-quillmonitor-incidents and summarize-article after their
next scheduled run, and confirm neither logged a PostgREST filter parse error.
```

If the write run returns HTTP 207 with `writeErrors`, run it again; rows that
are already correct are skipped.

### Fallback only: clear impossible loss figures by SQL

Use this only if the Step 1a repair cannot run. It removes figures above
$100B from old-importer rows; it does not fix smaller wrong figures such as
"$50000M" or their severities (the new page hides those figures anyway). The
`CASE` keeps the cast away from non-numeric values, since `AND` does not
guarantee evaluation order.

```sql
-- Preview
SELECT id, title, metadata->'amount_lost_usd' AS amount, metadata->>'amount_display' AS display
FROM public.news_articles
WHERE metadata->>'provider' IN ('web3-incidents', 'web3')
  AND CASE WHEN jsonb_typeof(metadata->'amount_lost_usd') = 'number'
        THEN (metadata->>'amount_lost_usd')::numeric > 100000000000
        ELSE false END;

-- Repair: remove the wrong figures, keep a marker
UPDATE public.news_articles
SET metadata = (metadata - 'amount_lost_usd' - 'amount_display')
  || jsonb_build_object('amount_cleared_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
WHERE metadata->>'provider' IN ('web3-incidents', 'web3')
  AND CASE WHEN jsonb_typeof(metadata->'amount_lost_usd') = 'number'
        THEN (metadata->>'amount_lost_usd')::numeric > 100000000000
        ELSE false END;
```

## Stage 2: database functions

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub
main commit <EXACT_SHA>. Do not rewrite application source or print any
secret value.

1. Apply, in this order and only these:
   supabase/migrations/20261011090000_threat_intel_stats.sql
   supabase/migrations/20261012090000_threat_intel_incident_filters.sql
2. Run NOTIFY pgrst, 'reload schema';
3. Run the sanity SQL below in the SQL editor and return every result.
4. Return the migration state.
```

Every check must match its "Expect" comment before Stage 3.

Checks from the stats migration (20261011090000), run after both migrations:

```sql
-- 1. Exactly one search, one count, one stats and one facets function remain.
--    Changed from the B3 original, which expected 3 rows: this runs after BOTH
--    migrations, and the second one adds threat_intel_facets.
SELECT p.oid::regprocedure AS signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('search_news_articles', 'count_news_articles', 'threat_intel_stats', 'threat_intel_facets')
ORDER BY 1;
-- Expect 4 rows.

-- 2. Stats total equals the count for the default Web3 view and for all news.
SELECT
  (public.threat_intel_stats(web3_incidents_only => true) ->> 'total')::bigint
    = public.count_news_articles(web3_incidents_only => true) AS web3_total_matches,
  (public.threat_intel_stats() ->> 'total')::bigint
    = public.count_news_articles() AS all_total_matches;
-- Expect true, true.

-- 3. Severity buckets add up to the total.
SELECT (s ->> 'total')::bigint
  = (s ->> 'critical')::bigint + (s ->> 'high')::bigint + (s ->> 'medium')::bigint
  + (s ->> 'low')::bigint + (s ->> 'info')::bigint AS buckets_sum_to_total
FROM public.threat_intel_stats(web3_incidents_only => true) AS s;
-- Expect true.

-- 4. Severity sort puts the most severe rows first across the whole result.
SELECT severity, published_at, title
FROM public.search_news_articles(web3_incidents_only => true, sort_by => 'severity', result_limit => 10);
-- Expect critical rows first (if any exist), newest first within a severity.

-- 5. No merged duplicates leak into the feed.
SELECT count(*) AS leaked_duplicates
FROM public.search_news_articles(result_limit => 100, web3_incidents_only => true) s
WHERE s.metadata ->> 'duplicate_of_uid' IS NOT NULL;
-- Expect 0.

-- 6. Anonymous visitors can call the stats RPC (RLS still applies: SECURITY INVOKER).
--    If the SQL editor refuses SET ROLE, check instead that the live page's
--    stat tiles say "in this view" while logged out.
SET ROLE anon;
SELECT public.threat_intel_stats(web3_incidents_only => true);
RESET ROLE;

-- 7. Cost of the extra request per filter change.
EXPLAIN (ANALYZE, BUFFERS) SELECT public.threat_intel_stats();
-- Note the execution time; anything above ~300 ms needs a follow-up index review.
```

Checks from the incident filters migration (20261012090000):

```sql
-- 1. One signature per function. Expected: 4 rows: search 13 args, count 10,
--    stats 10, facets 2.
SELECT p.oid::regprocedure
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('search_news_articles', 'count_news_articles', 'threat_intel_stats', 'threat_intel_facets')
ORDER BY 1;

-- 2. Calls without the new arguments still resolve, and count and stats agree.
SELECT public.count_news_articles(web3_incidents_only => true) AS count_total,
       (public.threat_intel_stats(web3_incidents_only => true))->>'total' AS stats_total;

-- 3. Status. Expected: unconfirmed = the stats 'unconfirmed' bucket, and
--    confirmed + unconfirmed = quillmonitor unless some QuillMonitor rows have no status.
SELECT
  (public.threat_intel_stats(web3_incidents_only => true, verification_filter => 'verified'))->>'total' AS confirmed,
  (public.threat_intel_stats(web3_incidents_only => true, verification_filter => 'unverified'))->>'total' AS unconfirmed,
  (public.threat_intel_stats(web3_incidents_only => true))->>'unconfirmed' AS unconfirmed_bucket,
  (public.threat_intel_stats(web3_incidents_only => true, provider_filter => ARRAY['quillmonitor']))->>'total' AS quillmonitor;

-- 4. The four sources cover every publishable row. Expected: equal totals.
--    A gap means a provider value this task does not know; the second query lists them.
SELECT
  (public.threat_intel_stats(provider_filter => ARRAY['quillmonitor', 'web3-incidents', 'slowmist', 'rss']))->>'total' AS by_source,
  (public.threat_intel_stats())->>'total' AS everything;
SELECT metadata->>'provider' AS provider,
       coalesce(metadata->>'is_web3_incident', '(none)') AS is_web3_incident,
       count(*)
FROM public.news_articles
WHERE coalesce(metadata->>'classification_relevant', 'true') != 'false'
  AND metadata->>'duplicate_of_uid' IS NULL
GROUP BY 1, 2
ORDER BY 3 DESC;

-- 5. Facets, and one facet count checked against the filter. Replace 'ethereum'
--    with the first chain value the first query returns. Expected: the second
--    query equals that chain's "count".
SELECT jsonb_pretty(public.threat_intel_facets('web3-incidents', NULL));
SELECT public.count_news_articles(
  web3_incidents_only => true,
  chain_filter => ARRAY['ethereum'],
  date_from => now() - interval '90 days'
);

-- 6. Anonymous visitors can call the new function. Expected: true.
SELECT has_function_privilege('anon', 'public.threat_intel_facets(text, timestamptz)', 'EXECUTE');

-- 7. created_at comes back from the search RPC. Expected: no NULLs.
SELECT count(*) FILTER (WHERE created_at IS NULL) AS missing_created_at
FROM public.search_news_articles(web3_incidents_only => true, result_limit => 100);
```

Then, with the anon key, check that PostgREST sees one candidate per function
(no PGRST203). `SUPABASE_URL` and `SUPABASE_ANON_KEY` are the project's public
URL and anon key:

```bash
curl -s "$SUPABASE_URL/rest/v1/rpc/threat_intel_stats" -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{"web3_incidents_only": true}'
curl -s "$SUPABASE_URL/rest/v1/rpc/threat_intel_stats" -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{"web3_incidents_only": true, "verification_filter": "verified", "chain_filter": ["ethereum"]}'
curl -s "$SUPABASE_URL/rest/v1/rpc/threat_intel_facets" -H "apikey: $SUPABASE_ANON_KEY" -H "Content-Type: application/json" -d '{"p_scope": "web3-incidents"}'
```

Expected: three JSON objects and no `"code":"PGRST20..."` errors.

## Stage 3: subscription functions

```text
Deploy the repository versions of submit-form and update-subscription from
GitHub main commit <EXACT_SHA> with their shared imports
(supabase/functions/_shared/news-categories.ts). Return the deployed revision.
```

## Stage 4: publish the frontend

Publish from Lovable. Then check the live site, logged out, on a phone-width
window (390px) and on desktop:

- `/threat-intel` opens the Web3 incidents view; `?scope=all` shows all
  security news.
- The first page has one card each for NEAR Intents and Meter, not two or three.
- Stat tiles say "in this view".
- A QuillMonitor-only card says "Powered by QuillMonitor"; every card names a
  source.
- "Filters (n)" opens the filter sheet on mobile; the status, chain, attack
  type and source filters change the list and the URL.
- An incident page shows the status history and the "What should I do?" block.
- `/threat-intel/methodology` loads and is in `/sitemap.xml`.

## Rollback

Frontend: republish the previous version in Lovable.

Database (only if Stage 2 must be undone, and after rolling back the frontend):

```sql
-- Signatures created by 20261012090000_threat_intel_incident_filters.sql
DROP FUNCTION IF EXISTS public.threat_intel_facets(text, timestamptz);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text, text, text[], text[], text[]);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz, text, boolean, text, text[], text[], text[]);
DROP FUNCTION IF EXISTS public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean, text, text[], text[], text[]);

-- Signatures created by 20261011090000_threat_intel_stats.sql. The second
-- migration already replaced them, so these are normally no-ops; IF EXISTS
-- makes that safe.
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz, text, boolean);
DROP FUNCTION IF EXISTS public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean);
```

Then re-create the previous definitions by running the two
`CREATE OR REPLACE FUNCTION` statements (`search_news_articles` with 8
arguments, `count_news_articles` with 6) from
`supabase/migrations/20260927180000_add_subscription_content_scope.sql`, then
`NOTIFY pgrst, 'reload schema';`. The new migrations also dropped older 6- and
7-argument `search_news_articles` overloads and 4- and 5-argument
`count_news_articles` overloads. The previous frontend calls the 8-argument
search and 6-argument count, so those two are enough.

Phase 0 functions: redeploy the previous commit. Duplicate marks written by
`dedupe-incidents` are metadata keys; they can stay, since the old page
ignores them.
