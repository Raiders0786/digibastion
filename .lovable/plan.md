

# Plan: Critical Regression Test Suite

## Why This Matters

As the project scales, any code change could silently break the RSS pipeline, email delivery, sanitization, deep-linking, or security scoring — leaving users with stale data, broken emails, or raw HTML. A targeted test suite catches these before they reach production.

## What Gets Tested

We focus on the **6 most breakage-prone areas** — pure logic that can be unit-tested without live infrastructure:

### 1. HTML Sanitization (highest regression risk)
The `sanitizeText` function in `useNewsArticles.ts` and the `stripHtml` helpers in edge functions are the #1 source of past bugs. Tests cover:
- Double-encoded entities (`&amp;lt;p&amp;gt;` → clean text)
- Nested HTML tags (`<p><em>text</em></p>` → `text`)
- Mixed CDATA + entities from Cisco/Debian feeds
- Null/undefined inputs return empty string
- Already-clean text passes through unchanged

### 2. RSS Feed Parsing (`fetch-rss-news`)
The XML parser is hand-rolled and fragile. Deno tests for:
- Standard RSS 2.0 `<item>` extraction
- Atom `<entry>` with `<link rel="alternate" href="..."/>` extraction
- CDATA-wrapped descriptions
- Missing title/link → item skipped (returns null)
- `cleanSummary` strips "The post appeared first on..." boilerplate

### 3. Article Categorization & Severity
Category assignment logic determines what subscribers see. Tests for:
- Web3 signal words force `web3-security` category
- Feed-level category trusted when keyword weight < 6
- Strong keyword match overrides generic feed category
- CVE extraction from content (`CVE-2024-12345`)
- Severity: "zero-day" → critical, "ransomware" → high, "advisory" → medium

### 4. News Cache (offline resilience)
Cache prevents blank pages during outages. Tests for:
- `buildFilterKey` produces stable, deterministic keys
- `saveToCache` / `loadFromCache` round-trip correctly
- Different filters produce different cache keys
- Stats cache saves/loads independently

### 5. Security Scoring
The checklist scoring engine drives the main dashboard. Tests for:
- `calculatePercentage` handles zero total (no NaN)
- `getRelevantItems` filters by threat level correctly
- `calculateSecurityStats` aggregates across categories

### 6. Deep-Link Share URL
The share handler must always include the article ID. Test for:
- Share URL contains `?article=<id>` parameter
- URL uses production domain `digibastion.com`

## Files Created

| File | What it tests |
|------|--------------|
| `src/utils/__tests__/sanitize.test.ts` | `sanitizeText` function (extracted for testability) |
| `src/utils/__tests__/newsCache.test.ts` | Cache build/save/load logic |
| `src/utils/__tests__/scoringUtils.test.ts` | Security score calculations |
| `supabase/functions/fetch-rss-news/index_test.ts` | RSS parsing, categorization, severity, stripHtml |
| `supabase/functions/send-digest-emails/index_test.ts` | Digest email stripHtml sanitization |
| `supabase/functions/send-critical-alerts/index_test.ts` | Alert email stripHtml sanitization |

## Technical Approach

1. **Extract `sanitizeText`** from `useNewsArticles.ts` into `src/utils/sanitize.ts` so it can be imported by both the hook and tests without React dependencies.

2. **Frontend tests** use the existing Vitest + jsdom setup. No new dependencies needed.

3. **Edge function tests** use Deno's built-in `Deno.test()` with assertions from `std/assert`. They test the pure functions (parsing, categorization, sanitization) without hitting the network.

4. **All tests are pure unit tests** — no database, no network, no mocking Supabase. This makes them fast and reliable in CI.

## Outcome

~30 focused test cases covering the exact logic that has broken in the past. Any future change to sanitization, RSS parsing, categorization, caching, or scoring will be caught before deployment.

