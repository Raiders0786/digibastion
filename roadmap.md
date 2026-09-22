# Roadmap

- [x] Diagnose current edge function and scheduled-job failures.
- [x] Hide privileged Threat Intel actions from public visitors.
- [x] Increase digest and critical-alert request timeouts.
- [x] Replace estimated cron health with real attributed outcomes.
- [x] Disable the stale NVD RSS source.
- [x] Deploy and verify all repairs without weakening authorization.
- [x] Repair and verify manual admin refresh for RSS, Web3 incidents, and AI summaries.
## Production integrity and operations hardening
- [ ] Make Active Alerts independent of feed filters and pagination.
- [ ] Make quiz scoring server-authoritative and prevent session restart/token sharing.
- [ ] Move API-key mutations behind an audited admin function and preserve usage history.
- [ ] Normalize admin authorization failures and loading states.
- [ ] Schedule unattended cron monitoring with durable alert outcomes.
- [ ] Add durable rate limits to email-triggering public endpoints.
- [ ] Restrict unnecessary SECURITY DEFINER execution grants.
- [ ] Validate and optimize the slow news query.
- [ ] Label dated analytics, remove unsupported rating schema, and redirect legacy news URLs.
- [ ] Harden Firecrawl URL checks and API rate-limit concurrency.
- [ ] Remove dead quiz cleanup function and remediate dependencies safely.
- [ ] Run regression, build, and end-to-end validation.
