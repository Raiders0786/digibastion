# Current tasks

- [ ] Fix Meter matching conservatively and verify regression safeguards.
- [ ] Review and apply duplicate cleanup; verify an idempotent dry run.
- [ ] Apply both release migrations and pass all supplied checks.
- [ ] Deploy subscription functions, publish, and verify the live release.

- [x] Deploy the six committed Phase 0 functions, including dedupe-incidents.
- [x] Return the authorized 90-day duplicate dry run; stopped because Meter is absent from the matches.
- [x] Verify preview compatibility corrections: build OK; no migrations or publishing in Stage 1.

- [x] Run RSS with managed authorization and verify its ingestion result.
- [x] Check recent scheduled HTTP responses and cron execution failures.
- [x] Correct existing summarization compilation errors and verify deployment; authorized no-op returned 200 and unauthorized request returned 401.
- [x] Report RSS results and remaining scheduled-job status; historical RSS failures remain in the rolling monitor window, with the next hourly run not yet observed.