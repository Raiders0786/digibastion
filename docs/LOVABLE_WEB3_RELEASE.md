# Lovable Web3 threat-intelligence release

Use this after the corresponding Git commit is present on `main`. The code,
tests, and migration are prepared locally; Lovable should only deploy and
verify the managed backend.

## One-shot Lovable prompt

```text
Use View Backend for this managed Lovable Cloud project. Do not rewrite the
application code and do not create a separate Supabase project.

1. Apply migration:
   supabase/migrations/20260927180000_add_subscription_content_scope.sql

2. Deploy these repository versions of the edge functions:
   - fetch-rss-news
   - fetch-web3-incidents
   - fetch-quillmonitor-incidents
   - submit-form
   - get-subscription
   - update-subscription
   - send-critical-alerts
   - send-digest-emails

3. Verify the migration before modifying historical RSS rows:
   - subscriptions.content_scope exists, is NOT NULL, defaults to "all", and
     accepts only "all" or "web3-incidents".
   - search_news_articles and count_news_articles have the new canonical Web3
     domain, incident, and classification_relevant predicates.
   - the two new metadata expression indexes exist.

4. Run fetch-rss-news historical reclassification in dry-run batches. Start
   with this protected request and continue using each returned nextOffset
   until it is null:
   {"mode":"reclassify","dryRun":true,"batchSize":250,"offset":0}
   Summarize scanned, changed, categoryChanges, newlyIrrelevant, web3Domain,
   writeErrors, and the latest threat_intel_ingestion_runs rows. Stop without
   applying if there are write errors or an obviously anomalous distribution.

5. If the dry run is healthy, repeat the same complete batch sequence with
   dryRun=false. Do not trigger email functions during the backfill. Confirm
   every batch has writeErrors=0 and the final nextOffset is null.

6. Trigger one normal run each for fetch-rss-news,
   fetch-web3-incidents, and fetch-quillmonitor-incidents. Confirm their newest
   threat_intel_ingestion_runs entries succeeded and report only sanitized
   aggregate counts—never provider payloads, credentials, or secrets.

7. Verify with read-only checks:
   - explicit classification_relevant=false rows do not appear through the
     public search/count functions;
   - Web3 Security includes records whose metadata.security_domain is web3,
     including DeFi and other precise primary categories;
   - Web3 Incidents includes only canonical incident rows;
   - Web3 Incidents + DeFi returns their intersection;
   - an existing subscription without a prior scope reads as content_scope=all;
   - a temporary/test subscription can round-trip web3-incidents through
     submit/get/update without changing a real subscriber's preferences;
   - recent email matching uses tags plus affected_technologies and excludes
     old backfilled published_at values.

8. Use the already-authorized admin test-email path to send one digest preview
   only if a verified admin test subscription already exists. Confirm HTML and
   plain text both contain the Web3 Incident marker and text-linked
   "Powered by QuillMonitor" attribution. Do not send a test to any other
   subscriber and do not expose the address in the response.

Return a concise deployment report with migration status, deployed function
versions, backfill aggregate totals, ingestion health, verification results,
and any action still required. Do not make unrelated changes.
```

## Expected public behavior

- `Web3 Security` is an umbrella interest backed by
  `metadata.security_domain = "web3"`.
- `DeFi Exploits` remains a narrower primary category.
- `Web3 Incidents` is an independent scope backed by
  `metadata.is_web3_incident = true`.
- Subscriber scope and feed scope use the same values: `all` and
  `web3-incidents`.
- QuillMonitor appears as a source on cards, linked SVG attribution on incident
  detail pages, and linked text in HTML/plain-text email.
