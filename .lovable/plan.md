

## Implementation Plan

### 1. `public/robots.txt` — AI-Friendly with Sensitive Path Blocking
Allow all bots (including AI) on public content. Block only sensitive/utility paths:
- `/admin`, `/verify-email`, `/manage-subscription`, `/present`, `/unsubscribe`, `/quiz-result`
- No full bot blocks — maximize discoverability in crypto/security space
- Update sitemap reference to `sitemap-index.xml`

### 2. `index.html` — Fix OG URL Consistency
Add `www.` prefix to all URLs missing it (lines 19, 22, 33, 36, 47, 79, 101, 113, 144). Ensures canonical consistency with MetaTags component which uses `www.digibastion.com`.

### 3. `public/sitemap-index.xml` — Update Stale Dates
Change `lastmod` from `2025-01-19` to `2026-03-02`.

### 4. `src/pages/ManageSubscription.tsx` — Add `noindex`
Add `noindex={true}` to all 3 MetaTags instances (lines 278, 308, 399).

### 5. `src/pages/VerifyEmail.tsx` — Add MetaTags with `noindex`
Import and add `<MetaTags noindex={true} title="Verify Email - Digibastion" />` at the top of the render.

### 6. `src/pages/Present.tsx` — Add MetaTags with `noindex`
Import MetaTags and add `<MetaTags noindex={true} title="Digibastion — Presentation" />` inside the component.

### 7. `src/pages/AdminApiKeys.tsx` — Security + UX Fixes
- **Line 86**: Replace hardcoded Supabase URL with `` `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/threat-intel-api` ``
- **Line 195-202**: Add a confirmation dialog before permanent key deletion (currently one misclick deletes forever)
- The curl examples and API docs in the admin page are fine to keep — they're behind admin auth and useful for sharing with API consumers

### 8. `src/components/Footer.tsx` — Client-Side Navigation
Change the "Support Us" link from `<a href="https://www.digibastion.com/support" target="_blank">` to use React Router `Link` for instant client-side navigation.

### 9. `supabase/functions/threat-intel-api/index.ts` — Strengthen IP Hashing
Replace the weak `hashIp` function (lines 48-56) with an async SHA-256 based hash using a salt, similar to the existing `hashKey` pattern. This prevents collision and reversibility issues.

---

**Total: 9 files changed.** All changes are backwards-compatible and don't break existing functionality.

