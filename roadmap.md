# Current tasks

- [ ] Complete Phase 3 release checklist in order; stop at the first failed check, keep newsletters gated and Telegram settings unchanged.

- [x] Fix Meter matching conservatively and verify regression safeguards.
- [x] Review and apply duplicate cleanup; verify an idempotent dry run (15 marks, 15 source updates, 0 errors; repeat has 0 pending changes).
- [ ] Both release migrations applied byte-for-byte; database/API checks passed. Preview release check blocked: two same-provider NEAR Intents records remain by the matcher's intentional QuillMonitor exclusion.
- [ ] Deploy subscription functions, publish, and verify the live release. Paused before deployment/publishing per the approved stop-on-failed-check safeguard.

## Release verification, 2026-10-10

- Redeployed dedupe-incidents and the three incident importers with shared source-link matching. Authorization rejects invalid tokens with HTTP 401; managed cleanup requests returned HTTP 200.
- Regression tests: 57 incident/classifier tests and 104 feed/navigation/filter/card tests passed. Preview build diagnostics report OK; browser runtime has no page errors.
- Four unique public RPC signatures, all security-invoker and anonymous-executable. Count/stat agreement and severity totals passed; no returned duplicate marks or missing creation dates.
- Web3 total 2,097; confirmed 2,062 + unconfirmed 29 = QuillMonitor 2,091. Provider-filter total and unfiltered total both 21,600. Ethereum facet count matches filtered count (12). All three required anonymous HTTP requests returned 200 without overload errors.
- Stats timing: cold 430 ms, repeat 48 ms. Reviewed existing search, severity/date and metadata indexes; no speculative index added.
- SlowMist has no cron; secrets and provider enablement unchanged.
- QuillMonitor's available scheduled log at 14:17 UTC is healthy with no filter parse error, but predates the corrected deployment. Summarization logs are empty; future scheduled-run verification remains pending.
- Blocking preview evidence: QuillMonitor UIDs `quillmonitor:6abe7cb74bf2b9001882e340` (unverified, Phalcon reference) and `quillmonitor:6abf52e051c7780018c8e336` (verified, NEAR reference) both report NEAR Intents, 2026-10-01, $3.8M. The existing matcher deliberately never groups two QuillMonitor rows because provider upserts replace metadata. A durable same-provider merge needs a separately reviewed preservation/canonical-status rule, not an ad-hoc data mark or browser-only hiding.
- Meter has one publishable incident; Limit Break and Magic Eden were not grouped. Original duplicate records remain stored, with attribution merged.

- [x] Deploy the six committed Phase 0 functions, including dedupe-incidents.
- [x] Return the authorized 90-day duplicate dry run; stopped because Meter is absent from the matches.
- [x] Verify preview compatibility corrections: build OK; no migrations or publishing in Stage 1.

- [x] Run RSS with managed authorization and verify its ingestion result.
- [x] Check recent scheduled HTTP responses and cron execution failures.
- [x] Correct existing summarization compilation errors and verify deployment; authorized no-op returned 200 and unauthorized request returned 401.
- [x] Report RSS results and remaining scheduled-job status; historical RSS failures remain in the rolling monitor window, with the next hourly run not yet observed.