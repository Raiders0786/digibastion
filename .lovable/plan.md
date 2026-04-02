

# End-to-End Security Review & Hardening Plan

## Current Security Posture

The system is in good shape. Linter returns clean, admin auth is JWT-verified server-side, cron jobs use CRON_SECRET, and RLS is enforced on all sensitive tables. The scan flagged 4 items — 2 are real gaps, 2 are effectively false positives.

## Findings & Fixes

### 1. `api_usage_logs` — Missing explicit INSERT/UPDATE/DELETE block for authenticated (WARN)

**Risk**: Non-admin authenticated users have no matching INSERT/UPDATE/DELETE policy. Postgres defaults to deny, but explicit block is best practice and silences the security scanner.

**Fix**: Add 3 RLS policies:
```sql
CREATE POLICY "Block authenticated insert on api_usage_logs"
  ON public.api_usage_logs FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block authenticated update on api_usage_logs"
  ON public.api_usage_logs FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Block authenticated delete on api_usage_logs"
  ON public.api_usage_logs FOR DELETE TO authenticated
  USING (false);
```

### 2. `api_keys` — Existing `is_admin()` policies cover access, but scanner flags them (WARN)

**Risk**: The `is_admin()` WITH CHECK / USING already denies non-admin authenticated users. However, if `is_admin()` ever errors or returns NULL, Postgres treats it as deny — so this is safe. To silence the scanner and add defense-in-depth, add explicit non-admin block policies.

**Fix**: No action strictly needed — `is_admin()` returning false already blocks. But to satisfy scanner, add restrictive policies for non-admin authenticated:
```sql
-- These are technically redundant but make the security posture explicit
CREATE POLICY "Block non-admin insert on api_keys"
  ON public.api_keys FOR INSERT TO authenticated
  WITH CHECK (is_admin());
-- Already exists as "Admins can insert api_keys" — scanner may be confused.
```

**Decision**: Mark this as an acknowledged false positive since `is_admin()` check already covers it.

### 3. `email_analytics_daily` — VIEW, not a table (FALSE POSITIVE)

**Status**: This is a VIEW with `security_invoker=on` that queries `email_events`. The `email_events` table blocks all anon/authenticated access. The view inherits this restriction. No fix needed — mark as ignored.

### 4. `realtime.messages` — Reserved schema (NO ACTION)

**Status**: This is a Supabase-reserved schema (`realtime`). We cannot and should not modify it. The app doesn't use Realtime subscriptions for sensitive data — news articles are public. Mark as ignored.

## Action Summary

| # | Item | Action | Type |
|---|------|--------|------|
| 1 | `api_usage_logs` missing authenticated write block | Add 3 explicit block policies | DB Migration |
| 2 | `api_keys` non-admin block | Already covered by `is_admin()` — ignore scanner finding | Scanner update |
| 3 | `email_analytics_daily` no RLS | VIEW with security_invoker — false positive | Scanner update |
| 4 | `realtime.messages` | Reserved schema, no action | Scanner update |

## Verification After Implementation

- Run security scan to confirm 0 findings
- Test admin login → analytics/cron/api-keys all load
- Test public pages (threat-intel, quiz, leaderboard) all load without auth
- Test subscription flow (subscribe → verify → manage) works
- Test cron jobs continue executing (check cron monitor)

All changes are backward-compatible. Only 1 migration needed.

