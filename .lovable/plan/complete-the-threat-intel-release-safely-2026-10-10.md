# Complete the Threat Intel release safely

## 1. Fix the missed Meter duplicate
- Add a conservative matching path using shared incident-reference URLs, matching incident dates and matching positive loss amounts. Read structured source links as well as the existing reference field.
- Do not introduce broad fuzzy headline matching or merge records merely because they mention the same project.
- Add tests using the actual Meter reports, including safeguards for different incidents, generic provider homepages, and Limit Break versus Magic Eden. Preserve existing NEAR Intents tests.
- Redeploy only functions affected by the shared matcher change, with their shared imports.

## 2. Review and apply duplicate cleanup
- Run the authorized 90-day dry run again and inspect every returned pair.
- Require both Meter and NEAR Intents matches, no Limit Break/Magic Eden match, and no ambiguous pair before writing.
- Apply the reviewed duplicate marks and source merges. Repeat the dry run and require `duplicatesToMark = 0`, `canonicalSourceUpdates = 0`, and no write errors.
- Keep original records and source attribution; do not delete incidents. Skip the optional historical loss cleanup.

## 3. Apply and verify the database release
- Inspect the existing database state and apply only the two uploaded-release migrations, in order: stats, then incident filters. Do not reapply migrations already recorded as complete.
- Reload the API schema and run every supplied sanity check: four unique function signatures, count/stat agreement, severity totals and ordering, hidden duplicates, status/source totals, facet counts, anonymous access, returned creation dates, and query timing.
- Test the three public API requests and require no ambiguous-function errors. Stop before publishing if a release check fails.

## 4. Finish deployment and publish
- Deploy the repository versions of the two subscription functions with their shared imports.
- Verify preview checks and focused regression tests; retain only necessary compatibility fixes.
- Publish the existing Threat Intel frontend after the database checks pass.
- Check the live site while logged out at 390px and desktop widths: default Web3 view, all-news view, one Meter/NEAR incident each, whole-view stats, source attribution, filter URL updates, incident details, methodology page and sitemap, and alerts.

## Safeguards and reporting
- Use only the existing Lovable Cloud backend. Do not change secrets, schedules, provider enablement, or activate SlowMist.
- Verify function-level authorization remains enforced and duplicate-function platform JWT settings remain as committed.
- Inspect available QuillMonitor and summarization logs for filter parse errors. Report scheduled runs as unverified if their next execution has not occurred; do not manufacture a scheduled-run result.
- Return deployed revisions, migration outcomes, duplicate-run JSON, live checks, and any remaining blocker.

## Technical details
- Keep the matching logic in the existing shared incident matcher and document the safety rule in the existing architecture rules.
- Preserve source independence, metadata-based incident fields, private health telemetry, and server-only credentials.
- Scope is the uploaded release plus the confirmed Meter matching correction, not a redesign or unrelated security cleanup.