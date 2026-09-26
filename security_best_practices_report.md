# Security Best-Practices Review

Review date: 2026-09-27
Scope: React/Vite client, Vercel response configuration, server-rendered OG endpoint,
Supabase Edge Functions, dependency and repository hygiene.

## Executive summary

The review found six actionable issues. All six were remediated in this change set.
The npm production and development trees now report zero known vulnerabilities.
No service-role key, cron secret, provider credential, password, or other confirmed
server secret was found in the checked-out source. The removed tracked `.env` held
Supabase browser/publishable configuration, which is intentionally public at runtime,
but tracking local environment files creates a dangerous precedent for later secrets.

This was a source and local-browser review, not a live infrastructure penetration
test. Deployment secrets, database policies, deployed Edge Function revisions, email
delivery, scheduled jobs, and production response headers still require validation in
the owning Supabase/Vercel projects.

## Remediated findings

### SEC-001 — Tracked environment file and weak secret hygiene

- Severity: Medium
- Status: Fixed
- Evidence: `.gitignore:16-18`, `.env.example:1-4`
- Risk: A tracked `.env` makes it easy to commit server credentials accidentally and
  teaches contributors to mix public browser values with private deployment secrets.
- Remediation: Removed `.env` from version control, ignored all environment variants,
  added a public-only template, and documented that service-role/provider/cron/email
  credentials must remain in the deployment secret store.
- Follow-up: If a non-publishable credential ever existed in Git history or Lovable
  project settings, rotate it. The values observed in the current tracked file were
  named only as Supabase publishable/browser configuration.

### SEC-002 — Known vulnerable and unreproducible JavaScript dependencies

- Severity: High
- Status: Fixed
- Evidence: `package.json:6-19`, `package.json:80-103`, `package-lock.json`
- Risk: The previous dependency tree reported 18 advisories, including nine high
  severity findings. The lock file was also inconsistent with the manifest, so
  `npm ci` failed.
- Remediation: Updated the affected build/test/lint toolchain, regenerated the lock,
  removed the obsolete remote-editor tagger, added a supported Node engine, and added
  one-command type/lint/test/build verification.
- Verification: `npm audit --audit-level=low` and `npm audit --omit=dev
  --audit-level=low` both return zero vulnerabilities.

### SEC-003 — Unsafe third-party script, permissive policy, and public source maps

- Severity: High
- Status: Fixed with one documented hardening opportunity
- Evidence: `index.html:69-71`, `vercel.json:8-25`, `vite.config.ts:8-18`,
  `vite.config.ts:52-74`
- Risk: Every page loaded an unrelated third-party script; the policy allowed
  `unsafe-eval`, insecure HTTP images, and that script host; production builds exposed
  source maps; local servers listened on all interfaces with broad CORS.
- Remediation: Removed the script and host, removed `unsafe-eval` and HTTP image
  loading, added object/worker/manifest restrictions and HTTPS upgrades, disabled
  production source maps, and bound local servers to loopback without broad CORS.
- Remaining hardening: `script-src 'unsafe-inline'` is retained for the app's inline
  structured-data scripts, and `style-src 'unsafe-inline'` is retained for current UI
  styling. A future nonce- or hash-based server-rendering strategy would permit their
  removal. The known JSON-LD inputs are now safely serialized (SEC-005).

### SEC-004 — Untrusted database URLs opened without protocol validation

- Severity: High
- Status: Fixed
- Evidence: `src/utils/safeUrl.ts:1-20`,
  `src/components/news/NewsDetail.tsx:294-348`
- Risk: Feed and metadata URLs are externally sourced. Passing them directly to links
  or `window.open` could allow active schemes such as `javascript:` if malicious data
  reached the database.
- Remediation: Centralized URL parsing, allowlisted only HTTP/HTTPS, rejected malformed
  values, validated structured source arrays, and consistently opened new tabs with
  `noopener,noreferrer`.
- Verification: Unit tests cover valid, malformed, and active-scheme inputs.

### SEC-005 — Dynamic JSON-LD could terminate its script element

- Severity: High
- Status: Fixed
- Evidence: `src/utils/jsonLd.ts:1-11` and all dynamic JSON-LD page components
- Risk: Raw `JSON.stringify` output inside a script element does not escape `</script>`.
  Content containing that sequence can become script markup even though its MIME type
  is JSON-LD.
- Remediation: Added a single serializer that escapes HTML-significant characters and
  JavaScript line separators, then applied it to all dynamic structured-data sinks.
- Verification: A regression test includes a literal script-breakout payload and
  confirms safe round-trip parsing.

### SEC-006 — Remote Edge Function dependencies followed mutable version tags

- Severity: Medium
- Status: Fixed
- Evidence: `supabase/functions/fetch-quillmonitor-incidents/index.ts:1-18`,
  `supabase/functions/og-image/index.ts:1-2`, and matching imports across Edge Functions
- Risk: Imports using `@supabase/supabase-js@2` and an unversioned Deno module can
  change between deployments without a repository change. One function also imported
  a CORS helper from a package subpath that does not provide the app-specific policy.
- Remediation: Pinned Supabase JS to `2.117.2`, pinned `resvg_wasm` to `0.2.0`, retained
  already-versioned Deno standard-library and npm imports, and defined the affected
  function's CORS headers locally.

## Authentication and authorization observations

Privileged functions inspected in this review perform their own cron-secret,
service-role, or authenticated-admin checks. Public quiz, subscription, email-token,
tracking, form, sitemap, and OG endpoints intentionally disable gateway JWT validation
and instead use purpose-specific validation/rate limiting where applicable. Because
this architecture depends on application-level checks, every deployed function should
be smoke-tested after deployment and Supabase Row Level Security policies should be
reviewed in the live project before treating the backend as fully verified.

## Verification performed

- TypeScript compilation completed without errors.
- ESLint completed without errors (remaining warnings are typed technical debt, not
  confirmed vulnerabilities).
- 35 Vitest tests passed across six test files.
- Production Vite build completed successfully without production source maps.
- npm audit reported zero development or production dependency vulnerabilities.
- Browser checks covered desktop/mobile rendering, threat-feed loading, key public
  routes, checklist persistence across reload, and unauthenticated admin redirection;
  no browser console errors or warnings were observed in the final flows.
