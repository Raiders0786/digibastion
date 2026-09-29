# Lovable SlowMist ingestion release

The source and UI can be deployed safely while ingestion remains disabled.
Do not enable the provider or create its scheduled job until the project owner
has written SlowMist permission for ongoing retrieval, storage, normalization,
and attributed display of the public incident facts.

## Safe preparation prompt

Use this after the corresponding commit is pushed to GitHub `main`:

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub
main commit <EXACT_SHA>. Do not rewrite application source, create another
backend, expose provider responses, or activate SlowMist ingestion.

1. Apply only:
   supabase/migrations/20260929164000_prepare_slowmist_ingestion.sql
2. Deploy the repository version of fetch-slowmist-incidents and its shared
   imports. Confirm platform JWT verification is disabled as declared in
   supabase/config.toml, while the function continues to require CRON_SECRET,
   service-role, or authenticated-admin authorization.
3. Keep SLOWMIST_INGESTION_ENABLED absent or set to false.
4. Confirm no fetch-slowmist-incidents cron job exists and an authorized manual
   invocation returns the permission-gate response without contacting SlowMist
   or recording a failed health run.
5. Confirm the private ingestion-health schema accepts the slowmist pipeline,
   remains service-role-only, and reports the dormant pipeline as unknown.
6. Smoke-test /threat-intel and confirm existing QuillMonitor/RSS behavior,
   source links, cards, alerts, and filters are unchanged.
7. Return the deployed Git revision, migration/function state, authorization
   result, and confirmation that the provider remains disabled.
```

## Activation after permission

After permission is recorded, add a reviewed migration that schedules
`fetch-slowmist-incidents-4hourly` at `7 1,5,9,13,17,21 * * *` through
`public.record_cron_http_request`, then set
`SLOWMIST_INGESTION_ENABLED=true`. Deploy the function before scheduling it.

Run it twice manually before relying on the job. The first run must report only
sanitized aggregate accepted, skipped, inserted, updated, invalid, and duplicate
counts. The second must perform zero writes when the provider page is unchanged.
Verify that high-confidence QuillMonitor/Web3 overlaps are skipped or hidden,
that no provider prose or image data is stored, and that source attribution is
visible on both card and detail views.
