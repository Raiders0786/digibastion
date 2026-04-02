

# Production Readiness Assessment & Hardening Plan

## Current Health Status

- **Edge Functions**: All returning 200. RSS fetch, digest emails, cron monitor all operational.
- **Database Linter**: Clean — no schema-level issues.
- **Cron Jobs**: Running (cron job 25 observed), cron-monitor reports 100% success rate.
- **Sanitization**: Fixed. Client-side safety net active in `useNewsArticles.ts`.
- **Deep Linking**: Working — `?article=<id>` fetches and displays correctly.

## Issues Found (Priority Order)

### 1. CRITICAL — Privilege Escalation on `user_roles` Table
**Risk**: An authenticated user can INSERT a row into `user_roles` granting themselves `admin`. The only blocking policy targets `anon`, not `authenticated`. Once admin, they access API keys, cron config, and all admin-only data.

**Fix**: Add explicit blocking policies for INSERT, UPDATE, DELETE on `user_roles` for `authenticated` role.

```sql
CREATE POLICY "Block authenticated write on user_roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block authenticated update on user_roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "Block authenticated delete on user_roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (false);
```

### 2. HIGH — `email_analytics_daily` Has No RLS Policies
**Risk**: This view/table has RLS enabled but zero policies. While Postgres defaults to deny, the posture is ambiguous and flagged by security scans.

**Fix**: Add explicit block + admin read policies.

```sql
CREATE POLICY "Block public access to email_analytics_daily"
  ON public.email_analytics_daily FOR ALL TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Service role can manage email_analytics_daily"
  ON public.email_analytics_daily FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

### 3. MEDIUM — Deep-Link Article Fetch Bypasses Client Sanitization
When a deep-linked article is loaded directly in `News.tsx` (lines 111-136), the data is mapped manually without calling `sanitizeText()`. Dirty DB rows would render raw HTML.

**Fix**: Apply `sanitizeText` to the direct-fetch path in `News.tsx` (title, summary, content fields in the `setSelectedArticle` call).

### 4. MEDIUM — Digest Email Content Not Sanitized
`send-digest-emails` renders `article.summary` via `escapeHtml()` which handles `<>&"'` but does NOT strip decoded HTML entities or double-encoded tags. If a dirty article exists, the email shows raw tags.

**Fix**: Add a `stripHtml` helper to `send-digest-emails/index.ts` (same loop pattern as `fetch-rss-news`) and apply to `article.title` and `article.summary` before rendering.

### 5. MEDIUM — `send-critical-alerts` Same Sanitization Gap
Same issue as #4 — `escapeHtml` only, no stripping of decoded entities.

**Fix**: Add same `stripHtml` helper.

### 6. LOW — Cron Auth Resilience
The `app_config` table approach works, but if the row is accidentally deleted, all cron jobs fail silently (empty Bearer token). There's no monitoring for this specific failure mode.

**Fix**: Add a check in `get_cron_auth_headers()` that raises a warning/notice when `secret_val` is NULL after both lookups, so it appears in Postgres logs.

### 7. LOW — Hardcoded Supabase URL in Email Functions
`send-digest-emails` (line 136, 677) and `send-critical-alerts` hardcode `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/...` instead of using `Deno.env.get('SUPABASE_URL')`. If the project ref ever changes, emails break.

**Fix**: Replace hardcoded URLs with `${Deno.env.get('SUPABASE_URL')}/functions/v1/...`.

---

## Summary of Changes

| # | Severity | File(s) | Change |
|---|----------|---------|--------|
| 1 | CRITICAL | DB migration | Block auth write on `user_roles` |
| 2 | HIGH | DB migration | Add RLS policies to `email_analytics_daily` |
| 3 | MEDIUM | `src/pages/News.tsx` | Apply `sanitizeText` to deep-link fetch |
| 4 | MEDIUM | `supabase/functions/send-digest-emails/index.ts` | Add `stripHtml` helper for article content |
| 5 | MEDIUM | `supabase/functions/send-critical-alerts/index.ts` | Add `stripHtml` helper for article content |
| 6 | LOW | DB migration | Add NULL warning in `get_cron_auth_headers()` |
| 7 | LOW | `send-digest-emails`, `send-critical-alerts` | Replace hardcoded Supabase URLs with env var |

All changes are backward-compatible. No new tables or routes needed.

