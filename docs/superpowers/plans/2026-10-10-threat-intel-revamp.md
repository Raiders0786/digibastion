# Threat Intel Revamp (Phase 0 + Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/threat-intel` trustworthy and usable: one record per incident with correct amounts, dates and named sources (Phase 0), and a page whose default view, filters, stats, cards, incident page and methodology match that data (Phase 2).

**Architecture:** Phase 0 moves incident parsing, severity and cross-provider dedup into pure modules under `supabase/functions/_shared/` that every importer calls, and a one-time `dedupe-incidents` backfill marks existing duplicates in `news_articles.metadata`. Phase 2 adds a shared taxonomy and row mapper under `src/lib/threatIntel/`, two database RPC changes for whole-result stats, severity sort and incident filters, and rebuilds the page UI on one tested display model (`getIncidentDisplay`). Data lives in the existing `news_articles` table; no new tables.

**Tech Stack:** React 18 + Vite + TypeScript, Tailwind + shadcn/ui (Radix), react-router 6, Supabase (Postgres RPCs, PostgREST) on Lovable Cloud, Deno edge functions, vitest + @testing-library/react (jsdom).

**Spec:** `docs/superpowers/specs/2026-10-10-threat-intel-revamp-design.md` (sections 5 and 7, plus 9 for copy). Phase 1 (Telegram) is already on `main` (`be5d978`). Phase 3 (newsletters) gets its own plan.

## Global Constraints

- Never claim "verified by Digibastion" for relayed data. Use the source's own status words: unconfirmed, confirmed, revised, retracted. Name the source on every incident.
- Keep the visible attribution "Powered by QuillMonitor" wherever a QuillMonitor record is shown on its own (cards, incident page, alerts panel).
- Metadata key for summary provenance is `summary_origin` (values `ai`, `publisher`, `provider`; SlowMist's legacy `provider-template` reads as `provider`). The spec's `summary_source` is superseded.
- No new tables. New incident fields are keys in `news_articles.metadata` (jsonb).
- Every migration that changes an RPC signature drops the old signature in the same file, so PostgREST never sees two overloads (error PGRST203). Migrations ship to Lovable before the frontend that calls them.
- Default view is Web3 incidents (`DEFAULT_SCOPE = 'web3-incidents'`); `?scope=all` shows all security news.
- Pure modules imported by vitest (`supabase/functions/_shared/*` used from `src/`) contain no `https://`, `npm:` or `Deno` references and no `String.prototype.replaceAll` (`tsconfig.app.json` targets `lib: ES2020`).
- Commands: one test file `rtk proxy npx vitest run <file>`; full suite `rtk proxy npx vitest run`; typecheck `npx tsc --noEmit -p tsconfig.app.json`; lint `npx eslint <files>`; Deno entry files `bun build <file> --no-bundle > /dev/null` (Deno is not installed locally). Plain `npx vitest` output is swallowed by the shell hook.
- Commit messages: conventional style, no AI attribution and no `Co-Authored-By` trailer.
- Do not commit the local edits to `AGENTS.md` or `ROADMAP.md` (they are the user's, and `ROADMAP.md`/`roadmap.md` collide on macOS).

## Review Focus

1. **Old `web3-incidents` rows with amounts a million times too large.** The previous importer stored "$3,800,000" as `amount_lost_usd = 3.8e12` and `amount_display = "$3800000M"`, and those rows stay in the database after A3 fixes the parser. A reader expects no loss figure rather than "$3800000M". Pinned by C1 (`hides implausible legacy amounts instead of showing a wrong loss`); the release doc also includes an optional one-off SQL repair.
2. **Shared or emailed link to an incident that the backfill later merged.** A reader expects to land on the primary incident, and a bad merge chain must never loop the browser. Pinned by B2 (`redirects a deep link for a merged duplicate…` and `does not follow a merged duplicate whose primary is itself a duplicate`).
3. **Frontend published before the migration.** A reader expects the page to keep working with page-level counts labelled "on this page", not an error. Pinned by B3 (`falls back to page stats and the count RPC when the stats RPC fails`); the release doc orders migrations first.
4. **Old bookmarks and links.** `/threat-intel` with no `scope` now opens the Web3 view, `?scope=web3-incidents` and `?scope=all` keep working, unknown `category`/`severity` values are dropped instead of crashing a card, and the cached feed of one scope never shows under another. Pinned by B1 (`keeps explicit scopes…`), B3 (`produces different keys for the Web3 and all-news scopes`) and C2/C3 (retired-category tests).
5. **Unconfirmed incident with an AI or provider summary.** A reader expects the "Unconfirmed" label next to any summary so the text does not read as fact. Pinned by C2 (`labels unconfirmed records and keeps pending summaries unlabelled`) and C6 (`groups alerts by severity and labels unconfirmed incidents`).

## Task order and ownership

Run the tasks in this order: A1 → A8, then B1 → B6, then C1 → C7, then R1. Each task leaves the tree green and ends in one commit.

- Section A only touches `supabase/functions/**` and `src/utils/__tests__/*`. It needs no migration.
- Section B adds migration `20261011090000_threat_intel_stats.sql`. C7 adds `20261012090000_threat_intel_incident_filters.sql`.
- **Anchors.** Sections A and B were each replayed mechanically on a scratch copy of `be5d978` (A: 198 tests; B: 204 tests; `tsc`, eslint and `vite build` clean). Section C's before-snippets were written against `be5d978`, and B rewrites parts of `src/pages/News.tsx` (stat tiles, alerts, deep links, search, tabs) and `src/hooks/useNewsArticles.ts`. When a C before-snippet does not match, anchor on the current text of the same block and keep B's behaviour. In particular: C4 5f must keep B3's `statsCaption` and the `stats` conditional around the tiles, and C6's `AlertsPanel` must take its data from B4's `useThreatIntelAlerts` hook rather than the old inline fetch.

## Cross-section decisions already applied in the task text

- C1/C2 fixtures use `summary_origin` (A1's key), not `summary_source`.
- C4 stat tiles read B3's `statsCaption` ("in this view" from the server, "on this page" on fallback) for all four tiles.
- C2 cards show "Powered by QuillMonitor" when QuillMonitor is the only source, "Source: X" for other single sources and "Sources:" for several.
- C5 methodology describes A5's actual duplicate rule (same project name, and the same day, or within two days with the same loss, attack method or reference link) and no longer lists Naked Security (Sophos stopped publishing it in 2023).
- B2's redirect for merged duplicates only follows a primary that is not itself a duplicate.

---

## Workstream A: Phase 0 data trust (backend)

All code in this section was applied to a scratch copy of the repo at `be5d978` and verified there: the full vitest suite passed (27 files, 198 tests), `npx tsc --noEmit -p tsconfig.app.json` was clean, eslint reported no errors on new or changed files, and every touched Deno entry file passed `bun build --no-bundle`. The SlowMist and QuillMonitor Deno test files were also run through a vitest shim, and all 18 tests passed after the refactors.

Conventions for every task:

- Run tests with `rtk proxy npx vitest run <file>`. The plain command's output is swallowed by a wrapper.
- Deno entry files cannot be run locally because Deno is not installed. `bun build <file> --no-bundle > /dev/null` must exit 0. It only transpiles, so it catches syntax errors but not missing names; the pure logic is covered by vitest.
- Shared modules imported by vitest must stay pure: no `https://`, `npm:` or `Deno` references. `tsconfig.app.json` uses `lib: ES2020`, so do not use `String.prototype.replaceAll` in any module a `src/` test imports. `slowmist.ts` already uses it, so no vitest file imports `slowmist.ts`.
- Line numbers are from the current `main` (`be5d978`). When an earlier task in this section has already changed a file, the snippet text is the anchor; the "originally line N" hint is only a guide.
- No database migration is needed for Phase 0. Every new field lives in the `news_articles.metadata` jsonb.

Task order matters: A3, A4, A6 and A8 all edit `fetch-web3-incidents/index.ts`; A2, A6 and A8 all edit `_shared/quillmonitor.ts`.

---

### Task A1: Shared incident field contract

**Files:**
- Create: `supabase/functions/_shared/incident-fields.ts`
- Test: `src/utils/__tests__/incidentFields.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export type IncidentSource = { provider: string; url: string | null; label: string; amount_usd: number | null }`
  - `export type AmountStatus = 'reported' | 'confirmed' | 'revised'`
  - `export type SummaryOrigin = 'ai' | 'publisher' | 'provider'`
  - `export interface IncidentFields { sources: IncidentSource[]; duplicateOfUid: string | null; summaryOrigin: SummaryOrigin | null; amountStatus: AmountStatus | null; fundsReturned: boolean | null; incidentDate: string | null; incidentDateUnknown: boolean; verification: 'verified' | 'unverified' | null }`
  - `export function readIncidentFields(metadata: unknown): IncidentFields`
  - `export function mergeIncidentSources(existing: IncidentSource[], incoming: IncidentSource[]): IncidentSource[]`
  - Extra helpers, used by A5 and A6: `export const MAX_INCIDENT_SOURCES = 10`, `export function safeHttpUrl(value: unknown): string | null`, `export function isCalendarDate(value: unknown): value is string`

Metadata keys read: `sources`, `duplicate_of_uid`, `summary_origin`, `amount_status`, `funds_returned`, `incident_date` (YYYY-MM-DD only), `incident_date_unknown`, `verification_status`. SlowMist already writes `summary_origin: 'provider-template'` and the frontend checks for it (`src/components/news/NewsCard.tsx:28-29`), so the parser maps that value to `'provider'` instead of rejecting it.

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/incidentFields.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  MAX_INCIDENT_SOURCES,
  mergeIncidentSources,
  readIncidentFields,
  type IncidentSource,
} from '../../../supabase/functions/_shared/incident-fields';

function source(provider: string, url: string | null, amount: number | null = null): IncidentSource {
  return { provider, url, label: provider, amount_usd: amount };
}

describe('readIncidentFields', () => {
  it('returns safe empty defaults for missing or non-object metadata', () => {
    const empty = {
      sources: [],
      duplicateOfUid: null,
      summaryOrigin: null,
      amountStatus: null,
      fundsReturned: null,
      incidentDate: null,
      incidentDateUnknown: false,
      verification: null,
    };
    expect(readIncidentFields(null)).toEqual(empty);
    expect(readIncidentFields(undefined)).toEqual(empty);
    expect(readIncidentFields('metadata')).toEqual(empty);
    expect(readIncidentFields([{ sources: [] }])).toEqual(empty);
  });

  it('reads every contract field from well-formed metadata', () => {
    expect(readIncidentFields({
      sources: [{ provider: 'QuillMonitor', url: 'https://example.com/report', label: 'Incident reference', amount_usd: 3_800_000 }],
      duplicate_of_uid: 'quillmonitor:abc',
      summary_origin: 'ai',
      amount_status: 'confirmed',
      funds_returned: true,
      incident_date: '2026-09-20',
      incident_date_unknown: false,
      verification_status: 'verified',
    })).toEqual({
      sources: [{ provider: 'quillmonitor', url: 'https://example.com/report', label: 'Incident reference', amount_usd: 3_800_000 }],
      duplicateOfUid: 'quillmonitor:abc',
      summaryOrigin: 'ai',
      amountStatus: 'confirmed',
      fundsReturned: true,
      incidentDate: '2026-09-20',
      incidentDateUnknown: false,
      verification: 'verified',
    });
  });

  it('maps the SlowMist provider-template origin to provider', () => {
    expect(readIncidentFields({ summary_origin: 'provider-template' }).summaryOrigin).toBe('provider');
    expect(readIncidentFields({ summary_origin: 'publisher' }).summaryOrigin).toBe('publisher');
    expect(readIncidentFields({ summary_origin: 'gpt' }).summaryOrigin).toBeNull();
  });

  it('rejects invalid enum, boolean and date values', () => {
    const fields = readIncidentFields({
      duplicate_of_uid: '   ',
      amount_status: 'estimated',
      funds_returned: 'yes',
      incident_date: '2026-02-31',
      incident_date_unknown: 'true',
      verification_status: 'pending',
    });
    expect(fields.duplicateOfUid).toBeNull();
    expect(fields.amountStatus).toBeNull();
    expect(fields.fundsReturned).toBeNull();
    expect(fields.incidentDate).toBeNull();
    expect(fields.incidentDateUnknown).toBe(false);
    expect(fields.verification).toBeNull();
  });

  it('accepts only YYYY-MM-DD incident dates', () => {
    expect(readIncidentFields({ incident_date: '2026-09-20T00:00:00Z' }).incidentDate).toBeNull();
    expect(readIncidentFields({ incident_date: 'September 20, 2026' }).incidentDate).toBeNull();
    expect(readIncidentFields({ incident_date: '2026-09-20' }).incidentDate).toBe('2026-09-20');
  });

  it('keeps only http(s) source URLs and drops malformed sources', () => {
    const fields = readIncidentFields({
      sources: [
        { provider: 'web3-incidents', url: 'javascript:alert(1)', label: 'Bad link', amount_usd: -5 },
        { provider: 'slowmist', url: 'http://example.com/a', label: '', amount_usd: Number.NaN },
        { provider: '', url: 'https://example.com/no-provider' },
        'not a source',
        null,
      ],
    });
    expect(fields.sources).toEqual([
      { provider: 'web3-incidents', url: null, label: 'Bad link', amount_usd: null },
      { provider: 'slowmist', url: 'http://example.com/a', label: 'slowmist', amount_usd: null },
    ]);
  });

  it('treats a non-array sources value as no sources', () => {
    expect(readIncidentFields({ sources: { provider: 'quillmonitor' } }).sources).toEqual([]);
  });
});

describe('mergeIncidentSources', () => {
  it('dedupes by provider and URL, keeping the first occurrence', () => {
    const merged = mergeIncidentSources(
      [source('quillmonitor', 'https://example.com/a', 3_800_000)],
      [
        source('quillmonitor', 'https://example.com/a', 4_000_000),
        source('web3-incidents', 'https://example.com/a', 3_800_000),
        source('web3-incidents', null),
        source('web3-incidents', null),
      ],
    );
    expect(merged).toEqual([
      source('quillmonitor', 'https://example.com/a', 3_800_000),
      source('web3-incidents', 'https://example.com/a', 3_800_000),
      source('web3-incidents', null),
    ]);
  });

  it(`caps the result at ${MAX_INCIDENT_SOURCES} entries`, () => {
    const incoming = Array.from({ length: 15 }, (_, index) => source('web3-incidents', `https://example.com/${index}`));
    const merged = mergeIncidentSources([], incoming);
    expect(merged).toHaveLength(MAX_INCIDENT_SOURCES);
    expect(merged[0].url).toBe('https://example.com/0');
    expect(merged[9].url).toBe('https://example.com/9');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentFields.test.ts`
Expected: FAIL with `Error: Cannot find module '../../../supabase/functions/_shared/incident-fields'` and `Test Files  1 failed (1)`.

- [ ] **Step 3: Implement the module**

Create `supabase/functions/_shared/incident-fields.ts`:

```ts
// Shared contract for the incident fields every Web3 importer, the page and the
// alert channels read from news_articles.metadata. Metadata is jsonb written by
// several importers over time, so every reader goes through this tolerant
// parser instead of trusting key shapes directly.
// Pure module: no Deno or URL imports, so vitest can import it.

export type IncidentSource = { provider: string; url: string | null; label: string; amount_usd: number | null };
export type AmountStatus = 'reported' | 'confirmed' | 'revised';
export type SummaryOrigin = 'ai' | 'publisher' | 'provider';

export interface IncidentFields {
  sources: IncidentSource[];
  duplicateOfUid: string | null;
  summaryOrigin: SummaryOrigin | null;
  amountStatus: AmountStatus | null;
  fundsReturned: boolean | null;
  incidentDate: string | null;
  incidentDateUnknown: boolean;
  verification: 'verified' | 'unverified' | null;
}

// Cards and alerts show every source; ten is far above what any incident has
// today and keeps a runaway merge from bloating the row.
export const MAX_INCIDENT_SOURCES = 10;

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 2_000) return null;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function readSummaryOrigin(value: unknown): SummaryOrigin | null {
  if (value === 'ai' || value === 'publisher' || value === 'provider') return value;
  // SlowMist writes 'provider-template': a sentence built only from provider
  // facts. For the "AI Summary" badge it is provider text, not ours.
  if (value === 'provider-template') return 'provider';
  return null;
}

function readAmountStatus(value: unknown): AmountStatus | null {
  return value === 'reported' || value === 'confirmed' || value === 'revised' ? value : null;
}

function readSource(value: unknown): IncidentSource | null {
  const row = metadataRecord(value);
  const provider = typeof row.provider === 'string' ? row.provider.trim().toLowerCase().slice(0, 60) : '';
  if (!provider) return null;
  const label = typeof row.label === 'string' && row.label.trim()
    ? row.label.trim().slice(0, 120)
    : provider;
  const amount = row.amount_usd;
  return {
    provider,
    // A non-http(s) URL (javascript:, data:) is dropped but the attribution is kept.
    url: safeHttpUrl(row.url),
    label,
    amount_usd: typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 ? amount : null,
  };
}

export function readIncidentFields(metadata: unknown): IncidentFields {
  const meta = metadataRecord(metadata);
  const rawSources = Array.isArray(meta.sources) ? meta.sources : [];
  const parsedSources = rawSources
    .map(readSource)
    .filter((source): source is IncidentSource => source !== null);
  const duplicateOfUid = typeof meta.duplicate_of_uid === 'string' && meta.duplicate_of_uid.trim()
    ? meta.duplicate_of_uid.trim().slice(0, 200)
    : null;
  const verification = meta.verification_status === 'verified' || meta.verification_status === 'unverified'
    ? meta.verification_status
    : null;

  return {
    sources: mergeIncidentSources([], parsedSources),
    duplicateOfUid,
    summaryOrigin: readSummaryOrigin(meta.summary_origin),
    amountStatus: readAmountStatus(meta.amount_status),
    fundsReturned: typeof meta.funds_returned === 'boolean' ? meta.funds_returned : null,
    incidentDate: isCalendarDate(meta.incident_date) ? meta.incident_date : null,
    incidentDateUnknown: meta.incident_date_unknown === true,
    verification,
  };
}

// First occurrence wins so the canonical provider's own entry keeps its
// position and amount when duplicates contribute the same link again.
export function mergeIncidentSources(existing: IncidentSource[], incoming: IncidentSource[]): IncidentSource[] {
  const merged: IncidentSource[] = [];
  const seen = new Set<string>();
  for (const source of [...existing, ...incoming]) {
    const key = `${source.provider}|${source.url ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(source);
    if (merged.length >= MAX_INCIDENT_SOURCES) break;
  }
  return merged;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentFields.test.ts`
Expected: `Test Files  1 passed (1)`, `Tests  9 passed (9)`.

Then run: `npx tsc --noEmit -p tsconfig.app.json && npx eslint supabase/functions/_shared/incident-fields.ts src/utils/__tests__/incidentFields.test.ts`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/_shared/incident-fields.ts src/utils/__tests__/incidentFields.test.ts
git commit -m "feat(threat-intel): add shared incident metadata field contract"
```

---

### Task A2: Shared loss-based severity

**Files:**
- Create: `supabase/functions/_shared/incident-severity.ts`
- Modify: `supabase/functions/_shared/quillmonitor.ts` (line 1 imports, lines 156-158 `includesAny`, lines 216-226 `mapQuillMonitorSeverity`)
- Modify: `supabase/functions/_shared/slowmist.ts` (line 1 imports, lines 238-248 `mapSeverity`, line 308)
- Test: `src/utils/__tests__/incidentSeverity.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'` and `export function severityFromLoss(amountUsd: number | null, attackType: string | null): IncidentSeverity`. `mapQuillMonitorSeverity(incident)` keeps its signature and now delegates.

Rubric (unchanged from `quillmonitor.ts:216-226`): $50M or more is critical, $10M or more is high, $1M or more is medium. Below $1M, an attack type containing "private key", "access control", "oracle", "reentrancy" or "flash loan" is high; any other positive loss is medium; otherwise low. Attack text is normalized the way SlowMist did it (lowercase, punctuation to spaces), so "flash-loan" matches.

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/incidentSeverity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { severityFromLoss } from '../../../supabase/functions/_shared/incident-severity';
import { mapQuillMonitorSeverity, type QuillMonitorIncident } from '../../../supabase/functions/_shared/quillmonitor';

const quillIncident: QuillMonitorIncident = {
  id: 'incident-123',
  target: 'Example Bridge',
  date: '2026-09-25',
  chain: 'Ethereum',
  category: 'Bridge',
  attackedMethod: 'Smart Contract Bug',
  amountInUsd: null,
  description: '',
  reference: '',
  verificationStatus: 'verified',
  createdAt: '2026-09-25T12:00:00.000Z',
  updatedAt: '2026-09-25T12:00:00.000Z',
};

describe('severityFromLoss', () => {
  it('uses loss thresholds of $50M, $10M and $1M', () => {
    expect(severityFromLoss(50_000_000, null)).toBe('critical');
    expect(severityFromLoss(49_999_999, null)).toBe('high');
    expect(severityFromLoss(10_000_000, null)).toBe('high');
    expect(severityFromLoss(9_999_999, null)).toBe('medium');
    expect(severityFromLoss(1_000_000, null)).toBe('medium');
  });

  it('rates losses under $1M as medium and no loss as low', () => {
    expect(severityFromLoss(999_999, 'Phishing')).toBe('medium');
    expect(severityFromLoss(500, null)).toBe('medium');
    expect(severityFromLoss(0, null)).toBe('low');
    expect(severityFromLoss(null, null)).toBe('low');
  });

  it('raises small or unknown losses to high for direct-loss attack methods', () => {
    expect(severityFromLoss(null, 'Private Key Compromise')).toBe('high');
    expect(severityFromLoss(200_000, 'Access Control')).toBe('high');
    expect(severityFromLoss(null, 'Oracle Manipulation')).toBe('high');
    expect(severityFromLoss(null, 'Reentrancy')).toBe('high');
    expect(severityFromLoss(null, 'Flash Loan Attack')).toBe('high');
  });

  it('matches attack signals regardless of punctuation', () => {
    expect(severityFromLoss(null, 'flash-loan')).toBe('high');
    expect(severityFromLoss(null, 'private-key-compromise')).toBe('high');
  });

  it('never lets an attack signal lower a loss-based critical', () => {
    expect(severityFromLoss(75_000_000, 'Reentrancy')).toBe('critical');
  });

  it('ignores invalid amounts', () => {
    expect(severityFromLoss(Number.NaN, null)).toBe('low');
    expect(severityFromLoss(-5, null)).toBe('low');
    expect(severityFromLoss(Number.POSITIVE_INFINITY, null)).toBe('low');
  });
});

describe('QuillMonitor severity uses the shared rubric', () => {
  it('matches severityFromLoss for the documented examples', () => {
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 75_000_000 })).toBe('critical');
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 12_500_000 })).toBe('high');
    expect(mapQuillMonitorSeverity({ ...quillIncident, attackedMethod: 'Reentrancy' })).toBe('high');
    expect(mapQuillMonitorSeverity({ ...quillIncident, amountInUsd: 250_000 })).toBe('medium');
    expect(mapQuillMonitorSeverity(quillIncident)).toBe('low');
  });
});
```

The last `describe` block is a characterization test. It passes against the current `mapQuillMonitorSeverity` and must still pass after the refactor.

- [ ] **Step 2: Run it and confirm it fails**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentSeverity.test.ts`
Expected: FAIL with `Error: Cannot find module '../../../supabase/functions/_shared/incident-severity'`.

- [ ] **Step 3: Implement the module**

Create `supabase/functions/_shared/incident-severity.ts`:

```ts
// One loss-based severity rubric for every Web3 incident importer, so the same
// incident gets the same severity whichever provider reported it.
// Pure module: no Deno or URL imports, so vitest can import it.

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

// Attack methods that usually mean a direct loss of funds even when the
// provider has not published an amount yet.
const HIGH_RISK_ATTACK_SIGNALS = ['private key', 'access control', 'oracle', 'reentrancy', 'flash loan'];

// Lowercase and turn punctuation into spaces so "Flash-loan" and
// "private_key_compromise" match the same signals as "flash loan".
function normalizeAttackType(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function severityFromLoss(amountUsd: number | null, attackType: string | null): IncidentSeverity {
  const amount = typeof amountUsd === 'number' && Number.isFinite(amountUsd) && amountUsd >= 0 ? amountUsd : null;
  if (amount !== null && amount >= 50_000_000) return 'critical';
  if (amount !== null && amount >= 10_000_000) return 'high';
  if (amount !== null && amount >= 1_000_000) return 'medium';

  const attack = normalizeAttackType(attackType ?? '');
  if (HIGH_RISK_ATTACK_SIGNALS.some((signal) => attack.includes(signal))) return 'high';
  if (amount !== null && amount > 0) return 'medium';
  return 'low';
}
```

- [ ] **Step 4: Refactor QuillMonitor to use it**

In `supabase/functions/_shared/quillmonitor.ts`, line 1. Before:

```ts
import { classifyWeb3Incident } from './web3-taxonomy.ts';
```

After:

```ts
import { classifyWeb3Incident } from './web3-taxonomy.ts';
import { severityFromLoss } from './incident-severity.ts';
```

Delete lines 156-159 (the helper has no other caller):

```ts
function includesAny(value: string, signals: string[]): boolean {
  return signals.some((signal) => value.includes(signal));
}

```

Replace lines 216-226. Before:

```ts
export function mapQuillMonitorSeverity(incident: QuillMonitorIncident): NormalizedQuillMonitorArticle['severity'] {
  const amount = incident.amountInUsd;
  if (typeof amount === 'number' && amount >= 50_000_000) return 'critical';
  if (typeof amount === 'number' && amount >= 10_000_000) return 'high';
  if (typeof amount === 'number' && amount >= 1_000_000) return 'medium';

  const attack = incident.attackedMethod.toLowerCase();
  if (includesAny(attack, ['private key', 'access control', 'oracle', 'reentrancy', 'flash loan'])) return 'high';
  if (typeof amount === 'number' && amount > 0) return 'medium';
  return 'low';
}
```

After:

```ts
export function mapQuillMonitorSeverity(incident: QuillMonitorIncident): NormalizedQuillMonitorArticle['severity'] {
  return severityFromLoss(incident.amountInUsd, incident.attackedMethod);
}
```

- [ ] **Step 5: Refactor SlowMist to use it**

In `supabase/functions/_shared/slowmist.ts`, line 1. Before:

```ts
import { classifyWeb3Incident } from './web3-taxonomy.ts';
```

After:

```ts
import { classifyWeb3Incident } from './web3-taxonomy.ts';
import { severityFromLoss } from './incident-severity.ts';
```

Delete lines 238-249 (`mapSeverity` and the blank line after it):

```ts
function mapSeverity(incident: SlowMistIncident): NormalizedSlowMistArticle['severity'] {
  const amount = incident.amountInUsd;
  if (amount !== null && amount >= 50_000_000) return 'critical';
  if (amount !== null && amount >= 10_000_000) return 'high';
  if (amount !== null && amount >= 1_000_000) return 'medium';
  const attack = normalizeSlowMistTarget(incident.attackMethod);
  if (['private key', 'access control', 'oracle', 'reentrancy', 'flash loan']
    .some((signal) => attack.includes(signal))) return 'high';
  if (amount !== null && amount > 0) return 'medium';
  return 'low';
}

```

Line 308. Before:

```ts
    severity: mapSeverity(incident),
```

After:

```ts
    severity: severityFromLoss(incident.amountInUsd, incident.attackMethod),
```

- [ ] **Step 6: Run tests and check the Deno files**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentSeverity.test.ts`
Expected: `Tests  7 passed (7)`.

Run:

```bash
for f in supabase/functions/fetch-quillmonitor-incidents/index.ts supabase/functions/fetch-quillmonitor-incidents/index_test.ts supabase/functions/fetch-slowmist-incidents/index.ts supabase/functions/fetch-slowmist-incidents/index_test.ts; do bun build "$f" --no-bundle > /dev/null && echo "ok $f"; done
npx tsc --noEmit -p tsconfig.app.json
npx eslint supabase/functions/_shared/incident-severity.ts supabase/functions/_shared/quillmonitor.ts supabase/functions/_shared/slowmist.ts src/utils/__tests__/incidentSeverity.test.ts
```

Expected: four `ok` lines, no type errors, no lint errors. The existing Deno assertions (`mapQuillMonitorSeverity` for $75M is critical and for Reentrancy is high; the SlowMist normalization test) are unchanged in behavior.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/_shared/incident-severity.ts supabase/functions/_shared/quillmonitor.ts supabase/functions/_shared/slowmist.ts src/utils/__tests__/incidentSeverity.test.ts
git commit -m "refactor(ingestion): share loss-based incident severity rubric"
```

---

### Task A3: Fix fetch-web3-incidents amount, date and severity parsing

**Files:**
- Create: `supabase/functions/fetch-web3-incidents/parsing.ts`
- Modify: `supabase/functions/fetch-web3-incidents/index.ts` (line 4 imports; lines 98-152 `extractSources` moved out; lines 288-295, 337-349 and 365-375 inside `parsePrimaryIncidents`)
- Test: `src/utils/__tests__/web3IncidentParsing.test.ts` (create)

**Interfaces:**
- Consumes: `severityFromLoss` (A2), `IncidentSource` (A1), `formatUsd` from `supabase/functions/_shared/quillmonitor.ts`. That module has no Deno or URL imports (it imports only `./web3-taxonomy.ts` and, after A2, `./incident-severity.ts`), so `parsing.ts` re-exports it instead of copying it.
- Produces (from `parsing.ts`):
  - `export function parseUsdAmount(text: string): number | null`: full USD from the first amount in the text; only the unit next to the number scales it.
  - `export function parseIncidentDate(value: string): string | null`: YYYY-MM-DD in UTC for "January 8, 2026", "Sep 3, 2026", "07/01/26" (DD/MM/YY), "07/01/2026" and ISO dates or timestamps; null otherwise. Never today's date.
  - `export { formatUsd }` (re-export)
  - `export interface ExtractedLink { url: string; label: string }`
  - `export function extractSources(content: string): ExtractedLink[]` (moved unchanged from `index.ts:98-152` so it can be tested)
  - `export function web3IncidentSources(links: ExtractedLink[], amountUsd: number | null): IncidentSource[]`
- Record changes for new `web3-incidents` rows: `metadata.amount_lost_usd` is full USD; `amount_display` comes from `formatUsd`; new keys `incident_date`, `incident_date_unknown`, `reference_url` (the first cited link), `summary_origin: 'publisher'` and `sources`; `published_at` is `<incident_date>T00:00:00.000Z`, or the ingestion time when the date is unknown; severity comes from `severityFromLoss`.

The old `parseDate`, `extractAmount` and `determineSeverity` stay in `index.ts` until Task A4, because the feed-2 parser still calls them. A4 deletes them together with feed-2.

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/web3IncidentParsing.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  extractSources,
  formatUsd,
  parseIncidentDate,
  parseUsdAmount,
  web3IncidentSources,
} from '../../../supabase/functions/fetch-web3-incidents/parsing';

describe('parseUsdAmount', () => {
  it('reads the unit next to the number', () => {
    expect(parseUsdAmount('NEAR Intents exploited for $3.8M')).toBe(3_800_000);
    expect(parseUsdAmount('Attackers took $3.8 million from the bridge')).toBe(3_800_000);
    expect(parseUsdAmount('Roughly 3.8 million dollars were drained')).toBe(3_800_000);
    expect(parseUsdAmount('Exchange loses $1.2B in hot wallet hack')).toBe(1_200_000_000);
    expect(parseUsdAmount('A $500K phishing loss')).toBe(500_000);
    expect(parseUsdAmount('$2 billion stolen')).toBe(2_000_000_000);
    expect(parseUsdAmount('$12 millions')).toBe(12_000_000);
  });

  it('returns full-dollar values unscaled (old bug: treated as millions)', () => {
    expect(parseUsdAmount('Meter bridge drained of $3,800,000')).toBe(3_800_000);
    expect(parseUsdAmount('A user lost $500 to a fake airdrop')).toBe(500);
    expect(parseUsdAmount('$1,234.56 in USDC')).toBe(1_234.56);
  });

  it('never scales by a unit word elsewhere in the text', () => {
    expect(parseUsdAmount('Protocol loses $3.8M; 2026 losses now exceed one billion')).toBe(3_800_000);
    expect(parseUsdAmount('$250,000 stolen, a fraction of the billion-dollar TVL')).toBe(250_000);
    expect(parseUsdAmount('$700 lost. Analysts expect millions more at risk')).toBe(700);
  });

  it('uses the first amount in the text', () => {
    expect(parseUsdAmount('$3.8M stolen, $1.1M later returned')).toBe(3_800_000);
    expect(parseUsdAmount('About 2 million USD was taken, then $500K returned')).toBe(2_000_000);
  });

  it('does not treat a separate word as a unit', () => {
    expect(parseUsdAmount('$5 more was needed')).toBe(5);
    expect(parseUsdAmount('$500 bounty offered')).toBe(500);
  });

  it('returns null when no USD amount is present or the value is implausible', () => {
    expect(parseUsdAmount('Undisclosed amount of ETH stolen')).toBeNull();
    expect(parseUsdAmount('')).toBeNull();
    expect(parseUsdAmount('$0 lost')).toBeNull();
    expect(parseUsdAmount('$900B exploit claim')).toBeNull();
  });
});

describe('parseIncidentDate', () => {
  it('parses feed-1 section headers', () => {
    expect(parseIncidentDate('January 8, 2026')).toBe('2026-01-08');
    expect(parseIncidentDate('September 30 2026')).toBe('2026-09-30');
    expect(parseIncidentDate('Sep 3, 2026')).toBe('2026-09-03');
  });

  it('reads DD/MM/YY as day first', () => {
    expect(parseIncidentDate('07/01/26')).toBe('2026-01-07');
    expect(parseIncidentDate('31/12/99')).toBe('1999-12-31');
    expect(parseIncidentDate('07/01/2026')).toBe('2026-01-07');
  });

  it('parses ISO dates and converts timestamps to their UTC day', () => {
    expect(parseIncidentDate('2026-09-20')).toBe('2026-09-20');
    expect(parseIncidentDate('2026-09-20T23:30:00-02:00')).toBe('2026-09-21');
    expect(parseIncidentDate('2026-09-20T10:00:00Z')).toBe('2026-09-20');
  });

  it('returns null instead of today for unparseable or impossible dates', () => {
    expect(parseIncidentDate('yesterday')).toBeNull();
    expect(parseIncidentDate('')).toBeNull();
    expect(parseIncidentDate('February 31, 2026')).toBeNull();
    expect(parseIncidentDate('31/02/26')).toBeNull();
    expect(parseIncidentDate('2026-13-01')).toBeNull();
    expect(parseIncidentDate('Smarch 3, 2026')).toBeNull();
  });
});

describe('formatUsd', () => {
  it('formats full-dollar amounts compactly', () => {
    expect(formatUsd(3_800_000)).toBe('$3.8M');
    expect(formatUsd(500)).toBe('$500');
    expect(formatUsd(1_200_000_000)).toBe('$1.2B');
    expect(formatUsd(null)).toBeNull();
  });
});

describe('web3 incident sources', () => {
  const markdown = [
    'The protocol was drained ([tweet](https://x.com/zachxbt/status/1?utm_source=feed)).',
    '[Etherscan tx](https://etherscan.io/tx/0xabc)',
    '[archive](https://web.archive.org/web/1/https://example.com)',
    '[(attribution)](https://www.web3isgoinggreat.com/single/x)',
  ].join('\n');

  it('extracts cited links without archives, attribution or tracking parameters', () => {
    expect(extractSources(markdown)).toEqual([
      { url: 'https://x.com/zachxbt/status/1', label: '@zachxbt' },
      { url: 'https://etherscan.io/tx/0xabc', label: 'Etherscan' },
    ]);
  });

  it('attributes the parsed loss to the first link only', () => {
    expect(web3IncidentSources(extractSources(markdown), 3_800_000)).toEqual([
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/1', label: '@zachxbt', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: 'https://etherscan.io/tx/0xabc', label: 'Etherscan', amount_usd: null },
    ]);
    expect(web3IncidentSources([], 3_800_000)).toEqual([]);
  });
});
```

These cases cover the known bugs: "$3,800,000" must be 3,800,000 (the old code stored 3.8e12), "$500" must be 500, and a "billion" elsewhere in the text must not scale "$3.8M".

- [ ] **Step 2: Run it and confirm it fails**

Run: `rtk proxy npx vitest run src/utils/__tests__/web3IncidentParsing.test.ts`
Expected: FAIL with `Error: Cannot find module '../../../supabase/functions/fetch-web3-incidents/parsing'`.

- [ ] **Step 3: Implement the parsing module**

Create `supabase/functions/fetch-web3-incidents/parsing.ts`:

```ts
// Pure parsing helpers for the web3-incidents collector. Kept free of Deno and
// URL imports so vitest can cover the amount and date bugs directly.
import type { IncidentSource } from '../_shared/incident-fields.ts';

export { formatUsd } from '../_shared/quillmonitor.ts';

const UNIT_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  thousand: 1_000,
  m: 1_000_000,
  mn: 1_000_000,
  million: 1_000_000,
  millions: 1_000_000,
  b: 1_000_000_000,
  bn: 1_000_000_000,
  billion: 1_000_000_000,
  billions: 1_000_000_000,
};

// "$3.8M", "$3.8 million", "$3,800,000", "$1.2B", "$500K". The unit must touch
// the number: single-letter units with no space, words after optional spaces.
const DOLLAR_AMOUNT = /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?:\s*(thousand|millions?|billions?|mn|bn)\b|([kmb])\b)?/i;
// "3.8 million dollars", "12 million USD".
const WORDED_AMOUNT = /\b(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?\s*(thousand|millions?|billions?)\s+(?:us\s+)?(?:dollars?|usd)\b/i;

// Anything above this is a parsing error, not a real incident; the largest
// crypto thefts on record are around $1.5B.
const MAX_PLAUSIBLE_USD = 100_000_000_000;

function amountFromMatch(match: RegExpExecArray, unit: string | undefined): number | null {
  const base = Number(`${match[1].replace(/,/g, '')}${match[2] ? `.${match[2]}` : ''}`);
  if (!Number.isFinite(base)) return null;
  const multiplier = unit ? UNIT_MULTIPLIERS[unit.toLowerCase()] : 1;
  if (!multiplier) return null;
  // Rounding removes float noise such as 3.8 * 1e6 = 3799999.9999999995.
  const amount = unit ? Math.round(base * multiplier) : base;
  return amount > 0 && amount <= MAX_PLAUSIBLE_USD ? amount : null;
}

/**
 * Returns the first USD amount in the text as full dollars. Only the unit next
 * to the number scales it; a "billion" elsewhere in the text never does.
 */
export function parseUsdAmount(text: string): number | null {
  if (!text) return null;
  const dollar = DOLLAR_AMOUNT.exec(text);
  const worded = WORDED_AMOUNT.exec(text);
  const first = dollar && worded
    ? (dollar.index <= worded.index ? dollar : worded)
    : dollar ?? worded;
  if (!first) return null;
  const unit = first === dollar ? (dollar[3] ?? dollar[4]) : first[3];
  return amountFromMatch(first, unit);
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function calendarDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC rolls 31 February into March; the round trip rejects that.
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
}

/**
 * Returns the incident date as YYYY-MM-DD (UTC), or null when the value is not
 * one of the formats the feed uses. Callers must not substitute today's date.
 */
export function parseIncidentDate(value: string): string | null {
  const text = (value ?? '').trim();
  if (!text) return null;

  // "January 8, 2026" (feed-1 section headers), also "Jan 8 2026".
  const named = /^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
  if (named) {
    const month = MONTHS[named[1].toLowerCase()];
    return month ? calendarDate(Number(named[3]), month, Number(named[2])) : null;
  }

  // "07/01/26" is DD/MM/YY; four-digit years are accepted too.
  const numeric = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(text);
  if (numeric) {
    const shortYear = Number(numeric[3]);
    const year = numeric[3].length === 2 ? (shortYear < 50 ? 2000 + shortYear : 1900 + shortYear) : shortYear;
    return calendarDate(year, Number(numeric[2]), Number(numeric[1]));
  }

  // ISO date or timestamp. A timestamp is converted to its UTC calendar day.
  const iso = /^(\d{4})-(\d{2})-(\d{2})(T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(text);
  if (iso) {
    const date = calendarDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    if (!date || !iso[4]) return date;
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }

  return null;
}

export interface ExtractedLink {
  url: string;
  label: string;
}

// Moved unchanged from index.ts so it can be tested: pulls cited links out of
// the feed markdown, skipping the feed's own pages and archive mirrors.
export function extractSources(content: string): ExtractedLink[] {
  const sources: ExtractedLink[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(content)) !== null) {
    const linkText = match[1].trim();
    let url = match[2].trim();

    if (url.includes('web3isgoinggreat.com') ||
        url.includes('archive.org') ||
        url.includes('web.archive.org') ||
        linkText.toLowerCase().includes('archive') ||
        linkText.toLowerCase().includes('attribution') ||
        !url.startsWith('http')) {
      continue;
    }

    try {
      const urlObj = new URL(url);
      ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref_src', 'ref_url'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      url = urlObj.toString();
    } catch {
      // If URL parsing fails, use as-is
    }

    let label = linkText;
    if (linkText.toLowerCase().includes('tweet')) {
      if (url.includes('x.com') || url.includes('twitter.com')) {
        const usernameMatch = url.match(/(?:x\.com|twitter\.com)\/([^/]+)/);
        label = usernameMatch ? `@${usernameMatch[1]}` : 'Twitter/X';
      }
    } else if (url.includes('etherscan.io')) {
      label = 'Etherscan';
    } else if (url.includes('bscscan.com')) {
      label = 'BscScan';
    } else if (url.includes('polygonscan.com')) {
      label = 'PolygonScan';
    }

    if (!sources.some(s => s.url === url)) {
      sources.push({ url, label });
    }
  }

  return sources.slice(0, 5);
}

/**
 * Builds metadata.sources for a web3-incidents record. The parsed loss is
 * attributed to the first cited link only, so merged views do not count it
 * once per link.
 */
export function web3IncidentSources(links: ExtractedLink[], amountUsd: number | null): IncidentSource[] {
  return links.map((link, index) => ({
    provider: 'web3-incidents',
    url: link.url,
    label: link.label,
    amount_usd: index === 0 ? amountUsd : null,
  }));
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `rtk proxy npx vitest run src/utils/__tests__/web3IncidentParsing.test.ts`
Expected: `Tests  13 passed (13)`.

- [ ] **Step 5: Wire the parser into `index.ts`**

Edit `supabase/functions/fetch-web3-incidents/index.ts`.

(a) Imports, line 4. Before:

```ts
import { classifyCollectedWeb3Incident } from './classifier.ts';
```

After:

```ts
import { classifyCollectedWeb3Incident } from './classifier.ts';
import { severityFromLoss } from '../_shared/incident-severity.ts';
import {
  extractSources,
  formatUsd,
  parseIncidentDate,
  parseUsdAmount,
  web3IncidentSources,
} from './parsing.ts';
```

(b) Delete `extractSources`, which moved to `parsing.ts`. Remove everything from the line `// Extract source links from content with proper sanitization` (line 98) through the closing `}` of `extractSources` and the blank line after it (line 153). The next remaining line must be `// Extract affected technologies` (originally line 154).

(c) In `parsePrimaryIncidents`, originally lines 288-295. Before:

```ts
      const pubDate = parseDate(section.date);
      const amount = extractAmount(title + ' ' + content);
      const severity = determineSeverity(amount, title, content);
      const sources = extractSources(content);
      const classification = classifyCollectedWeb3Incident(title, content);
      const category = classification.category;
      const technologies = extractTechnologies(title, content);
      const tags = extractTags(content);
```

After:

```ts
      // A missing date stays unknown instead of silently becoming "today".
      const incidentDate = parseIncidentDate(section.date);
      const ingestedAt = new Date().toISOString();
      const amountUsd = parseUsdAmount(`${title} ${content}`);
      const sources = extractSources(content);
      const classification = classifyCollectedWeb3Incident(title, content);
      const category = classification.category;
      const technologies = extractTechnologies(title, content);
      const tags = extractTags(content);
      // Loss-based rubric shared with QuillMonitor and SlowMist. All attack
      // tags are passed (not only tags[0], which is usually "exploit"), so a
      // "private-key-compromise" tag still raises an unknown-loss incident.
      const severity = severityFromLoss(amountUsd, tags.join(' '));
```

Passing every tag (not only `tags[0]`, which is usually "exploit") means a `private-key-compromise` or `flash-loan` tag still raises an incident with an unknown loss to high. `metadata.attack_type` stays `tags[0]`.

(d) Metadata, originally lines 337-349. Before:

```ts
      // Build rich metadata for future analysis
      const metadata = {
        provider: 'web3-incidents',
        security_domain: classification.securityDomain,
        is_web3_incident: true,
        taxonomy_version: classification.taxonomyVersion,
        classification_reasons: classification.reasons,
        amount_lost_usd: amount ? amount * 1000000 : null, // Store in USD
        amount_display: amount ? `$${amount}M` : null,
        attack_type: tags[0] || null,
        data_source: 'feed-1',
        scraped_at: new Date().toISOString(),
      };
```

After:

```ts
      // Build rich metadata for future analysis
      const metadata = {
        provider: 'web3-incidents',
        security_domain: classification.securityDomain,
        is_web3_incident: true,
        taxonomy_version: classification.taxonomyVersion,
        classification_reasons: classification.reasons,
        amount_lost_usd: amountUsd, // Full USD, never millions
        amount_display: formatUsd(amountUsd),
        attack_type: tags[0] || null,
        incident_date: incidentDate,
        incident_date_unknown: incidentDate === null,
        reference_url: primarySource || null,
        summary_origin: 'publisher',
        sources: web3IncidentSources(sources, amountUsd),
        data_source: 'feed-1',
        scraped_at: ingestedAt,
      };
```

`primarySource` is already defined a few lines above (`const primarySource = sources[0]?.url || '';`, originally line 297).

(e) `published_at`, originally lines 365-376. Before:

```ts
        published_at: pubDate.toISOString(),
        raw_content: content,
        is_processed: false,
        metadata
      });
    }
  }
  
  return incidents;
}

// Parse incidents from secondary source
```

After:

```ts
        published_at: incidentDate ? `${incidentDate}T00:00:00.000Z` : ingestedAt,
        raw_content: content,
        is_processed: false,
        metadata
      });
    }
  }
  
  return incidents;
}

// Parse incidents from secondary source
```

Leave `generateUID(title, section.date, 'p')` unchanged so existing rows keep their uid.

- [ ] **Step 6: Verify**

Run:

```bash
bun build supabase/functions/fetch-web3-incidents/index.ts --no-bundle > /dev/null && echo ok
rtk proxy npx vitest run src/utils/__tests__/web3IncidentParsing.test.ts
npx tsc --noEmit -p tsconfig.app.json
npx eslint supabase/functions/fetch-web3-incidents/parsing.ts src/utils/__tests__/web3IncidentParsing.test.ts
grep -n "amount \* 1000000" supabase/functions/fetch-web3-incidents/index.ts
```

Expected: `ok`, 13 tests pass, no type or lint errors. The grep prints exactly one line, `amount_lost_usd: amount ? amount * 1000000 : null,`, inside `parseSecondaryIncidents`. A4 deletes that parser. Before A3 there were two matches; the one in `parsePrimaryIncidents` must be gone.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/fetch-web3-incidents/parsing.ts supabase/functions/fetch-web3-incidents/index.ts src/utils/__tests__/web3IncidentParsing.test.ts
git commit -m "fix(web3-incidents): parse full-dollar amounts and keep unknown dates unknown"
```

---

### Task A4: Retire the QuillAudits page scrape (feed-2)

**Files:**
- Modify: `supabase/functions/fetch-web3-incidents/index.ts` (originally lines 12-13, 15-96, 376-466, 569-604, 773, 777)

**Interfaces:**
- Consumes: nothing new.
- Produces: no new exports. The response's `sources` array now only ever contains `feed-1`. The ingestion run's `metadata.sources_checked` becomes 1, because it is computed as `sourceResults.length` (`index.ts:744`) and only feed-1 pushes a result now; no code change is needed for it. `sources_succeeded` follows the same way.

The spec (5.1, and decision 4 in section 11) retires this scrape because the QuillMonitor partner API returns the same incidents with stable IDs and verification status.

- [ ] **Step 1: Replace the source constants**

Originally lines 12-13. Before:

```ts
const _s1 = atob('d2ViM2lzZ29pbmdncmVhdC5jb20='); // Primary source
const _s2 = atob('cXVpbGxhdWRpdHMuY29tL3dlYjMtaGFja3MtZGF0YWJhc2U='); // Secondary source
```

After:

```ts
const _s1 = atob('d2ViM2lzZ29pbmdncmVhdC5jb20='); // Primary source
// The secondary page scrape (feed-2) was retired: the QuillMonitor partner API
// returns the same incidents with stable IDs and verification status.
```

- [ ] **Step 2: Delete the legacy helpers that only feed-2 still uses**

Delete everything from `// Parse date from various formats found on web3isgoinggreat.com` (originally line 15) through the closing `}` of `determineSeverity` and the blank line after it (originally line 97). After A3 removed `extractSources`, the next remaining line is `// Extract affected technologies`. This removes `parseDate`, `extractAmount` (including the "billion anywhere in the text" bug) and `determineSeverity` (including the "major"/"massive" keyword triggers).

- [ ] **Step 3: Delete the feed-2 parser**

Delete everything from `// Parse incidents from secondary source (table format)` (originally line 376) through the closing `}` of `parseSecondaryIncidents` and the blank line after it (originally line 467). The next remaining line is `serve(async (req) => {`.

- [ ] **Step 4: Delete the feed-2 fetch**

Inside `serve`, delete everything from `    // Fetch from secondary source (internal only)` (originally line 569) through the whitespace-only line after that `try/catch` (originally line 604). The next remaining line is:

```ts
    console.log(`[fetch-web3-incidents] Total incidents from all sources: ${allIncidents.length}`);
```

- [ ] **Step 5: Update the response**

Originally line 773. Before:

```ts
        message: 'Web3 incidents fetched from multiple sources',
```

After:

```ts
        message: 'Web3 incidents fetched',
```

Originally line 777. Before:

```ts
        sources: sourceResults.map(s => ({ ...s, source: s.source === 'primary' ? 'feed-1' : 'feed-2' })),
```

After:

```ts
        sources: sourceResults.map(s => ({ ...s, source: 'feed-1' })),
```

The in-batch dedup loop still contains `feed-2` string comparisons (originally lines 649-657). They are now dead branches, and Task A6 replaces the whole loop.

- [ ] **Step 6: Verify**

Run:

```bash
bun build supabase/functions/fetch-web3-incidents/index.ts --no-bundle > /dev/null && echo ok
grep -n "_s2\|parseSecondaryIncidents\|parseDate\|extractAmount\|determineSeverity\|major\|massive" supabase/functions/fetch-web3-incidents/index.ts
```

Expected: `ok`, and the grep prints nothing.

- [ ] **Step 7: Commit**

```bash
git add supabase/functions/fetch-web3-incidents/index.ts
git commit -m "refactor(web3-incidents): retire the QuillAudits page scrape"
```

---

### Task A5: Shared cross-provider dedup module

**Files:**
- Create: `supabase/functions/_shared/incident-dedup.ts`
- Modify: `supabase/functions/_shared/slowmist.ts` (imports after A2; lines 20-26 `SlowMistDuplicateCandidate`; lines 177-221 matcher functions)
- Modify: `supabase/functions/fetch-slowmist-incidents/index.ts` (lines 4-15 imports, 28-34, 132-172, 248, 255-262, 272-278)
- Test: `src/utils/__tests__/incidentDedup.test.ts` (create)

**Interfaces:**
- Consumes: `isCalendarDate` (A1).
- Produces (exactly as specified, plus one additive optional field):
  - `export interface DuplicateCandidate { uid: string; provider: string; target: string; date: string; attackMethod: string | null; amountInUsd: number | null; reference: string | null }`
  - `export interface IncidentRow { uid: string; title: string; published_at: string | null; source_name?: string | null; metadata: unknown; link?: string | null }`. `link` is new and optional. A6 uses it as a source URL fallback for legacy rows without `reference_url`.
  - `export function normalizeIncidentTarget(value: string): string`
  - `export function incidentTargetFromTitle(title: unknown): string`
  - `export function rowProvider(row: IncidentRow): string`
  - `export function candidateFromRow(row: IncidentRow): DuplicateCandidate | null`. Unlike the SlowMist original, it returns null when `metadata.incident_date_unknown === true` and no valid `incident_date` exists, because `published_at` is then the ingestion time. No existing row has that flag, so SlowMist behavior is unchanged.
  - `export function isHighConfidenceDuplicate(a: Omit<DuplicateCandidate,'uid'|'provider'>, b: Omit<DuplicateCandidate,'uid'|'provider'>): boolean`
  - `export function providerPriority(provider: string): number` (quillmonitor 0, web3-incidents/web3 1, slowmist 2, otherwise 3)
  - `export function pickCanonical<T extends { uid: string; provider: string }>(current: T | undefined, candidate: T): T`
- `slowmist.ts` keeps its old exported names as aliases, because `fetch-slowmist-incidents/index_test.ts` imports `isHighConfidenceSlowMistDuplicate` and `slowMistTargetFromTitle`: `SlowMistDuplicateCandidate`, `normalizeSlowMistTarget`, `slowMistTargetFromTitle`, `isHighConfidenceSlowMistDuplicate`. A grep of `src` and `supabase` found no other users of these names.

The canonical priority behavior stays the same. SlowMist only compares against rows from `quillmonitor`, `web3-incidents` and `web3` (`CANONICAL_PROVIDERS`), where the old and new priorities agree. The old code also gave any other provider priority 2; the new one gives 3.

- [ ] **Step 1: Write the failing test**

Create `src/utils/__tests__/incidentDedup.test.ts`. A6 and A7 append more `describe` blocks to this file.

```ts
import { describe, expect, it } from 'vitest';
import {
  candidateFromRow,
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  normalizeIncidentTarget,
  pickCanonical,
  providerPriority,
  rowProvider,
  type IncidentRow,
} from '../../../supabase/functions/_shared/incident-dedup';

// Fixtures are modelled on the duplicates seen on the live Web3 view
// (spec section 3): NEAR Intents three times, Meter twice, and
// Limit Break / Magic Eden as one incident under two names.
const nearQuillMonitor: IncidentRow = {
  uid: 'quillmonitor:near-intents-1',
  title: 'NEAR Intents: Private Key Compromise ($3.8M loss)',
  published_at: '2026-10-02T00:00:00.000Z',
  source_name: 'QuillMonitor',
  metadata: {
    provider: 'quillmonitor',
    project_name: 'NEAR Intents',
    incident_date: '2026-10-02',
    attack_type: 'Private Key Compromise',
    amount_lost_usd: 3_800_000,
    reference_url: 'https://x.com/near/status/1',
    verification_status: 'verified',
  },
};
const nearWeb3Feed1: IncidentRow = {
  uid: 'a1b2c3-feed1-near',
  title: 'NEAR Intents exploited for $3.8 million',
  published_at: '2026-10-03T00:00:00.000Z',
  source_name: null,
  link: 'https://x.com/zachxbt/status/2',
  metadata: {
    provider: 'web3-incidents',
    incident_date: '2026-10-03',
    attack_type: 'exploit',
    amount_lost_usd: 3_800_000,
    data_source: 'feed-1',
  },
};
// Legacy feed-2 row: amount stored a million times too large by the old parser.
const nearWeb3Feed2: IncidentRow = {
  uid: 'd4e5f6-feed2-near',
  title: 'NEAR Intents - Private Key Compromise ($3.8M)',
  published_at: '2026-10-02T00:00:00.000Z',
  source_name: null,
  link: '',
  metadata: {
    provider: 'web3-incidents',
    project_name: 'NEAR Intents',
    attack_type: 'Private Key Compromise',
    amount_lost_usd: 3_800_000_000_000,
    data_source: 'feed-2',
  },
};
const meterQuillMonitor: IncidentRow = {
  uid: 'quillmonitor:meter-1',
  title: 'Meter: Bridge Exploit ($4.4M loss)',
  published_at: '2026-09-14T00:00:00.000Z',
  source_name: 'QuillMonitor',
  metadata: { provider: 'quillmonitor', project_name: 'Meter', incident_date: '2026-09-14', attack_type: 'Bridge Exploit', amount_lost_usd: 4_400_000 },
};
const meterWeb3: IncidentRow = {
  uid: 'meter-feed1',
  title: 'Meter exploited for $4.4M',
  published_at: '2026-09-14T00:00:00.000Z',
  source_name: null,
  metadata: { provider: 'web3-incidents', incident_date: '2026-09-14', attack_type: 'exploit', amount_lost_usd: 4_400_000 },
};
const limitBreak: IncidentRow = {
  uid: 'quillmonitor:limit-break-1',
  title: 'Limit Break: Supply Chain Attack ($1.2M loss)',
  published_at: '2026-09-20T00:00:00.000Z',
  source_name: 'QuillMonitor',
  metadata: { provider: 'quillmonitor', project_name: 'Limit Break', incident_date: '2026-09-20', attack_type: 'Supply Chain Attack', amount_lost_usd: 1_200_000 },
};
const magicEden: IncidentRow = {
  uid: 'magic-eden-feed1',
  title: 'Magic Eden users drained after Limit Break contract compromise',
  published_at: '2026-09-20T00:00:00.000Z',
  source_name: null,
  metadata: { provider: 'web3-incidents', incident_date: '2026-09-20', attack_type: 'supply-chain', amount_lost_usd: 1_500_000 },
};

describe('target extraction and normalization', () => {
  it('extracts project names from legacy title shapes', () => {
    expect(incidentTargetFromTitle('Example Bridge: Access Control Exploit')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge - $2M exploit')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge exploited for $2M')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge suffers oracle attack')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge loses $2M')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Example Bridge hit by private key leak')).toBe('Example Bridge');
    expect(incidentTargetFromTitle('Project-With-Hyphen')).toBe('Project-With-Hyphen');
    expect(incidentTargetFromTitle('Tom &amp; Jerry Finance: Exploit')).toBe('Tom & Jerry Finance');
    expect(incidentTargetFromTitle(null)).toBe('');
  });

  it('normalizes case, punctuation and spacing', () => {
    expect(normalizeIncidentTarget('  NEAR   Intents ')).toBe('near intents');
    expect(normalizeIncidentTarget('near-intents')).toBe('near intents');
  });
});

describe('rowProvider and candidateFromRow', () => {
  it('reads the provider from metadata, falling back to the SlowMist source name', () => {
    expect(rowProvider(nearQuillMonitor)).toBe('quillmonitor');
    expect(rowProvider({ ...meterWeb3, metadata: {}, source_name: 'SlowMist Hacked' })).toBe('slowmist');
    expect(rowProvider({ ...meterWeb3, metadata: null })).toBe('');
  });

  it('prefers metadata project name and incident date, falls back to title and published_at', () => {
    expect(candidateFromRow(nearQuillMonitor)).toEqual({
      uid: 'quillmonitor:near-intents-1',
      provider: 'quillmonitor',
      target: 'NEAR Intents',
      date: '2026-10-02',
      attackMethod: 'Private Key Compromise',
      amountInUsd: 3_800_000,
      reference: 'https://x.com/near/status/1',
    });
    expect(candidateFromRow(nearWeb3Feed1)).toMatchObject({ target: 'NEAR Intents', date: '2026-10-03' });
    expect(candidateFromRow({ ...meterWeb3, metadata: { provider: 'web3-incidents' } }))
      .toMatchObject({ target: 'Meter', date: '2026-09-14', attackMethod: null, amountInUsd: null });
  });

  it('does not use the ingestion time as the incident date', () => {
    expect(candidateFromRow({
      ...meterWeb3,
      published_at: '2026-10-10T08:00:00.000Z',
      metadata: { provider: 'web3-incidents', incident_date: null, incident_date_unknown: true },
    })).toBeNull();
    expect(candidateFromRow({ ...meterWeb3, published_at: null, metadata: {} })).toBeNull();
    expect(candidateFromRow({ ...meterWeb3, title: '', metadata: { incident_date: '2026-09-14' } })).toBeNull();
  });
});

describe('isHighConfidenceDuplicate', () => {
  const incident = {
    target: 'Example Bridge',
    date: '2026-09-20',
    attackMethod: 'Oracle Manipulation',
    amountInUsd: 2_000_000,
    reference: 'https://example.com/reference',
  };
  const other = { target: 'Example Bridge', date: '2026-09-21', attackMethod: null, amountInUsd: null, reference: null };

  it('matches the same target on the same day without other evidence', () => {
    expect(isHighConfidenceDuplicate(incident, { ...other, target: '  example   bridge ', date: '2026-09-20' })).toBe(true);
  });

  it('needs a matching amount, attack method or reference within two days', () => {
    expect(isHighConfidenceDuplicate(incident, { ...other, attackMethod: 'Oracle Manipulation' })).toBe(true);
    expect(isHighConfidenceDuplicate(incident, { ...other, amountInUsd: 2_000_000 })).toBe(true);
    expect(isHighConfidenceDuplicate(incident, { ...other, reference: 'https://example.com/reference' })).toBe(true);
    expect(isHighConfidenceDuplicate(incident, { ...other, attackMethod: 'Different Method' })).toBe(false);
    expect(isHighConfidenceDuplicate(incident, { ...other, date: '2026-09-22', amountInUsd: 2_000_000 })).toBe(true);
  });

  it('never matches beyond two days or across different targets', () => {
    expect(isHighConfidenceDuplicate(incident, { ...incident, date: '2026-09-23' })).toBe(false);
    expect(isHighConfidenceDuplicate(incident, { ...incident, target: 'Different Bridge' })).toBe(false);
  });

  it('matches the NEAR Intents and Meter records across providers', () => {
    const quill = candidateFromRow(nearQuillMonitor)!;
    expect(isHighConfidenceDuplicate(quill, candidateFromRow(nearWeb3Feed1)!)).toBe(true); // adjacent day, same amount
    expect(isHighConfidenceDuplicate(quill, candidateFromRow(nearWeb3Feed2)!)).toBe(true); // same day
    expect(isHighConfidenceDuplicate(candidateFromRow(meterQuillMonitor)!, candidateFromRow(meterWeb3)!)).toBe(true);
  });

  it('does not merge Limit Break and Magic Eden automatically', () => {
    // Same day and same incident in reality, but the providers name different
    // entities (the compromised vendor vs the affected marketplace). Merging on
    // anything weaker than an exact project name would also merge unrelated
    // incidents, so this pair needs a manual alias, not a looser matcher.
    expect(isHighConfidenceDuplicate(candidateFromRow(limitBreak)!, candidateFromRow(magicEden)!)).toBe(false);
  });
});

describe('provider priority', () => {
  it('ranks QuillMonitor, then web3-incidents, then SlowMist, then unknown', () => {
    expect(providerPriority('quillmonitor')).toBe(0);
    expect(providerPriority('web3-incidents')).toBe(1);
    expect(providerPriority('web3')).toBe(1);
    expect(providerPriority('slowmist')).toBe(2);
    expect(providerPriority('rss')).toBe(3);
  });

  it('picks the higher-priority record, then the lower uid', () => {
    const quill = { uid: 'quillmonitor:b', provider: 'quillmonitor' };
    const web3 = { uid: 'a', provider: 'web3-incidents' };
    expect(pickCanonical(undefined, web3)).toBe(web3);
    expect(pickCanonical(web3, quill)).toBe(quill);
    expect(pickCanonical(quill, web3)).toBe(quill);
    expect(pickCanonical({ uid: 'quillmonitor:c', provider: 'quillmonitor' }, quill)).toBe(quill);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts`
Expected: FAIL with `Error: Cannot find module '../../../supabase/functions/_shared/incident-dedup'`.

- [ ] **Step 3: Implement the module**

Create `supabase/functions/_shared/incident-dedup.ts`:

```ts
// Cross-provider incident matcher shared by every Web3 importer and the
// dedupe-incidents backfill. Moved from the SlowMist importer so all
// providers agree on what "the same incident" means.
// Pure module: no Deno or URL imports, so vitest can import it.
import { isCalendarDate } from './incident-fields.ts';

export interface DuplicateCandidate {
  uid: string;
  provider: string;
  target: string;
  date: string;
  attackMethod: string | null;
  amountInUsd: number | null;
  reference: string | null;
}

export interface IncidentRow {
  uid: string;
  title: string;
  published_at: string | null;
  source_name?: string | null;
  metadata: unknown;
  // Optional: used only as a source URL fallback for rows without reference_url.
  link?: string | null;
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
  };
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, key: string) => {
    if (key[0] !== '#') return named[key.toLowerCase()] ?? entity;
    const hexadecimal = key[1]?.toLowerCase() === 'x';
    const parsed = Number.parseInt(key.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 0x10ffff
      ? String.fromCodePoint(parsed)
      : entity;
  });
}

function cleanTitle(value: unknown): string {
  return decodeHtmlEntities(String(value ?? '').replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

export function normalizeIncidentTarget(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Titles from older importers look like "Target: method", "Target - $2M" or
// "Target exploited for $2M"; the project name is the part before that.
export function incidentTargetFromTitle(title: unknown): string {
  const text = cleanTitle(title);
  if (!text) return '';
  const boundaries = [
    text.indexOf(':'),
    text.search(/\s[-–—]\s/),
    text.search(/\s+(?:(?:is|was)\s+)?(?:exploited|suffers?|loses?|hit\s+by)\b/i),
  ].filter((index) => index > 0);
  const boundary = boundaries.length ? Math.min(...boundaries) : -1;
  return (boundary > 0 ? text.slice(0, boundary) : text).trim();
}

export function rowProvider(row: IncidentRow): string {
  const provider = metadataRecord(row.metadata).provider;
  if (typeof provider === 'string') return provider.trim().toLowerCase();
  return row.source_name?.trim().toLowerCase() === 'slowmist hacked' ? 'slowmist' : '';
}

export function candidateFromRow(row: IncidentRow): DuplicateCandidate | null {
  const metadata = metadataRecord(row.metadata);
  const metadataTarget = typeof metadata.project_name === 'string' ? metadata.project_name.trim() : '';
  const target = metadataTarget || incidentTargetFromTitle(row.title);
  // When the importer could not parse a date, published_at is the ingestion
  // time, which says nothing about when the incident happened.
  const fallbackDate = metadata.incident_date_unknown === true || typeof row.published_at !== 'string'
    ? ''
    : row.published_at.slice(0, 10);
  const date = isCalendarDate(metadata.incident_date) ? metadata.incident_date : fallbackDate;
  if (!target || !isCalendarDate(date)) return null;
  return {
    uid: row.uid,
    provider: rowProvider(row),
    target,
    date,
    attackMethod: typeof metadata.attack_type === 'string' ? metadata.attack_type : null,
    amountInUsd: typeof metadata.amount_lost_usd === 'number' && Number.isFinite(metadata.amount_lost_usd)
      ? metadata.amount_lost_usd
      : null,
    reference: typeof metadata.reference_url === 'string' ? metadata.reference_url : null,
  };
}

// High confidence only: the same normalized project name, and either the same
// day or within two days with one more matching fact. Fuzzy name matching is
// deliberately out: a wrong merge hides a real incident, which is worse than
// showing a duplicate.
export function isHighConfidenceDuplicate(
  a: Omit<DuplicateCandidate, 'uid' | 'provider'>,
  b: Omit<DuplicateCandidate, 'uid' | 'provider'>,
): boolean {
  if (normalizeIncidentTarget(a.target) !== normalizeIncidentTarget(b.target)) return false;
  const aTime = new Date(`${a.date}T00:00:00.000Z`).getTime();
  const bTime = new Date(`${b.date}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return false;
  const dayDifference = Math.abs(aTime - bTime) / 86_400_000;
  if (dayDifference === 0) return true;
  if (dayDifference > 2) return false;

  const sameAmount = a.amountInUsd !== null && b.amountInUsd !== null && a.amountInUsd === b.amountInUsd;
  const sameAttackMethod = Boolean(
    a.attackMethod && b.attackMethod &&
    normalizeIncidentTarget(a.attackMethod) === normalizeIncidentTarget(b.attackMethod),
  );
  const sameReference = Boolean(a.reference && b.reference && a.reference === b.reference);
  return sameAmount || sameAttackMethod || sameReference;
}

// QuillMonitor has stable IDs and verification status, so it is the primary
// record; SlowMist is fact-only and last. Unknown providers never win.
export function providerPriority(provider: string): number {
  if (provider === 'quillmonitor') return 0;
  if (provider === 'web3-incidents' || provider === 'web3') return 1;
  if (provider === 'slowmist') return 2;
  return 3;
}

export function pickCanonical<T extends { uid: string; provider: string }>(current: T | undefined, candidate: T): T {
  if (!current) return candidate;
  const priorityDifference = providerPriority(candidate.provider) - providerPriority(current.provider);
  if (priorityDifference < 0) return candidate;
  if (priorityDifference > 0) return current;
  return candidate.uid.localeCompare(current.uid) < 0 ? candidate : current;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts`
Expected: `Tests  12 passed (12)`.

- [ ] **Step 5: Turn the SlowMist matcher into aliases**

In `supabase/functions/_shared/slowmist.ts`, after A2's import. Before:

```ts
import { severityFromLoss } from './incident-severity.ts';
```

After:

```ts
import { severityFromLoss } from './incident-severity.ts';
import {
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  normalizeIncidentTarget,
  type DuplicateCandidate,
} from './incident-dedup.ts';
```

Lines 20-26. Before:

```ts
export interface SlowMistDuplicateCandidate {
  target: string;
  date: string;
  attackMethod: string | null;
  amountInUsd: number | null;
  reference: string | null;
}
```

After:

```ts
// The matcher moved to incident-dedup.ts; these aliases keep the SlowMist
// Deno tests and any older callers working unchanged.
export type SlowMistDuplicateCandidate = Omit<DuplicateCandidate, 'uid' | 'provider'>;
export const normalizeSlowMistTarget = normalizeIncidentTarget;
export const slowMistTargetFromTitle = incidentTargetFromTitle;
export const isHighConfidenceSlowMistDuplicate: (
  incident: SlowMistIncident,
  candidate: SlowMistDuplicateCandidate,
) => boolean = isHighConfidenceDuplicate;
```

Then delete the old implementations: everything from `export function normalizeSlowMistTarget(value: string): string {` (originally line 177) through the closing `}` of `isHighConfidenceSlowMistDuplicate` and the blank line after it (originally line 221). The next remaining line is `function slug(value: string): string {`. `slug`, `slowMistUid` and the content hash still call `normalizeSlowMistTarget`, which is now the alias, so their output is identical.

- [ ] **Step 6: Switch the SlowMist importer to the shared module**

In `supabase/functions/fetch-slowmist-incidents/index.ts`, lines 4-15. Before:

```ts
import {
  hasCompleteSlowMistPage,
  isHighConfidenceSlowMistDuplicate,
  normalizeSlowMistIncident,
  parseSlowMistPage,
  slowMistRecordNeedsWrite,
  slowMistTargetFromTitle,
  SLOWMIST_EXPECTED_PAGE_SIZE,
  SLOWMIST_PAGE_URL,
  type NormalizedSlowMistArticle,
  type SlowMistDuplicateCandidate,
} from '../_shared/slowmist.ts';
```

After:

```ts
import {
  hasCompleteSlowMistPage,
  normalizeSlowMistIncident,
  parseSlowMistPage,
  slowMistRecordNeedsWrite,
  SLOWMIST_EXPECTED_PAGE_SIZE,
  SLOWMIST_PAGE_URL,
  type NormalizedSlowMistArticle,
} from '../_shared/slowmist.ts';
import {
  candidateFromRow,
  isHighConfidenceDuplicate,
  pickCanonical,
  rowProvider,
  type DuplicateCandidate,
  type IncidentRow,
} from '../_shared/incident-dedup.ts';
```

Delete lines 28-34 together with the blank line after them:

```ts
type ExistingIncidentRow = {
  uid: string;
  title: string;
  published_at: string;
  source_name: string | null;
  metadata: unknown;
};

```

Delete `rowDuplicateCandidate`, `rowProvider`, `canonicalPriority` and `pickCanonical`: everything from `function rowDuplicateCandidate(row: ExistingIncidentRow): SlowMistDuplicateCandidate | null {` (originally line 132) through the blank line before `function shiftDate(date: string, days: number): string {` (originally line 172). Keep `metadataRecord` (line 126) and `shiftDate`.

Originally line 248. Before:

```ts
    const existingRows = (relatedRows ?? []) as ExistingIncidentRow[];
```

After:

```ts
    const existingRows = (relatedRows ?? []) as IncidentRow[];
```

Originally lines 255-262. Before:

```ts
    const canonicalRows: ExistingIncidentRow[] = [];
    for (const row of existingRows) {
      const provider = rowProvider(row);
      if (!CANONICAL_PROVIDERS.has(provider)) continue;
      if (metadataRecord(row.metadata).classification_relevant === false) continue;
      if (!rowDuplicateCandidate(row)) continue;
      canonicalRows.push(row);
    }
```

After:

```ts
    const canonicalCandidates: DuplicateCandidate[] = [];
    for (const row of existingRows) {
      const provider = rowProvider(row);
      if (!CANONICAL_PROVIDERS.has(provider)) continue;
      if (metadataRecord(row.metadata).classification_relevant === false) continue;
      const candidate = candidateFromRow(row);
      if (candidate) canonicalCandidates.push(candidate);
    }
```

Originally lines 272-278. Before:

```ts
      let canonical: ExistingIncidentRow | undefined;
      for (const row of canonicalRows) {
        const candidate = rowDuplicateCandidate(row);
        if (candidate && isHighConfidenceSlowMistDuplicate(incident, candidate)) {
          canonical = pickCanonical(canonical, row);
        }
      }
```

After:

```ts
      let canonical: DuplicateCandidate | undefined;
      for (const candidate of canonicalCandidates) {
        if (isHighConfidenceDuplicate(incident, candidate)) {
          canonical = pickCanonical(canonical, candidate);
        }
      }
```

`canonical.uid` is used further down exactly as before.

- [ ] **Step 7: Verify**

Run:

```bash
rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts
for f in supabase/functions/fetch-slowmist-incidents/index.ts supabase/functions/fetch-slowmist-incidents/index_test.ts; do bun build "$f" --no-bundle > /dev/null && echo "ok $f"; done
npx tsc --noEmit -p tsconfig.app.json
npx eslint supabase/functions/_shared/incident-dedup.ts supabase/functions/_shared/slowmist.ts supabase/functions/fetch-slowmist-incidents/index.ts src/utils/__tests__/incidentDedup.test.ts
grep -n "ExistingIncidentRow\|rowDuplicateCandidate\|canonicalPriority" supabase/functions/fetch-slowmist-incidents/index.ts
```

Expected: 12 tests pass, two `ok` lines, no type or lint errors, and the grep prints nothing.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/_shared/incident-dedup.ts supabase/functions/_shared/slowmist.ts supabase/functions/fetch-slowmist-incidents/index.ts src/utils/__tests__/incidentDedup.test.ts
git commit -m "refactor(ingestion): move cross-provider incident matcher to a shared module"
```

---

### Task A6: Apply dedup at ingestion and merge sources

**Files:**
- Modify: `supabase/functions/_shared/incident-dedup.ts` (replace the import, then append)
- Modify: `supabase/functions/fetch-web3-incidents/index.ts` (imports; constants after the retired-feed comment; the dedup and insert block, originally lines 618-725)
- Modify: `supabase/functions/_shared/quillmonitor.ts` (imports; end of `normalizeQuillMonitorIncident`)
- Modify: `supabase/functions/fetch-quillmonitor-incidents/index.ts` (lines 1, 3-13, 25-26, 96, 219-240, 260, 276-281, 298-299)
- Test: `src/utils/__tests__/incidentDedup.test.ts` (extend), `src/utils/__tests__/quillMonitorMerge.test.ts` (create)

**Interfaces:**
- Consumes: A1 (`mergeIncidentSources`, `readIncidentFields`, `safeHttpUrl`, `IncidentSource`), A5 (all).
- Produces (new exports in `incident-dedup.ts`):
  - `export function incidentSourcesFromRow(row: IncidentRow): IncidentSource[]`
  - `export interface DuplicateMark { uid: string; duplicateOfUid: string; metadata: Record<string, unknown>; needsWrite: boolean }`
  - `export interface CanonicalMergePlan { marks: DuplicateMark[]; sourcesByCanonical: Record<string, IncidentSource[]> }`
  - `export function duplicateMetadata(metadata: unknown, duplicateOfUid: string): Record<string, unknown>`
  - `export function planCanonicalMerges(canonicalRows: IncidentRow[], candidateRows: IncidentRow[]): CanonicalMergePlan`
  - `export function matchExistingIncident(incident: IncidentRow, existingRows: IncidentRow[]): string | null`
  - `export function shiftDate(date: string, days: number): string`
  - `export function incidentDateWindows(dates: string[]): { from: string; to: string }[]`
- Produces (in `quillmonitor.ts`): `export interface ExistingQuillMonitorRow { summary: string | null; metadata: unknown }` and `export function finalizeQuillMonitorArticle(article: NormalizedQuillMonitorArticle, existing: ExistingQuillMonitorRow | undefined, duplicateSources: IncidentSource[] | null): NormalizedQuillMonitorArticle`. QuillMonitor rows now carry `metadata.sources`, with their own entry first.
- Record changes: lower-priority duplicates get `metadata.classification_relevant = false` and `metadata.duplicate_of_uid = <quillmonitor uid>`, with the rest of their metadata kept. The QuillMonitor row's `metadata.sources` lists its own source followed by the duplicates' sources (at most 10).

Design of the QuillMonitor merge:

- Every QuillMonitor upsert replaces `metadata`. Merged sources are therefore re-derived in the same pass, for every QuillMonitor row in the sync batch (new and updated), before the upsert.
- Query bounds: `incidentDateWindows` turns the batch's incident dates into `[date - 2 days, date + 3 days)` ranges on `published_at`, merging overlapping ranges. Each window is queried with `metadata->>provider in (web3-incidents, web3, slowmist)`, `count: 'exact'` and `limit(500)` (the same `MAX_RELATED_ROWS` as SlowMist).
- The lookup never fails the sync. If there are more than 20 windows (a `mode: 'full'` sync spanning years), a window holds more than 500 rows, or a query errors, merging is skipped for that run (`merge_lookup` in the run metadata says why). `finalizeQuillMonitorArticle(..., null)` then carries forward the non-QuillMonitor sources the row already had, so a skipped lookup never wipes earlier merges. The A7 backfill covers history.
- Duplicate rows are marked only after their QuillMonitor row was written in this run. A failed mark is counted as a persistence error, so the sync cursor does not advance and the next run retries.
- Rows already marked as duplicates of a uid outside this batch are left alone. Two QuillMonitor rows are never merged.
- The Telegram trigger also fires when only duplicates were marked, so the poster can edit posts about rows that just became duplicates.

For `fetch-web3-incidents`: each incident with a known date is checked against rows from all Web3 providers in `[date - 2 days, date + 3 days)` on `published_at` (same `.or(...)` filter as SlowMist, ordered, `limit(200)`). The insert is skipped and counted in `similar_skipped` when a row with the same uid exists (counted as a duplicate) or `matchExistingIncident` finds a same-or-higher-priority match. Equal priority is included so that a re-titled feed entry with a new uid, or a legacy feed-2 row, also blocks the insert. A failed lookup skips the insert and records an error: inserting without the check could add a duplicate. Undated incidents are inserted unchecked and left to the A7 review.

- [ ] **Step 1: Write the failing tests**

(a) In `src/utils/__tests__/incidentDedup.test.ts`, replace the import block. Before:

```ts
import {
  candidateFromRow,
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  normalizeIncidentTarget,
  pickCanonical,
  providerPriority,
  rowProvider,
  type IncidentRow,
} from '../../../supabase/functions/_shared/incident-dedup';
```

After:

```ts
import {
  candidateFromRow,
  incidentDateWindows,
  incidentSourcesFromRow,
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  matchExistingIncident,
  normalizeIncidentTarget,
  pickCanonical,
  planCanonicalMerges,
  providerPriority,
  rowProvider,
  type IncidentRow,
} from '../../../supabase/functions/_shared/incident-dedup';
```

(b) Append to the end of `src/utils/__tests__/incidentDedup.test.ts`:

```ts
describe('incidentSourcesFromRow', () => {
  it('uses stored sources when present', () => {
    expect(incidentSourcesFromRow({
      ...nearWeb3Feed1,
      metadata: { provider: 'web3-incidents', sources: [{ provider: 'web3-incidents', url: 'https://x.com/a', label: '@a', amount_usd: 3_800_000 }] },
    })).toEqual([{ provider: 'web3-incidents', url: 'https://x.com/a', label: '@a', amount_usd: 3_800_000 }]);
  });

  it('builds one source from reference_url or link and drops implausible legacy amounts', () => {
    expect(incidentSourcesFromRow(nearWeb3Feed1)).toEqual([
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: 'Web3 incident tracker', amount_usd: 3_800_000 },
    ]);
    expect(incidentSourcesFromRow(nearWeb3Feed2)).toEqual([
      { provider: 'web3-incidents', url: null, label: 'Web3 incident tracker', amount_usd: null },
    ]);
  });
});

describe('planCanonicalMerges', () => {
  it('marks lower-priority duplicates and collects their sources on the canonical row', () => {
    const plan = planCanonicalMerges([nearQuillMonitor, limitBreak], [nearWeb3Feed1, nearWeb3Feed2, magicEden]);
    expect(plan.marks.map((mark) => [mark.uid, mark.duplicateOfUid, mark.needsWrite])).toEqual([
      ['a1b2c3-feed1-near', 'quillmonitor:near-intents-1', true],
      ['d4e5f6-feed2-near', 'quillmonitor:near-intents-1', true],
    ]);
    expect(plan.marks[0].metadata).toMatchObject({
      provider: 'web3-incidents',
      data_source: 'feed-1',
      classification_relevant: false,
      duplicate_of_uid: 'quillmonitor:near-intents-1',
    });
    expect(plan.sourcesByCanonical['quillmonitor:near-intents-1']).toEqual([
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: 'Web3 incident tracker', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: null, label: 'Web3 incident tracker', amount_usd: null },
    ]);
    expect(plan.sourcesByCanonical['quillmonitor:limit-break-1']).toBeUndefined();
  });

  it('skips rows already marked as a duplicate of a record outside the batch', () => {
    const elsewhere = {
      ...nearWeb3Feed1,
      metadata: { ...(nearWeb3Feed1.metadata as object), classification_relevant: false, duplicate_of_uid: 'quillmonitor:other' },
    };
    expect(planCanonicalMerges([nearQuillMonitor], [elsewhere]).marks).toEqual([]);
  });

  it('reports no write for rows already marked against the same canonical', () => {
    const marked = {
      ...meterWeb3,
      metadata: { ...(meterWeb3.metadata as object), classification_relevant: false, duplicate_of_uid: 'quillmonitor:meter-1' },
    };
    const plan = planCanonicalMerges([meterQuillMonitor], [marked]);
    expect(plan.marks).toHaveLength(1);
    expect(plan.marks[0].needsWrite).toBe(false);
    expect(plan.sourcesByCanonical['quillmonitor:meter-1']).toHaveLength(1);
  });

  it('never marks a row of equal or higher priority', () => {
    const otherQuill = { ...nearQuillMonitor, uid: 'quillmonitor:near-intents-2' };
    expect(planCanonicalMerges([nearQuillMonitor], [otherQuill]).marks).toEqual([]);
  });
});

describe('matchExistingIncident', () => {
  it('finds a higher-priority record of the same incident', () => {
    expect(matchExistingIncident(nearWeb3Feed1, [nearQuillMonitor, meterQuillMonitor])).toBe('quillmonitor:near-intents-1');
  });

  it('finds an equal-priority record with a different uid', () => {
    // Same day, so a re-titled feed entry (new uid) is still caught.
    expect(matchExistingIncident(nearWeb3Feed2, [{ ...nearWeb3Feed2, uid: 'older-near-row' }])).toBe('older-near-row');
  });

  it('does not match the legacy feed-2 NEAR row from the next day (inflated amount, different method)', () => {
    expect(matchExistingIncident(nearWeb3Feed1, [nearWeb3Feed2])).toBeNull();
  });

  it('ignores lower-priority records, the incident itself and hidden rows', () => {
    const slowMist = { ...nearWeb3Feed2, uid: 'slowmist:2026-10-02:abc', metadata: { ...(nearWeb3Feed2.metadata as object), provider: 'slowmist' } };
    expect(matchExistingIncident(nearWeb3Feed1, [slowMist])).toBeNull();
    expect(matchExistingIncident(nearWeb3Feed1, [nearWeb3Feed1])).toBeNull();
    const hidden = { ...nearQuillMonitor, metadata: { ...(nearQuillMonitor.metadata as object), classification_relevant: false } };
    expect(matchExistingIncident(nearWeb3Feed1, [hidden])).toBeNull();
  });

  it('returns null when the incident has no usable date', () => {
    const undated = { ...nearWeb3Feed1, metadata: { provider: 'web3-incidents', incident_date: null, incident_date_unknown: true } };
    expect(matchExistingIncident(undated, [nearQuillMonitor])).toBeNull();
  });
});

describe('incidentDateWindows', () => {
  it('pads each date by two days and merges overlapping windows', () => {
    expect(incidentDateWindows(['2026-10-02', '2026-09-14', '2026-10-03', 'bad', '2026-10-02'])).toEqual([
      { from: '2026-09-12T00:00:00.000Z', to: '2026-09-17T00:00:00.000Z' },
      { from: '2026-09-30T00:00:00.000Z', to: '2026-10-06T00:00:00.000Z' },
    ]);
    expect(incidentDateWindows([])).toEqual([]);
  });
});
```

(c) Create `src/utils/__tests__/quillMonitorMerge.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  finalizeQuillMonitorArticle,
  normalizeQuillMonitorIncident,
  type QuillMonitorIncident,
} from '../../../supabase/functions/_shared/quillmonitor';

const incident: QuillMonitorIncident = {
  id: 'near-intents-1',
  target: 'NEAR Intents',
  date: '2026-10-02',
  chain: 'NEAR',
  category: 'Bridge',
  attackedMethod: 'Private Key Compromise',
  amountInUsd: 3_800_000,
  description: 'An attacker used a leaked key to drain the solver.',
  reference: 'https://x.com/near/status/1',
  verificationStatus: 'verified',
  createdAt: '2026-10-02T10:00:00.000Z',
  updatedAt: '2026-10-02T12:00:00.000Z',
};
const web3Source = { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: '@zachxbt', amount_usd: 3_800_000 };

describe('QuillMonitor sources', () => {
  it('records its own source with the incident reference', () => {
    expect(normalizeQuillMonitorIncident(incident).metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
    ]);
  });

  it('falls back to the QuillMonitor database link without a reference', () => {
    const article = normalizeQuillMonitorIncident({ ...incident, reference: '' });
    expect(article.metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://www.quillaudits.com/web3-hacks-database', label: 'QuillMonitor', amount_usd: 3_800_000 },
    ]);
  });
});

describe('finalizeQuillMonitorArticle', () => {
  const article = normalizeQuillMonitorIncident(incident);

  it('appends duplicate sources found in this sync after its own', () => {
    const finalized = finalizeQuillMonitorArticle(article, undefined, [web3Source]);
    expect(finalized.metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
      web3Source,
    ]);
    expect(article.metadata.sources).toHaveLength(1);
  });

  it('drops previously merged sources when the lookup ran and found none', () => {
    const existing = { summary: null, metadata: { sources: [web3Source] } };
    expect(finalizeQuillMonitorArticle(article, existing, []).metadata.sources).toHaveLength(1);
  });

  it('keeps previously merged sources when the lookup was skipped', () => {
    const existing = {
      summary: null,
      metadata: {
        sources: [
          { provider: 'quillmonitor', url: 'https://old.example.com/ref', label: 'QuillMonitor', amount_usd: 1 },
          web3Source,
        ],
      },
    };
    expect(finalizeQuillMonitorArticle(article, existing, null).metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
      web3Source,
    ]);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts src/utils/__tests__/quillMonitorMerge.test.ts`
Expected: FAIL with 17 failed tests. All 12 new tests in `incidentDedup.test.ts` fail with errors such as `TypeError: incidentSourcesFromRow is not a function`. All 5 tests in `quillMonitorMerge.test.ts` fail, because `metadata.sources` is undefined and `finalizeQuillMonitorArticle` is not a function.

- [ ] **Step 3: Extend `incident-dedup.ts`**

(a) Replace the import at the top of `supabase/functions/_shared/incident-dedup.ts`. Before:

```ts
import { isCalendarDate } from './incident-fields.ts';
```

After:

```ts
import {
  isCalendarDate,
  mergeIncidentSources,
  readIncidentFields,
  safeHttpUrl,
  type IncidentSource,
} from './incident-fields.ts';
```

(b) Append to the end of the file:

```ts
// Labels for rows whose source_name is empty (web3-incidents stores null).
const PROVIDER_LABELS: Record<string, string> = {
  quillmonitor: 'QuillMonitor',
  'web3-incidents': 'Web3 incident tracker',
  web3: 'Web3 incident tracker',
  slowmist: 'SlowMist Hacked',
};

// Legacy web3-incidents rows stored some amounts a million times too large;
// never copy those into another record's sources.
const MAX_PLAUSIBLE_USD = 100_000_000_000;

// The sources a row contributes when it is merged into another record: its
// own metadata.sources when present, otherwise one entry built from its fields.
export function incidentSourcesFromRow(row: IncidentRow): IncidentSource[] {
  const fields = readIncidentFields(row.metadata);
  if (fields.sources.length > 0) {
    return fields.sources.map((source) => ({
      ...source,
      amount_usd: source.amount_usd !== null && source.amount_usd <= MAX_PLAUSIBLE_USD ? source.amount_usd : null,
    }));
  }
  const metadata = metadataRecord(row.metadata);
  const provider = rowProvider(row) || 'unknown';
  const amount = metadata.amount_lost_usd;
  return [{
    provider,
    url: safeHttpUrl(metadata.reference_url) ?? safeHttpUrl(row.link),
    label: row.source_name?.trim() || PROVIDER_LABELS[provider] || provider,
    amount_usd: typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 && amount <= MAX_PLAUSIBLE_USD
      ? amount
      : null,
  }];
}

// Rows that some other rule already hid (classification_relevant=false with
// no duplicate_of_uid) are not incidents we show, so they never take part.
function isHiddenForOtherReasons(row: IncidentRow): boolean {
  const metadata = metadataRecord(row.metadata);
  return metadata.classification_relevant === false && typeof metadata.duplicate_of_uid !== 'string';
}

export interface DuplicateMark {
  uid: string;
  duplicateOfUid: string;
  // Full metadata to write: the row's own metadata plus the duplicate fields.
  metadata: Record<string, unknown>;
  // False when the row is already marked exactly this way.
  needsWrite: boolean;
}

export interface CanonicalMergePlan {
  marks: DuplicateMark[];
  sourcesByCanonical: Record<string, IncidentSource[]>;
}

export function duplicateMetadata(metadata: unknown, duplicateOfUid: string): Record<string, unknown> {
  return { ...metadataRecord(metadata), classification_relevant: false, duplicate_of_uid: duplicateOfUid };
}

/**
 * For a batch of canonical rows (QuillMonitor), finds lower-priority rows that
 * describe the same incident. Returns the marks to write on those rows and the
 * sources each canonical row should carry. Rows already marked as a duplicate
 * of a record outside this batch are left alone.
 */
export function planCanonicalMerges(canonicalRows: IncidentRow[], candidateRows: IncidentRow[]): CanonicalMergePlan {
  const canonicals = canonicalRows
    .map(candidateFromRow)
    .filter((candidate): candidate is DuplicateCandidate => candidate !== null);
  const canonicalUids = new Set(canonicals.map((candidate) => candidate.uid));
  const marks: DuplicateMark[] = [];
  const sourcesByCanonical: Record<string, IncidentSource[]> = {};

  for (const row of candidateRows) {
    if (canonicalUids.has(row.uid) || isHiddenForOtherReasons(row)) continue;
    const existingMark = readIncidentFields(row.metadata).duplicateOfUid;
    if (existingMark && !canonicalUids.has(existingMark)) continue;
    const candidate = candidateFromRow(row);
    if (!candidate) continue;

    let canonical: DuplicateCandidate | undefined;
    for (const option of canonicals) {
      if (providerPriority(option.provider) >= providerPriority(candidate.provider)) continue;
      if (isHighConfidenceDuplicate(option, candidate)) canonical = pickCanonical(canonical, option);
    }
    if (!canonical) continue;

    const metadata = metadataRecord(row.metadata);
    marks.push({
      uid: row.uid,
      duplicateOfUid: canonical.uid,
      metadata: duplicateMetadata(row.metadata, canonical.uid),
      needsWrite: metadata.classification_relevant !== false || metadata.duplicate_of_uid !== canonical.uid,
    });
    sourcesByCanonical[canonical.uid] = mergeIncidentSources(
      sourcesByCanonical[canonical.uid] ?? [],
      incidentSourcesFromRow(row),
    );
  }

  return { marks, sourcesByCanonical };
}

/**
 * Returns the uid of an existing record that already describes this incident
 * and comes from the same or a higher-priority provider, or null. Importers
 * skip the insert when this returns a uid. Rows hidden for other reasons and
 * the incident's own uid never count.
 */
export function matchExistingIncident(incident: IncidentRow, existingRows: IncidentRow[]): string | null {
  const candidate = candidateFromRow(incident);
  if (!candidate) return null;
  const ownPriority = providerPriority(candidate.provider);
  let best: DuplicateCandidate | undefined;
  for (const row of existingRows) {
    if (row.uid === incident.uid || isHiddenForOtherReasons(row)) continue;
    const existing = candidateFromRow(row);
    if (!existing || providerPriority(existing.provider) > ownPriority) continue;
    if (isHighConfidenceDuplicate(existing, candidate)) best = pickCanonical(best, existing);
  }
  return best?.uid ?? null;
}

export function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString();
}

/**
 * Turns incident dates into the published_at ranges ([from, to), ISO) that can
 * hold a match: two days either side, overlapping ranges merged. Lets a batch
 * spanning months query a few narrow windows instead of everything between.
 */
export function incidentDateWindows(dates: string[]): { from: string; to: string }[] {
  const sorted = [...new Set(dates.filter(isCalendarDate))].sort();
  const windows: { from: string; to: string }[] = [];
  for (const date of sorted) {
    const from = shiftDate(date, -2);
    const to = shiftDate(date, 3);
    const last = windows[windows.length - 1];
    if (last && from <= last.to) last.to = to;
    else windows.push({ from, to });
  }
  return windows;
}
```

- [ ] **Step 4: Give QuillMonitor rows sources and a finalize step**

In `supabase/functions/_shared/quillmonitor.ts`, after A2's import. Before:

```ts
import { severityFromLoss } from './incident-severity.ts';
```

After:

```ts
import { severityFromLoss } from './incident-severity.ts';
import { mergeIncidentSources, readIncidentFields, type IncidentSource } from './incident-fields.ts';
```

At the end of `normalizeQuillMonitorIncident` (originally lines 364-369). Before:

```ts
      summary_origin: 'provider',
      attribution_url: quillMonitorUrl,
      synced_at: new Date().toISOString(),
    },
  };
}
```

After:

```ts
      summary_origin: 'provider',
      sources: [{
        provider: 'quillmonitor',
        url: referenceUrl,
        label: 'QuillMonitor',
        amount_usd: incident.amountInUsd,
      }],
      attribution_url: quillMonitorUrl,
      synced_at: new Date().toISOString(),
    },
  };
}

export interface ExistingQuillMonitorRow {
  summary: string | null;
  metadata: unknown;
}

/**
 * Final write shape for one QuillMonitor row. The upsert replaces metadata, so
 * sources merged from duplicate records are added back on every sync.
 * duplicateSources is null when the duplicate lookup did not run this sync;
 * then the row keeps the non-QuillMonitor sources it already had instead of
 * losing them.
 */
export function finalizeQuillMonitorArticle(
  article: NormalizedQuillMonitorArticle,
  existing: ExistingQuillMonitorRow | undefined,
  duplicateSources: IncidentSource[] | null,
): NormalizedQuillMonitorArticle {
  const ownSources = readIncidentFields(article.metadata).sources;
  const carriedSources = duplicateSources ??
    readIncidentFields(existing?.metadata).sources.filter((source) => source.provider !== 'quillmonitor');
  return {
    ...article,
    metadata: { ...article.metadata, sources: mergeIncidentSources(ownSources, carriedSources) },
  };
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts src/utils/__tests__/quillMonitorMerge.test.ts`
Expected: `Test Files  2 passed (2)`, `Tests  29 passed (29)` (24 in `incidentDedup.test.ts`, 5 in `quillMonitorMerge.test.ts`).

- [ ] **Step 6: Dedup in `fetch-web3-incidents`**

In `supabase/functions/fetch-web3-incidents/index.ts`:

(a) Imports. Before:

```ts
import { severityFromLoss } from '../_shared/incident-severity.ts';
```

After:

```ts
import { severityFromLoss } from '../_shared/incident-severity.ts';
import { matchExistingIncident, shiftDate, type IncidentRow } from '../_shared/incident-dedup.ts';
```

(b) Constants, below the comment A4 added. Before:

```ts
// The secondary page scrape (feed-2) was retired: the QuillMonitor partner API
// returns the same incidents with stable IDs and verification status.
```

After:

```ts
// The secondary page scrape (feed-2) was retired: the QuillMonitor partner API
// returns the same incidents with stable IDs and verification status.

// Rows from every Web3 incident provider, matching the SlowMist importer.
const WEB3_INCIDENT_FILTER = 'metadata->>is_web3_incident.eq.true,metadata->>provider.in.(quillmonitor,web3-incidents,web3,slowmist)';
// A five-day window holds a handful of incidents; the cap only guards
// against a runaway query.
const MAX_RELATED_ROWS = 200;
```

(c) Replace the whole block from `    // Deduplicate across sources: extract project name and check for similar incidents` (originally line 618) through the blank line after the insert loop's closing `    }` (originally line 725). That block contains `extractProjectName`, the `seenProjects` loop, the unordered `.limit(50)` lookup and the upsert loop. The line after the replacement must stay:

```ts
    console.log(`[fetch-web3-incidents] Inserted: ${insertedCount}, Duplicates: ${duplicateCount}, Similar: ${skippedSimilar}`);
```

Replacement:

```ts
    // One incident, one record: drop entries in this scrape that repeat an
    // earlier entry, using the shared cross-provider matcher.
    const deduplicatedIncidents: any[] = [];
    let skippedSimilar = 0;
    for (const incident of recentIncidents) {
      if (matchExistingIncident(incident as IncidentRow, deduplicatedIncidents as IncidentRow[])) {
        skippedSimilar++;
        continue;
      }
      deduplicatedIncidents.push(incident);
    }
    
    console.log(`[fetch-web3-incidents] After dedup: ${deduplicatedIncidents.length} unique incidents`);
    
    let insertedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];
    
    for (const incident of deduplicatedIncidents) {
      const incidentDate: string | null = incident.metadata.incident_date;
      // Without a date the matcher cannot place the incident, so it is
      // inserted and left to the dedupe-incidents backfill review.
      if (incidentDate) {
        const { data: related, error: relatedError } = await supabase
          .from('news_articles')
          .select('uid,title,published_at,source_name,metadata')
          .gte('published_at', shiftDate(incidentDate, -2))
          .lt('published_at', shiftDate(incidentDate, 3))
          .or(WEB3_INCIDENT_FILTER)
          .order('published_at', { ascending: true })
          .limit(MAX_RELATED_ROWS);
        if (relatedError) {
          // Fail closed: inserting without the check could add a duplicate.
          errors.push(`${incident.title}: existing incident lookup failed`);
          continue;
        }
        const relatedRows = (related ?? []) as IncidentRow[];
        if (relatedRows.some((row) => row.uid === incident.uid)) {
          duplicateCount++;
          continue;
        }
        // A record from QuillMonitor (higher priority) or an earlier
        // web3-incidents row already covers this incident.
        if (matchExistingIncident(incident as IncidentRow, relatedRows)) {
          skippedSimilar++;
          continue;
        }
      }
      
      const { error: insertError } = await supabase
        .from('news_articles')
        .upsert(incident, { onConflict: 'uid', ignoreDuplicates: true });
      
      if (insertError) {
        if (insertError.code === '23505') {
          duplicateCount++;
        } else {
          console.error('[fetch-web3-incidents] Insert error:', insertError);
          errors.push(`${incident.title}: ${insertError.message}`);
        }
      } else {
        insertedCount++;
      }
    }
```

The run record keeps `similar_skipped: skippedSimilar` and `duplicates: duplicateCount` (originally lines 742-743). Both are now accurate: an incident that is already stored no longer counts as inserted.

- [ ] **Step 7: Merge in `fetch-quillmonitor-incidents`**

In `supabase/functions/fetch-quillmonitor-incidents/index.ts`:

(a) Line 1. Before:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
```

After:

```ts
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
```

(b) Lines 3-13. Before:

```ts
import {
  assessQuillMonitorRunHealth,
  buildQuillMonitorRequestUrl,
  hasCompleteQuillMonitorResult,
  isSafeQuillMonitorSyncWindow,
  normalizeQuillMonitorIncident,
  parseQuillMonitorPage,
  parseQuillMonitorIncident,
  type NormalizedQuillMonitorArticle,
} from '../_shared/quillmonitor.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
```

After:

```ts
import {
  assessQuillMonitorRunHealth,
  buildQuillMonitorRequestUrl,
  finalizeQuillMonitorArticle,
  hasCompleteQuillMonitorResult,
  isSafeQuillMonitorSyncWindow,
  normalizeQuillMonitorIncident,
  parseQuillMonitorPage,
  parseQuillMonitorIncident,
  type ExistingQuillMonitorRow,
  type NormalizedQuillMonitorArticle,
} from '../_shared/quillmonitor.ts';
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import {
  incidentDateWindows,
  planCanonicalMerges,
  type IncidentRow,
} from '../_shared/incident-dedup.ts';
```

(c) Lines 25-26. Before:

```ts
const DATABASE_BATCH_SIZE = 50;
const SYNC_CURSOR_KEY = 'QUILLMONITOR_SYNC_SINCE';
```

After:

```ts
const DATABASE_BATCH_SIZE = 50;
const SYNC_CURSOR_KEY = 'QUILLMONITOR_SYNC_SINCE';
// Providers that rank below QuillMonitor and can be merged into its records.
const LOWER_PRIORITY_PROVIDERS = ['web3-incidents', 'web3', 'slowmist'];
// Same safety cap as the SlowMist importer, applied per date window.
const MAX_RELATED_ROWS = 500;
// An incremental sync touches a few dates; a full sync spans years and is left
// to the dedupe-incidents backfill rather than issuing hundreds of queries.
const MAX_LOOKUP_WINDOWS = 20;
```

(d) Add the lookup helper above `normalizeSyncCursor` (line 96). Before:

```ts
function normalizeSyncCursor(value: unknown): string | null {
```

After:

```ts
type DuplicateLookup = { rows: IncidentRow[]; skippedReason: string | null };

// Loads lower-priority incident rows within two days of any incident in the
// batch. Never throws: a failed lookup only skips merging for this sync.
async function loadDuplicateCandidates(
  db: SupabaseClient,
  articles: NormalizedQuillMonitorArticle[],
): Promise<DuplicateLookup> {
  const windows = incidentDateWindows(articles.map((article) => String(article.metadata.incident_date)));
  if (windows.length === 0) return { rows: [], skippedReason: null };
  if (windows.length > MAX_LOOKUP_WINDOWS) return { rows: [], skippedReason: 'too_many_date_windows' };

  const rows: IncidentRow[] = [];
  for (const window of windows) {
    const { data, error, count } = await db
      .from('news_articles')
      .select('uid,title,published_at,source_name,metadata,link', { count: 'exact' })
      .gte('published_at', window.from)
      .lt('published_at', window.to)
      .in('metadata->>provider', LOWER_PRIORITY_PROVIDERS)
      .order('published_at', { ascending: true })
      .limit(MAX_RELATED_ROWS);
    if (error) return { rows: [], skippedReason: 'lookup_failed' };
    if (count !== null && count > MAX_RELATED_ROWS) return { rows: [], skippedReason: 'window_over_limit' };
    rows.push(...((data ?? []) as IncidentRow[]));
  }
  return { rows, skippedReason: null };
}

function normalizeSyncCursor(value: unknown): string | null {
```

(e) Lines 219-240. Before:

```ts
    const articles = [...articlesByUid.values()];
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    for (let offset = 0; offset < articles.length; offset += DATABASE_BATCH_SIZE) {
      const batch = articles.slice(offset, offset + DATABASE_BATCH_SIZE);
      const uids = batch.map((article) => article.uid);
      const { data: existing, error: readError } = await db.from('news_articles').select('uid').in('uid', uids);
      if (readError) {
        errors.push(`${batch.length} incident lookups failed`);
        continue;
      }
      const existingUids = new Set((existing ?? []).map((article) => article.uid));
      const { error: writeError } = await db.from('news_articles').upsert(batch, { onConflict: 'uid' });
      if (writeError) {
        errors.push(`${batch.length} incident writes failed`);
        continue;
      }
      const updatedInBatch = batch.filter((article) => existingUids.has(article.uid)).length;
      updated += updatedInBatch;
      inserted += batch.length - updatedInBatch;
    }
```

After:

```ts
    const articles = [...articlesByUid.values()];
    // Cross-provider merge, planned for every QuillMonitor row in this sync
    // (not only new ones) because each upsert replaces metadata.sources.
    const duplicateLookup = await loadDuplicateCandidates(db, articles);
    const mergePlan = planCanonicalMerges(articles, duplicateLookup.rows);
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    const writtenUids = new Set<string>();
    for (let offset = 0; offset < articles.length; offset += DATABASE_BATCH_SIZE) {
      const batch = articles.slice(offset, offset + DATABASE_BATCH_SIZE);
      const uids = batch.map((article) => article.uid);
      const { data: existing, error: readError } = await db
        .from('news_articles')
        .select('uid,summary,metadata')
        .in('uid', uids);
      if (readError) {
        errors.push(`${batch.length} incident lookups failed`);
        continue;
      }
      const existingByUid = new Map(
        ((existing ?? []) as (ExistingQuillMonitorRow & { uid: string })[]).map((row) => [row.uid, row]),
      );
      const writes = batch.map((article) => finalizeQuillMonitorArticle(
        article,
        existingByUid.get(article.uid),
        duplicateLookup.skippedReason ? null : mergePlan.sourcesByCanonical[article.uid] ?? [],
      ));
      const { error: writeError } = await db.from('news_articles').upsert(writes, { onConflict: 'uid' });
      if (writeError) {
        errors.push(`${batch.length} incident writes failed`);
        continue;
      }
      for (const uid of uids) writtenUids.add(uid);
      const updatedInBatch = batch.filter((article) => existingByUid.has(article.uid)).length;
      updated += updatedInBatch;
      inserted += batch.length - updatedInBatch;
    }

    // Hide the lower-priority copies only once their QuillMonitor record is
    // stored. A failed mark counts as a persistence error, so the cursor does
    // not advance and the next sync retries it.
    let duplicatesMarked = 0;
    for (const mark of mergePlan.marks) {
      if (!mark.needsWrite || !writtenUids.has(mark.duplicateOfUid)) continue;
      const { error: markError } = await db
        .from('news_articles')
        .update({ metadata: mark.metadata })
        .eq('uid', mark.uid);
      if (markError) errors.push('1 duplicate mark failed');
      else duplicatesMarked++;
    }
```

(f) Line 260. Before:

```ts
    console.log(`[fetch-quillmonitor-incidents] pages=${pagesFetched} found=${recordsFound} normalized=${articles.length} inserted=${inserted} updated=${updated} invalid=${invalidRecords} persistence_errors=${persistenceErrors} healthy=${health.success}`);
```

After:

```ts
    console.log(`[fetch-quillmonitor-incidents] pages=${pagesFetched} found=${recordsFound} normalized=${articles.length} inserted=${inserted} updated=${updated} duplicates_marked=${duplicatesMarked} merge_lookup=${duplicateLookup.skippedReason ?? 'ok'} invalid=${invalidRecords} persistence_errors=${persistenceErrors} healthy=${health.success}`);
```

(g) Lines 276-281. Before:

```ts
        persistence_errors: persistenceErrors,
        taxonomy_version: articles[0]?.metadata.taxonomy_version || null,
        category_counts: categoryCounts,
      },
    });
    if (health.success && inserted + updated > 0) {
```

After:

```ts
        persistence_errors: persistenceErrors,
        duplicates_marked: duplicatesMarked,
        duplicate_candidates: duplicateLookup.rows.length,
        merge_lookup: duplicateLookup.skippedReason ?? 'ok',
        taxonomy_version: articles[0]?.metadata.taxonomy_version || null,
        category_counts: categoryCounts,
      },
    });
    // Newly hidden duplicates also need the poster, so it can edit any post
    // about them to point at the primary incident.
    if (health.success && inserted + updated + duplicatesMarked > 0) {
```

(h) Lines 298-299. Before:

```ts
      incidentsUpdated: updated,
      invalidRecords,
```

After:

```ts
      incidentsUpdated: updated,
      duplicatesMarked,
      invalidRecords,
```

- [ ] **Step 8: Verify**

Run:

```bash
rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts src/utils/__tests__/quillMonitorMerge.test.ts src/utils/__tests__/incidentSeverity.test.ts
for f in supabase/functions/fetch-web3-incidents/index.ts supabase/functions/fetch-quillmonitor-incidents/index.ts supabase/functions/fetch-quillmonitor-incidents/index_test.ts supabase/functions/fetch-slowmist-incidents/index.ts; do bun build "$f" --no-bundle > /dev/null && echo "ok $f"; done
npx tsc --noEmit -p tsconfig.app.json
npx eslint supabase/functions/_shared/incident-dedup.ts supabase/functions/_shared/quillmonitor.ts supabase/functions/fetch-quillmonitor-incidents/index.ts src/utils/__tests__/incidentDedup.test.ts src/utils/__tests__/quillMonitorMerge.test.ts
grep -n "extractProjectName\|seenProjects\|limit(50)" supabase/functions/fetch-web3-incidents/index.ts
```

Expected: all tests pass (29 + 7), four `ok` lines, no type errors, no lint errors. `fetch-web3-incidents/index.ts` is not in the eslint list because it has pre-existing `no-explicit-any` warnings; warnings are not errors. The grep prints nothing.

- [ ] **Step 9: Commit**

```bash
git add supabase/functions/_shared/incident-dedup.ts supabase/functions/_shared/quillmonitor.ts supabase/functions/fetch-web3-incidents/index.ts supabase/functions/fetch-quillmonitor-incidents/index.ts src/utils/__tests__/incidentDedup.test.ts src/utils/__tests__/quillMonitorMerge.test.ts
git commit -m "feat(ingestion): dedupe web3 incidents at ingestion and merge sources into QuillMonitor records"
```

---

### Task A7: One-time duplicate backfill (`dedupe-incidents`)

**Files:**
- Modify: `supabase/functions/_shared/incident-dedup.ts` (append)
- Create: `supabase/functions/dedupe-incidents/index.ts`
- Modify: `supabase/config.toml` (append after the last block, `[functions.post-telegram-alerts]`)
- Test: `src/utils/__tests__/incidentDedup.test.ts` (extend)

**Interfaces:**
- Consumes: A1 and A5/A6 helpers.
- Produces:
  - `export function groupDuplicates(rows: IncidentRow[]): { canonical: string; duplicates: string[] }[]`. Candidates are sorted by provider priority, then uid. Each candidate joins the first group whose canonical row it matches directly; otherwise it starts a new group. Matches do not chain. Rows hidden for other reasons (`classification_relevant=false` without `duplicate_of_uid`) are excluded. Two QuillMonitor rows are never grouped. Output is sorted and deterministic.
  - `export const MAX_BACKFILL_SAMPLES = 50`
  - `export interface DuplicateBackfillPlan { groups: { canonical: string; duplicates: string[] }[]; marks: DuplicateMark[]; canonicalUpdates: { uid: string; metadata: Record<string, unknown> }[]; samples: { canonical: { uid: string; title: string }; duplicate: { uid: string; title: string } }[] }`
  - `export function planDuplicateBackfill(rows: IncidentRow[]): DuplicateBackfillPlan`
  - HTTP `POST /functions/v1/dedupe-incidents`. Body `{ dryRun?: boolean = true, days?: 1..180 = 90 }`; unknown keys are rejected (400). Auth is the same as `fetch-quillmonitor-incidents`: timing-safe `CRON_SECRET`, the service key, or an admin JWT. The response is JSON: `{ success, dryRun, days, rowsScanned, groups, duplicatesFound, duplicatesToMark, canonicalSourceUpdates, duplicatesMarked, canonicalSourcesUpdated, writeErrors, samples }` (at most 50 samples).
- Writes no `threat_intel_ingestion_runs` row: the pipeline CHECK constraint does not allow a backfill pipeline, and this task does not widen it.

Rows loaded: `published_at >= now - (days + 2) days` and the same Web3 `.or(...)` filter, paged 1,000 at a time and ordered by `published_at`, then `uid`. The run stops with an error above 10,000 rows rather than grouping a partial set. With `dryRun=false`, it writes the pending marks first, then the canonical `sources` updates, one `update ... eq('uid')` each.

- [ ] **Step 1: Write the failing tests**

(a) In `src/utils/__tests__/incidentDedup.test.ts`, extend the import list. Before:

```ts
import {
  candidateFromRow,
  incidentDateWindows,
  incidentSourcesFromRow,
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  matchExistingIncident,
  normalizeIncidentTarget,
  pickCanonical,
  planCanonicalMerges,
  providerPriority,
  rowProvider,
  type IncidentRow,
} from '../../../supabase/functions/_shared/incident-dedup';
```

After:

```ts
import {
  candidateFromRow,
  groupDuplicates,
  incidentDateWindows,
  incidentSourcesFromRow,
  incidentTargetFromTitle,
  isHighConfidenceDuplicate,
  matchExistingIncident,
  MAX_BACKFILL_SAMPLES,
  normalizeIncidentTarget,
  pickCanonical,
  planCanonicalMerges,
  planDuplicateBackfill,
  providerPriority,
  rowProvider,
  type IncidentRow,
} from '../../../supabase/functions/_shared/incident-dedup';
```

(b) Append to the end of the file:

```ts
describe('groupDuplicates', () => {
  it('groups NEAR Intents and Meter under their QuillMonitor records', () => {
    expect(groupDuplicates([nearWeb3Feed2, meterWeb3, nearWeb3Feed1, nearQuillMonitor, meterQuillMonitor])).toEqual([
      { canonical: 'quillmonitor:meter-1', duplicates: ['meter-feed1'] },
      { canonical: 'quillmonitor:near-intents-1', duplicates: ['a1b2c3-feed1-near', 'd4e5f6-feed2-near'] },
    ]);
  });

  it('leaves Limit Break and Magic Eden as separate incidents', () => {
    expect(groupDuplicates([limitBreak, magicEden])).toEqual([]);
  });

  it('is stable for rows that are already marked', () => {
    const marked = {
      ...nearWeb3Feed1,
      metadata: { ...(nearWeb3Feed1.metadata as object), classification_relevant: false, duplicate_of_uid: 'quillmonitor:near-intents-1' },
    };
    expect(groupDuplicates([nearQuillMonitor, marked])).toEqual([
      { canonical: 'quillmonitor:near-intents-1', duplicates: ['a1b2c3-feed1-near'] },
    ]);
  });

  it('ignores rows hidden for other reasons and never merges two QuillMonitor rows', () => {
    const hidden = { ...meterWeb3, metadata: { ...(meterWeb3.metadata as object), classification_relevant: false } };
    expect(groupDuplicates([meterQuillMonitor, hidden])).toEqual([]);
    const secondQuill = { ...meterQuillMonitor, uid: 'quillmonitor:meter-2' };
    expect(groupDuplicates([meterQuillMonitor, secondQuill])).toEqual([]);
  });

  it('does not chain matches: each duplicate must match the canonical row itself', () => {
    const day0 = { ...meterWeb3, uid: 'w-0', metadata: { provider: 'web3-incidents', incident_date: '2026-09-10', attack_type: 'exploit' } };
    const day2 = { ...meterWeb3, uid: 'w-2', metadata: { provider: 'web3-incidents', incident_date: '2026-09-12', attack_type: 'exploit' } };
    const day4 = { ...meterWeb3, uid: 'w-4', metadata: { provider: 'web3-incidents', incident_date: '2026-09-14', attack_type: 'exploit' } };
    expect(groupDuplicates([day0, day2, day4])).toEqual([{ canonical: 'w-0', duplicates: ['w-2'] }]);
  });
});

describe('planDuplicateBackfill', () => {
  it('marks duplicates and adds their sources to the canonical row', () => {
    const plan = planDuplicateBackfill([nearQuillMonitor, nearWeb3Feed1, nearWeb3Feed2, limitBreak, magicEden]);
    expect(plan.groups).toEqual([
      { canonical: 'quillmonitor:near-intents-1', duplicates: ['a1b2c3-feed1-near', 'd4e5f6-feed2-near'] },
    ]);
    expect(plan.marks.map((mark) => [mark.uid, mark.duplicateOfUid, mark.needsWrite])).toEqual([
      ['a1b2c3-feed1-near', 'quillmonitor:near-intents-1', true],
      ['d4e5f6-feed2-near', 'quillmonitor:near-intents-1', true],
    ]);
    expect(plan.canonicalUpdates).toHaveLength(1);
    expect(plan.canonicalUpdates[0].uid).toBe('quillmonitor:near-intents-1');
    expect(plan.canonicalUpdates[0].metadata).toMatchObject({ provider: 'quillmonitor', verification_status: 'verified' });
    expect(plan.canonicalUpdates[0].metadata.sources).toEqual([
      { provider: 'quillmonitor', url: 'https://x.com/near/status/1', label: 'QuillMonitor', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: 'https://x.com/zachxbt/status/2', label: 'Web3 incident tracker', amount_usd: 3_800_000 },
      { provider: 'web3-incidents', url: null, label: 'Web3 incident tracker', amount_usd: null },
    ]);
    expect(plan.samples).toEqual([
      {
        canonical: { uid: 'quillmonitor:near-intents-1', title: 'NEAR Intents: Private Key Compromise ($3.8M loss)' },
        duplicate: { uid: 'a1b2c3-feed1-near', title: 'NEAR Intents exploited for $3.8 million' },
      },
      {
        canonical: { uid: 'quillmonitor:near-intents-1', title: 'NEAR Intents: Private Key Compromise ($3.8M loss)' },
        duplicate: { uid: 'd4e5f6-feed2-near', title: 'NEAR Intents - Private Key Compromise ($3.8M)' },
      },
    ]);
  });

  it('plans no writes on a second run over already-merged rows', () => {
    const first = planDuplicateBackfill([meterQuillMonitor, meterWeb3]);
    const canonical = { ...meterQuillMonitor, metadata: first.canonicalUpdates[0].metadata };
    const duplicate = { ...meterWeb3, metadata: first.marks[0].metadata };
    const second = planDuplicateBackfill([canonical, duplicate]);
    expect(second.marks.every((mark) => !mark.needsWrite)).toBe(true);
    expect(second.canonicalUpdates).toEqual([]);
  });

  it(`caps samples at ${MAX_BACKFILL_SAMPLES}`, () => {
    const rows: IncidentRow[] = [];
    for (let index = 0; index < 60; index++) {
      const target = `Project ${index}`;
      rows.push({ ...meterQuillMonitor, uid: `quillmonitor:p${index}`, metadata: { provider: 'quillmonitor', project_name: target, incident_date: '2026-09-14' } });
      rows.push({ ...meterWeb3, uid: `w${index}`, metadata: { provider: 'web3-incidents', project_name: target, incident_date: '2026-09-14' } });
    }
    const plan = planDuplicateBackfill(rows);
    expect(plan.marks).toHaveLength(60);
    expect(plan.samples).toHaveLength(MAX_BACKFILL_SAMPLES);
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts`
Expected: FAIL with 8 failures such as `TypeError: groupDuplicates is not a function`.

- [ ] **Step 3: Implement grouping and the backfill planner**

Append to the end of `supabase/functions/_shared/incident-dedup.ts`:

```ts
/**
 * Groups rows into incidents. Each duplicate matches its canonical row
 * directly; there is no chaining (A~B and B~C does not pull in C unless C~A),
 * so repeated incidents at one project a few days apart stay separate.
 * Two QuillMonitor rows are never merged: QuillMonitor rewrites its metadata
 * on every sync, so a mark on its own row would not stick.
 */
export function groupDuplicates(rows: IncidentRow[]): { canonical: string; duplicates: string[] }[] {
  const candidates = rows
    .filter((row) => !isHiddenForOtherReasons(row))
    .map(candidateFromRow)
    .filter((candidate): candidate is DuplicateCandidate => candidate !== null)
    .sort((a, b) =>
      providerPriority(a.provider) - providerPriority(b.provider) || a.uid.localeCompare(b.uid));

  const groups: { canonical: DuplicateCandidate; duplicates: string[] }[] = [];
  for (const candidate of candidates) {
    // Sorted by priority then uid, so the first match is also what
    // pickCanonical would choose among the matching groups.
    const group = groups.find((existing) =>
      !(existing.canonical.provider === 'quillmonitor' && candidate.provider === 'quillmonitor') &&
      isHighConfidenceDuplicate(existing.canonical, candidate));
    if (group) group.duplicates.push(candidate.uid);
    else groups.push({ canonical: candidate, duplicates: [] });
  }

  return groups
    .filter((group) => group.duplicates.length > 0)
    .map((group) => ({ canonical: group.canonical.uid, duplicates: [...group.duplicates].sort() }))
    .sort((a, b) => a.canonical.localeCompare(b.canonical));
}

export const MAX_BACKFILL_SAMPLES = 50;

export interface DuplicateBackfillPlan {
  groups: { canonical: string; duplicates: string[] }[];
  marks: DuplicateMark[];
  // Canonical rows whose metadata.sources gain entries from their duplicates.
  canonicalUpdates: { uid: string; metadata: Record<string, unknown> }[];
  samples: { canonical: { uid: string; title: string }; duplicate: { uid: string; title: string } }[];
}

/**
 * Everything the dedupe-incidents backfill would write, computed without
 * touching the database so a dry run can show it for review first.
 */
export function planDuplicateBackfill(rows: IncidentRow[]): DuplicateBackfillPlan {
  const byUid = new Map(rows.map((row) => [row.uid, row]));
  const groups = groupDuplicates(rows);
  const marks: DuplicateMark[] = [];
  const canonicalUpdates: DuplicateBackfillPlan['canonicalUpdates'] = [];
  const samples: DuplicateBackfillPlan['samples'] = [];

  for (const group of groups) {
    const canonical = byUid.get(group.canonical);
    if (!canonical) continue;
    // Start from the canonical row's own source so it stays first.
    let sources = incidentSourcesFromRow(canonical);
    for (const uid of group.duplicates) {
      const row = byUid.get(uid);
      if (!row) continue;
      const metadata = metadataRecord(row.metadata);
      marks.push({
        uid,
        duplicateOfUid: canonical.uid,
        metadata: duplicateMetadata(row.metadata, canonical.uid),
        needsWrite: metadata.classification_relevant !== false || metadata.duplicate_of_uid !== canonical.uid,
      });
      sources = mergeIncidentSources(sources, incidentSourcesFromRow(row));
      if (samples.length < MAX_BACKFILL_SAMPLES) {
        samples.push({
          canonical: { uid: canonical.uid, title: canonical.title },
          duplicate: { uid: row.uid, title: row.title },
        });
      }
    }
    const storedSources = readIncidentFields(canonical.metadata).sources;
    if (JSON.stringify(sources) !== JSON.stringify(storedSources)) {
      canonicalUpdates.push({ uid: canonical.uid, metadata: { ...metadataRecord(canonical.metadata), sources } });
    }
  }

  return { groups, marks, canonicalUpdates, samples };
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts`
Expected: `Tests  32 passed (32)`.

- [ ] **Step 5: Create the edge function**

Create `supabase/functions/dedupe-incidents/index.ts`:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { z } from 'npm:zod@3.23.8';
import { planDuplicateBackfill, type IncidentRow } from '../_shared/incident-dedup.ts';

// One-time (and repeatable) backfill that marks existing cross-provider
// duplicates. Defaults to a dry run so the matches can be reviewed first.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const RequestSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  days: z.number().int().min(1).max(180).optional().default(90),
}).strict();
const WEB3_INCIDENT_FILTER = 'metadata->>is_web3_incident.eq.true,metadata->>provider.in.(quillmonitor,web3-incidents,web3,slowmist)';
const PAGE_SIZE = 1_000;
// 180 days of every Web3 provider is well under this; hitting it means the
// filter is wrong, so the run stops instead of grouping a partial set.
const MAX_ROWS = 10_000;

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index++) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

async function authorize(req: Request, url: string, anonKey: string, serviceKey: string): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return false;

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && await timingSafeEqual(token, cronSecret)) return true;
  if (await timingSafeEqual(token, serviceKey)) return true;

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return false;
  const admin = createClient(url, serviceKey);
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  return Boolean(role);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration is incomplete' }), { status: 500, headers: jsonHeaders });
  }
  if (!await authorize(req, url, anonKey, serviceKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  const rawBody: unknown = await req.json().catch(() => ({}));
  const request = RequestSchema.safeParse(rawBody);
  if (!request.success) {
    return new Response(JSON.stringify({ error: request.error.flatten().fieldErrors }), { status: 400, headers: jsonHeaders });
  }
  const { dryRun, days } = request.data;

  try {
    const db = createClient(url, serviceKey);
    // Two extra days so an incident at the window edge still meets its match.
    const since = new Date(Date.now() - (days + 2) * 86_400_000).toISOString();
    const rows: IncidentRow[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await db
        .from('news_articles')
        .select('uid,title,published_at,source_name,metadata,link')
        .gte('published_at', since)
        .or(WEB3_INCIDENT_FILTER)
        .order('published_at', { ascending: true })
        .order('uid', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error('Incident rows could not be read');
      rows.push(...((data ?? []) as IncidentRow[]));
      if (rows.length > MAX_ROWS) throw new Error(`Incident window exceeded the ${MAX_ROWS}-row safety limit`);
      if (!data || data.length < PAGE_SIZE) break;
    }

    const plan = planDuplicateBackfill(rows);
    const pendingMarks = plan.marks.filter((mark) => mark.needsWrite);
    let duplicatesMarked = 0;
    let canonicalSourcesUpdated = 0;
    let writeErrors = 0;

    if (!dryRun) {
      for (const mark of pendingMarks) {
        const { error } = await db.from('news_articles').update({ metadata: mark.metadata }).eq('uid', mark.uid);
        if (error) writeErrors++;
        else duplicatesMarked++;
      }
      for (const update of plan.canonicalUpdates) {
        const { error } = await db.from('news_articles').update({ metadata: update.metadata }).eq('uid', update.uid);
        if (error) writeErrors++;
        else canonicalSourcesUpdated++;
      }
    }

    console.log(`[dedupe-incidents] dry_run=${dryRun} days=${days} rows=${rows.length} groups=${plan.groups.length} duplicates=${plan.marks.length} pending=${pendingMarks.length} marked=${duplicatesMarked} canonical_updates=${canonicalSourcesUpdated} write_errors=${writeErrors}`);
    return new Response(JSON.stringify({
      success: writeErrors === 0,
      dryRun,
      days,
      rowsScanned: rows.length,
      groups: plan.groups.length,
      duplicatesFound: plan.marks.length,
      duplicatesToMark: pendingMarks.length,
      canonicalSourceUpdates: plan.canonicalUpdates.length,
      duplicatesMarked,
      canonicalSourcesUpdated,
      writeErrors,
      samples: plan.samples,
    }), { status: writeErrors === 0 ? 200 : 207, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith('Incident')
      ? error.message
      : 'Duplicate backfill failed';
    console.error(`[dedupe-incidents] ${message}`);
    return new Response(JSON.stringify({ success: false, error: message }), { status: 500, headers: jsonHeaders });
  }
});
```

- [ ] **Step 6: Register it in `supabase/config.toml`**

The file currently ends with the `[functions.post-telegram-alerts]` block. Append a blank line and the new block, so the file ends with:

```toml
[functions.post-telegram-alerts]
verify_jwt = false

[functions.dedupe-incidents]
verify_jwt = false
```

- [ ] **Step 7: Verify**

Run:

```bash
rtk proxy npx vitest run src/utils/__tests__/incidentDedup.test.ts
bun build supabase/functions/dedupe-incidents/index.ts --no-bundle > /dev/null && echo ok
npx tsc --noEmit -p tsconfig.app.json
npx eslint supabase/functions/_shared/incident-dedup.ts supabase/functions/dedupe-incidents/index.ts src/utils/__tests__/incidentDedup.test.ts
tail -2 supabase/config.toml
```

Expected: 32 tests pass, `ok`, no type or lint errors, and the last two lines are `[functions.dedupe-incidents]` and `verify_jwt = false`.

After deploy (Lovable release step, not local), run the dry run and review the samples before any write:

```bash
curl -sS -X POST "$SUPABASE_URL/functions/v1/dedupe-incidents" \
  -H "Authorization: Bearer $CRON_SECRET" -H 'Content-Type: application/json' \
  -d '{"dryRun":true,"days":90}'
```

Check that the samples include NEAR Intents and Meter, do not pair Limit Break with Magic Eden, and contain no wrong pairs. Only then send `{"dryRun":false,"days":90}`. A second `dryRun:true` call afterwards should report `duplicatesToMark: 0` and `canonicalSourceUpdates: 0`.

- [ ] **Step 8: Commit**

```bash
git add supabase/functions/_shared/incident-dedup.ts supabase/functions/dedupe-incidents/index.ts supabase/config.toml src/utils/__tests__/incidentDedup.test.ts
git commit -m "feat(ingestion): add dedupe-incidents backfill with dry-run review"
```

---

### Task A8: Summary provenance and pending incident summaries

**Files:**
- Create: `supabase/functions/_shared/summary-text.ts`
- Modify: `supabase/functions/summarize-article/index.ts` (lines 2, 9-17, 29-31, 142-145, 153-162, 191-195). Commit `8371d84` (Lovable) changed the error handling at lines 210-222 and 236-241. Those lines are not touched, and the edits below are anchored on the current file, which already contains that change.
- Modify: `supabase/functions/fetch-rss-news/index.ts` (lines 10-14, 420, 432-434)
- Modify: `supabase/functions/fetch-web3-incidents/index.ts` (imports; the summary truncation, originally line 333)
- Modify: `supabase/functions/_shared/quillmonitor.ts` (imports; `finalizeQuillMonitorArticle` from A6)
- Test: `src/utils/__tests__/summaryText.test.ts` (create), `src/utils/__tests__/quillMonitorMerge.test.ts` (extend)

**Interfaces:**
- Consumes: `SummaryOrigin` (A1), `finalizeQuillMonitorArticle` (A6).
- Produces (in `summary-text.ts`):
  - `export function truncateAtWord(text: string, maxLength: number): string`
  - `export function isPendingSummary(summary: unknown): boolean`
  - `export function withSummaryOrigin(metadata: unknown, origin: SummaryOrigin): Record<string, unknown>`
- Behavior:
  - `summarize-article` merges `summary_origin: 'ai'` into the existing metadata whenever it writes an AI summary.
  - Each run of `summarize-article` also takes up to 5 Web3 incident rows with `is_processed=true`, `created_at` in the last 14 days, and a summary that is null, empty or exactly `Summary pending`. These are in addition to the existing `limit`, so the RSS backlog cannot starve them. No `articleId` is given for this path.
  - RSS rows get `summary_origin: 'publisher'` and a word-boundary excerpt ending in "…". `fetch-web3-incidents` excerpts use the same helper.
  - QuillMonitor syncs keep an AI summary while the provider still has no description. Without this, every QuillMonitor update would reset it to "Summary pending".

- [ ] **Step 1: Write the failing tests**

(a) Create `src/utils/__tests__/summaryText.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  isPendingSummary,
  truncateAtWord,
  withSummaryOrigin,
} from '../../../supabase/functions/_shared/summary-text';

describe('truncateAtWord', () => {
  it('returns text within the limit unchanged', () => {
    expect(truncateAtWord('Short excerpt.', 500)).toBe('Short excerpt.');
    expect(truncateAtWord('x'.repeat(500), 500)).toBe('x'.repeat(500));
  });

  it('cuts at the last word boundary and adds an ellipsis', () => {
    expect(truncateAtWord('The quick brown fox jumps', 12)).toBe('The quick…');
    expect(truncateAtWord('The quick brown fox jumps', 16)).toBe('The quick brown…');
  });

  it('never cuts mid-word and never exceeds the limit', () => {
    const text = 'Attackers drained the bridge after compromising a multisig signer key. '.repeat(20);
    const result = truncateAtWord(text, 500);
    expect(result.length).toBeLessThanOrEqual(500);
    expect(result.endsWith('…')).toBe(true);
    const head = result.slice(0, -1);
    expect(text.startsWith(head)).toBe(true);
    // The character after the kept text ends a word.
    expect(text[head.length]).toMatch(/[\s.,;:]/);
  });

  it('drops trailing punctuation before the ellipsis', () => {
    expect(truncateAtWord('Funds were stolen, and the team paused deposits', 20)).toBe('Funds were stolen…');
  });

  it('hard-cuts a single long token instead of returning almost nothing', () => {
    const result = truncateAtWord(`See https://example.com/${'a'.repeat(80)}`, 40);
    expect(result).toHaveLength(40);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('isPendingSummary', () => {
  it('treats empty, missing and placeholder summaries as pending', () => {
    expect(isPendingSummary(null)).toBe(true);
    expect(isPendingSummary('')).toBe(true);
    expect(isPendingSummary('   ')).toBe(true);
    expect(isPendingSummary('Summary pending')).toBe(true);
    expect(isPendingSummary('An attacker drained $3.8M.')).toBe(false);
  });
});

describe('withSummaryOrigin', () => {
  it('merges summary_origin into existing metadata', () => {
    expect(withSummaryOrigin({ provider: 'quillmonitor', summary_origin: 'provider' }, 'ai'))
      .toEqual({ provider: 'quillmonitor', summary_origin: 'ai' });
    expect(withSummaryOrigin(null, 'publisher')).toEqual({ summary_origin: 'publisher' });
  });
});
```

(b) Append to the end of `src/utils/__tests__/quillMonitorMerge.test.ts`:

```ts
describe('finalizeQuillMonitorArticle keeps AI summaries', () => {
  const pendingArticle = normalizeQuillMonitorIncident({ ...incident, description: '' });
  const aiSummary = 'NEAR Intents lost about $3.8M after a private key compromise. Users should revoke approvals.';

  it('keeps an AI summary while the provider has no description', () => {
    const existing = { summary: aiSummary, metadata: { summary_origin: 'ai' } };
    const finalized = finalizeQuillMonitorArticle(pendingArticle, existing, []);
    expect(finalized.summary).toBe(aiSummary);
    expect(finalized.metadata.summary_origin).toBe('ai');
  });

  it('lets a provider description replace the AI summary', () => {
    const withDescription = normalizeQuillMonitorIncident(incident);
    const existing = { summary: aiSummary, metadata: { summary_origin: 'ai' } };
    const finalized = finalizeQuillMonitorArticle(withDescription, existing, []);
    expect(finalized.summary).toBe(incident.description);
    expect(finalized.metadata.summary_origin).toBe('provider');
  });

  it('does not keep a placeholder or a non-AI summary', () => {
    expect(finalizeQuillMonitorArticle(pendingArticle, { summary: 'Summary pending', metadata: { summary_origin: 'ai' } }, []).summary)
      .toBe('Summary pending');
    expect(finalizeQuillMonitorArticle(pendingArticle, { summary: aiSummary, metadata: { summary_origin: 'provider' } }, []).summary)
      .toBe('Summary pending');
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `rtk proxy npx vitest run src/utils/__tests__/summaryText.test.ts src/utils/__tests__/quillMonitorMerge.test.ts`
Expected: `summaryText.test.ts` fails with `Error: Cannot find module '../../../supabase/functions/_shared/summary-text'`. `quillMonitorMerge.test.ts` has 1 failure: `expected 'Summary pending' to be 'NEAR Intents lost about $3.8M after a…'`.

- [ ] **Step 3: Implement the helper module**

Create `supabase/functions/_shared/summary-text.ts`:

```ts
// Summary helpers shared by the importers and summarize-article. Pure module:
// no Deno or URL imports, so vitest can import it.
import type { SummaryOrigin } from './incident-fields.ts';

const TRAILING_PUNCTUATION = /[\s,;:.\-–—]+$/u;

/**
 * Shortens publisher text to at most maxLength characters, cutting at the last
 * word boundary and ending with "…". A single very long word (a URL, a hash)
 * is cut hard rather than dropping most of the text.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const room = Math.max(0, maxLength - 1); // one character for the ellipsis
  const window = text.slice(0, room + 1);
  const boundary = window.search(/\s\S*$/);
  const head = boundary > room * 0.6 ? window.slice(0, boundary) : text.slice(0, room);
  return `${head.replace(TRAILING_PUNCTUATION, '')}…`;
}

// QuillMonitor stores "Summary pending" when the provider has no description.
export function isPendingSummary(summary: unknown): boolean {
  if (typeof summary !== 'string') return true;
  const trimmed = summary.trim();
  return trimmed === '' || trimmed.toLowerCase() === 'summary pending';
}

// Merges, never replaces: metadata holds provider fields other code relies on.
export function withSummaryOrigin(metadata: unknown, origin: SummaryOrigin): Record<string, unknown> {
  const existing = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
  return { ...existing, summary_origin: origin };
}
```

- [ ] **Step 4: Keep AI summaries across QuillMonitor syncs**

In `supabase/functions/_shared/quillmonitor.ts`, after the A6 import. Before:

```ts
import { mergeIncidentSources, readIncidentFields, type IncidentSource } from './incident-fields.ts';
```

After:

```ts
import { mergeIncidentSources, readIncidentFields, type IncidentSource } from './incident-fields.ts';
import { isPendingSummary } from './summary-text.ts';
```

In `finalizeQuillMonitorArticle` (added in A6). Before:

```ts
  const ownSources = readIncidentFields(article.metadata).sources;
  const carriedSources = duplicateSources ??
    readIncidentFields(existing?.metadata).sources.filter((source) => source.provider !== 'quillmonitor');
  return {
    ...article,
    metadata: { ...article.metadata, sources: mergeIncidentSources(ownSources, carriedSources) },
  };
}
```

After:

```ts
  const ownSources = readIncidentFields(article.metadata).sources;
  const existingFields = readIncidentFields(existing?.metadata);
  const carriedSources = duplicateSources ??
    existingFields.sources.filter((source) => source.provider !== 'quillmonitor');
  // While QuillMonitor has no description, keep the summary summarize-article
  // wrote; otherwise every sync of the record would reset it to "Summary pending".
  const keepAiSummary = article.metadata.summary_status === 'pending' &&
    existingFields.summaryOrigin === 'ai' &&
    !isPendingSummary(existing?.summary);
  return {
    ...article,
    ...(keepAiSummary ? { summary: String(existing?.summary) } : {}),
    metadata: {
      ...article.metadata,
      sources: mergeIncidentSources(ownSources, carriedSources),
      ...(keepAiSummary ? { summary_origin: 'ai' } : {}),
    },
  };
}
```

`fetch-quillmonitor-incidents` already selects `uid,summary,metadata` for existing rows (A6, step 7e), so no change is needed there.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/summaryText.test.ts src/utils/__tests__/quillMonitorMerge.test.ts`
Expected: `Test Files  2 passed (2)`, `Tests  15 passed (15)`.

- [ ] **Step 6: Update `summarize-article`**

In `supabase/functions/summarize-article/index.ts`:

(a) Line 2. Before:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
```

After:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { withSummaryOrigin } from '../_shared/summary-text.ts';
```

(b) Lines 9-17. Before:

```ts
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface ArticleToSummarize {
  id: string;
  title: string;
  content: string;
  raw_content?: string;
}
```

After:

```ts
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
// Web3 incident records are stored with is_processed=true, so the main queue
// never sees them. Each run also takes a few recent ones that still have no
// summary; the window keeps a stuck record from being retried forever.
const PENDING_INCIDENT_BATCH = 5;
const PENDING_INCIDENT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

interface ArticleToSummarize {
  id: string;
  title: string;
  content: string;
  raw_content?: string;
  summary?: string | null;
  metadata?: unknown;
}
```

(c) Lines 29-31, inside `summarizeArticle`. Before:

```ts
    .replace(/&quot;/g, '"')
    .trim()
    .substring(0, 3000); // Limit content length
```

After:

```ts
    .replace(/&quot;/g, '"')
    // QuillMonitor's placeholder is not article text.
    .replace(/\bSummary pending\b/g, '')
    .trim()
    .substring(0, 3000); // Limit content length
```

(d) Lines 142-145. Before:

```ts
    let query = supabase
      .from('news_articles')
      .select('id, title, content, raw_content, summary')
      .eq('is_processed', false);
```

After:

```ts
    let query = supabase
      .from('news_articles')
      .select('id, title, content, raw_content, summary, metadata')
      .eq('is_processed', false);
```

(e) Lines 153-162. The rest of the loop keeps using `articles`, which is now the combined queue. Before:

```ts
    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      console.error('[summarize-article] Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`[summarize-article] Found ${articles?.length || 0} articles to summarize`);

    if (!articles || articles.length === 0) {
```

After:

```ts
    const { data: queued, error: fetchError } = await query;

    if (fetchError) {
      console.error('[summarize-article] Fetch error:', fetchError);
      throw fetchError;
    }

    let pendingIncidents: ArticleToSummarize[] = [];
    if (!articleId) {
      const { data: pending, error: pendingError } = await supabase
        .from('news_articles')
        .select('id, title, content, raw_content, summary, metadata')
        .eq('is_processed', true)
        .eq('metadata->>is_web3_incident', 'true')
        .or('summary.is.null,summary.eq."",summary.eq."Summary pending"')
        .gte('created_at', new Date(Date.now() - PENDING_INCIDENT_WINDOW_MS).toISOString())
        .order('created_at', { ascending: false })
        .limit(PENDING_INCIDENT_BATCH);
      // A failure here must not block the main queue.
      if (pendingError) console.error('[summarize-article] Pending incident lookup failed:', pendingError.message);
      else pendingIncidents = pending ?? [];
    }
    const articles = [...(queued ?? []), ...pendingIncidents];

    console.log(`[summarize-article] Found ${articles.length} articles to summarize (${pendingIncidents.length} pending incidents)`);

    if (articles.length === 0) {
```

(f) Lines 191-195, inside the per-article update. Before:

```ts
          .update({ 
            summary,
            is_processed: true,
            updated_at: new Date().toISOString()
          })
```

After:

```ts
          .update({ 
            summary,
            is_processed: true,
            updated_at: new Date().toISOString(),
            // Lets the UI show "AI Summary" only for text we generated.
            metadata: withSummaryOrigin(article.metadata, 'ai'),
          })
```

The "already has a good summary" branch (lines 175-182) only sets `is_processed`, so publisher excerpts longer than 50 characters keep `summary_origin: 'publisher'`.

- [ ] **Step 7: Mark RSS excerpts as publisher text**

In `supabase/functions/fetch-rss-news/index.ts`:

(a) Line 14. Before:

```ts
} from './reclassification.ts';
```

After:

```ts
} from './reclassification.ts';
import { truncateAtWord } from '../_shared/summary-text.ts';
```

(b) Line 420. Before:

```ts
            summary: cleanDesc.substring(0, 500),
```

After:

```ts
            summary: truncateAtWord(cleanDesc, 500),
```

(c) Lines 432-434. Before:

```ts
            metadata: {
              provider: 'rss',
              feed_id: feed.id,
```

After:

```ts
            metadata: {
              provider: 'rss',
              feed_id: feed.id,
              summary_origin: 'publisher',
```

- [ ] **Step 8: Use the same truncation for web3-incidents excerpts**

In `supabase/functions/fetch-web3-incidents/index.ts`:

(a) Imports (the line A6 added). Before:

```ts
import { matchExistingIncident, shiftDate, type IncidentRow } from '../_shared/incident-dedup.ts';
```

After:

```ts
import { matchExistingIncident, shiftDate, type IncidentRow } from '../_shared/incident-dedup.ts';
import { truncateAtWord } from '../_shared/summary-text.ts';
```

(b) In `parsePrimaryIncidents`, originally line 333. Before:

```ts
      if (summary.length > 500) summary = summary.substring(0, 497) + '...';
```

After:

```ts
      summary = truncateAtWord(summary, 500);
```

- [ ] **Step 9: Verify**

Run:

```bash
rtk proxy npx vitest run
for f in supabase/functions/summarize-article/index.ts supabase/functions/fetch-rss-news/index.ts supabase/functions/fetch-rss-news/index_test.ts supabase/functions/fetch-web3-incidents/index.ts supabase/functions/fetch-quillmonitor-incidents/index.ts; do bun build "$f" --no-bundle > /dev/null && echo "ok $f"; done
npx tsc --noEmit -p tsconfig.app.json
npx eslint supabase/functions/_shared/summary-text.ts supabase/functions/_shared/quillmonitor.ts supabase/functions/summarize-article/index.ts src/utils/__tests__/summaryText.test.ts src/utils/__tests__/quillMonitorMerge.test.ts
grep -n "substring(0, 500)\|substring(0, 497)" supabase/functions/fetch-rss-news/index.ts supabase/functions/fetch-web3-incidents/index.ts
```

Expected: the full suite passes (27 files, 198 tests on the scratch run), five `ok` lines, no type errors, no lint errors, and the grep prints nothing.

After deploy, call `summarize-article` with the cron secret and `{"limit":1}`. The function log should show `Found N articles to summarize (M pending incidents)`. That line confirms the `.or('summary.is.null,summary.eq."",summary.eq."Summary pending"')` filter parses on the live PostgREST version.

- [ ] **Step 10: Commit**

```bash
git add supabase/functions/_shared/summary-text.ts supabase/functions/_shared/quillmonitor.ts supabase/functions/summarize-article/index.ts supabase/functions/fetch-rss-news/index.ts supabase/functions/fetch-web3-incidents/index.ts src/utils/__tests__/summaryText.test.ts src/utils/__tests__/quillMonitorMerge.test.ts
git commit -m "feat(threat-intel): record summary provenance and summarize pending incidents"
```

---

### Notes for the plan author

**Numbering.** The brief said "A1..A7" but listed eight tasks. A8 (provenance) is a separate task here.

**Interface changes and additions (with reasons)**

- `IncidentRow` gained an optional `link?: string | null`. Legacy `web3-incidents` rows have no `metadata.reference_url`, so their `link` column is the only deep link to carry into the canonical record's `sources`. The change is additive, so nothing breaks.
- The metadata key is `summary_origin`, not the spec's `summary_source` (spec 5.3 and 12.1). QuillMonitor, SlowMist, `src/types/news.ts:51` and `NewsCard.tsx:28-29` already use `summary_origin`. The spec's contract list should be updated. `readIncidentFields` maps SlowMist's `'provider-template'` to `'provider'`, because the UI treats it as provider text.
- Extra exports beyond the brief: `MAX_INCIDENT_SOURCES`, `safeHttpUrl`, `isCalendarDate` (`incident-fields.ts`); `incidentSourcesFromRow`, `DuplicateMark`, `CanonicalMergePlan`, `duplicateMetadata`, `planCanonicalMerges`, `matchExistingIncident`, `shiftDate`, `incidentDateWindows`, `MAX_BACKFILL_SAMPLES`, `DuplicateBackfillPlan`, `planDuplicateBackfill` (`incident-dedup.ts`); `ExtractedLink`, `extractSources`, `web3IncidentSources` (`parsing.ts`); `ExistingQuillMonitorRow`, `finalizeQuillMonitorArticle` (`quillmonitor.ts`); and the new module `summary-text.ts`. Each one moves a decision out of a Deno-only file so vitest can cover it.
- `severityFromLoss` normalizes punctuation, as SlowMist did. For SlowMist nothing changes. For QuillMonitor, attack strings with punctuation between words ("Private-Key Compromise", "flash_loan") now rate high where they used to fall to medium or low. All existing QuillMonitor tests still pass. Strict preservation for both providers was impossible because the two copies differed.
- `fetch-web3-incidents` passes all tags (`tags.join(' ')`) to `severityFromLoss`, not only `attack_type` (`tags[0]`). `tags[0]` is almost always "exploit" or "hack", so passing only it would ignore a `private-key-compromise` tag. `metadata.attack_type` is unchanged.

**Spec items not fully covered or deliberately different**

- Spec 5.1 says "loss amount within 10%". The brief asked for the SlowMist rule (exact amount), and that is what is implemented. Legacy `web3-incidents` amounts are inflated, so they never match on amount; the same-day rule still catches them. Allowing a 10% tolerance is a one-line change in `isHighConfidenceDuplicate` if the dry run shows misses.
- Spec 5.1 says the lower-priority record "is kept but marked". As the brief asked, A6(a) skips the insert when a higher-priority record exists, the same as SlowMist does today. As a result, a `web3-incidents` link that arrives after the QuillMonitor record is never added to that record's `sources`. Rows that arrived before QuillMonitor are kept and marked (A6b). Inserting the row pre-marked instead would close the gap at the cost of more rows.
- No importer writes `metadata.amount_status` or `metadata.funds_returned`. Neither QuillMonitor nor the scrapes provide them today. The parser and the type exist, so the page can show them once a provider does.
- "Every incident shows two dates" is a page concern (workstream C). The backend side is done: `incident_date` is set on all three Web3 importers, and `incident_date_unknown` marks the undated case. `created_at` is the date added.
- Limit Break and Magic Eden are not merged. The matcher needs an exact normalized project name, and fuzzy matching would merge unrelated incidents. This needs a manual alias mechanism (for example `metadata.duplicate_of_uid` set by hand, or an alias list), which is not in this plan.
- Previously marked duplicates are never un-marked by the QuillMonitor sync or the backfill, for example if QuillMonitor later revises the incident's date or project name. This is rare, but the dry-run samples are the only check.

**Risks**

- **Legacy bad data stays.** Existing `web3-incidents` rows keep their inflated `amount_lost_usd` (for example 3.8e12), wrong `amount_display` and keyword-based severity. `incidentSourcesFromRow` drops amounts above $100B so they do not spread, but the rows themselves still show wrong numbers. Before Telegram (B) or email (D) read amounts from old rows, add a repair step: re-parse `raw_content` with `parseUsdAmount` in `dedupe-incidents`, or null out `amount_lost_usd > 1e11` in a one-off SQL update.
- **Title-derived targets.** `web3-incidents` rows have no `project_name`, so the target comes from `incidentTargetFromTitle`. Titles like "Hacker steals $2M from X" yield the whole title and never match. Review the dry-run output for misses; adding `project_name` extraction to the feed-1 parser is a follow-up.
- **Full QuillMonitor syncs** (`mode: 'full'`) skip merging because of the 20-window cap. Existing sources are preserved, but new duplicates are only caught by the next incremental sync of that incident or by the backfill.
- **AI summaries of unconfirmed incidents.** `summarize-article` now summarizes QuillMonitor records that have no description, using only the structured facts in `content`. The prompt is unchanged and does not mention verification status, so a summary of an unconfirmed incident may read as fact. Workstreams B and D must keep showing "Unconfirmed" next to any summary. Adding the verification status to the prompt is a cheap follow-up.
- **Summary latency.** Pending QuillMonitor summaries are picked up only by the 6-hourly `summarize-articles-6hourly` cron (body `{"limit":20}`, migration `20260922084933`). Nothing triggers `summarize-article` after a QuillMonitor sync.
- **Unverified PostgREST syntax.** The `.or('summary.is.null,summary.eq."",summary.eq."Summary pending"')` quoting and the `.in('metadata->>provider', [...])` filter could not be run locally. The SlowMist importer already uses `metadata->>provider.in.(...)` inside `.or`. Check the first production logs; the release doc should include the A7 and A8 post-deploy checks.
- **Partial dedupe-incidents runs.** `dedupe-incidents` with `dryRun:false` writes one row at a time and is not transactional. A partial failure returns HTTP 207 with `writeErrors`. Re-running is safe because already-correct rows are skipped.

**No migration is needed.** All new fields are keys in `news_articles.metadata` (jsonb). `dedupe-incidents` does not write `threat_intel_ingestion_runs`, so the pipeline CHECK constraint is untouched. The A6 QuillMonitor run metadata gains `duplicates_marked`, `duplicate_candidates` and `merge_lookup`, which are free-form jsonb keys.

**Release notes for `docs/LOVABLE_PHASE0_RELEASE.md`:**
1. Deploy `fetch-web3-incidents`, `fetch-quillmonitor-incidents`, `fetch-slowmist-incidents`, `summarize-article`, `fetch-rss-news` and the new `dedupe-incidents`.
2. Run the `dedupe-incidents` dry run, review it, then run it with writes.
3. Run the `summarize-article` log check. No new secrets are needed.

**Optional local type check for the Deno entry files.** `bun build` does not catch missing names. During drafting, a throwaway tsconfig with module shims (`declare module 'https://esm.sh/@supabase/supabase-js@2.117.2' { export * from '@supabase/supabase-js'; }`, the same for `npm:zod@3.23.8`, plus a minimal `declare const Deno`) type-checked every edited entry file with no new errors. `fetch-rss-news/index.ts` has 11 errors that already exist on `main`; they come from untyped Supabase client generics. Consider adding this check to the repo as a follow-up.

---

## Section B: Frontend data layer and Threat Intel page logic (B1 to B6)

Spec: `docs/superpowers/specs/2026-10-10-threat-intel-revamp-design.md` sections 3, 5.4, 7.2, 7.6, 12.

Run the tasks in order. Each task leaves the tree green (tests, typecheck, lint) and ends in one commit. Line numbers refer to the files as they are at commit `be5d978`. Earlier tasks shift them, so always anchor edits on the quoted text, not the number.

Commands used throughout:

- One test file: `rtk proxy npx vitest run <file>` (the plain `npx vitest` output is swallowed by the shell hook).
- Full suite: `rtk proxy npx vitest run`
- Typecheck: `npx tsc --noEmit -p tsconfig.app.json`
- Lint: `npx eslint <files>` (the repo config only errors on `react-hooks/rules-of-hooks`; `any` and missing deps are warnings).

Baseline at `be5d978`: `News.navigation.test.tsx`, `newsCache.test.ts` and `newsIncident.test.ts` pass (21 tests) and `tsc` reports no errors.

New modules other sections build on (names are fixed):

| Module | Main exports |
|---|---|
| `src/lib/threatIntel/taxonomy.ts` | `NEWS_CATEGORIES`, `NEWS_CATEGORY_CONFIG`, `SEVERITY_LEVELS`, `THREAT_INTEL_SCOPES`, `DEFAULT_SCOPE`, `parseScope`, `parseListParam`, `getCategoryConfig`, `SEVERITY_STYLES`, `getSeverityStyle`, `isNewsCategory`, `isSeverityLevel` |
| `src/lib/threatIntel/articleRow.ts` | `NEWS_ARTICLE_COLUMNS`, `mapNewsArticleRow`, `mapPublishableNewsArticleRows`, `isPublishable`, `getDuplicateOfUid`, `PUBLISHABLE_POSTGREST_FILTER` |
| `src/lib/threatIntel/query.ts` | `ThreatIntelFilters`, `ThreatIntelFilterInput`, `parseThreatIntelFilters`, `buildThreatIntelFilterParams`, `buildThreatIntelQueryParams`, `buildAlertQueryParams`, `requiresThreatIntelRpc`, `ThreatIntelStats`, `parseThreatIntelStats`, `computePageStats`, `EMPTY_THREAT_INTEL_STATS`, `DEFAULT_PAGE_SIZE`, `ALERTS_PAGE_SIZE` |
| `src/hooks/useThreatIntelAlerts.ts` | `useThreatIntelAlerts` |
| `src/hooks/useDebouncedValue.ts` | `useDebouncedValue` |
| SQL | `public.threat_intel_stats(...) -> jsonb {total, critical, high, medium, low, info, supply_chain, unconfirmed}`, `search_news_articles(..., sort_by)` |

---

### Task B1: Taxonomy module

**Files:**
- Create: `src/lib/threatIntel/taxonomy.ts`
- Create: `supabase/functions/_shared/news-categories.ts`
- Modify: `supabase/functions/submit-form/index.ts:1-18` (import shared list, replace inline `VALID_CATEGORIES`)
- Modify: `supabase/functions/update-subscription/index.ts:1-21` (same)
- Modify: `src/types/news.ts:12` (document `ThreatIntelScope`)
- Modify: `src/data/newsData.ts:141-177` (re-export config from the taxonomy module)
- Modify: `src/components/news/NewsCard.tsx:4-5, 22, 31-70, 74, 83-86`
- Modify: `src/components/news/NewsDetail.tsx:6-7, 36, 59-85, 176, 183-186, 408, 424-433`
- Modify: `src/components/news/NewsFilters.tsx:4, 24-30, 59, 61`
- Modify: `src/components/news/SubscriptionForm.tsx:11, 151-159, 303-304`
- Modify: `src/pages/News.tsx:24, 51-65, 1003, 1077`
- Test: `src/utils/__tests__/threatIntelTaxonomy.test.ts` (new), `src/components/news/__tests__/NewsCard.test.tsx`, `src/components/news/__tests__/NewsDetail.test.tsx`

**Interfaces:**
- Consumes: `NewsCategory`, `SeverityLevel`, `ThreatIntelScope` from `src/types/news.ts`; `LucideIcon`, `AlertTriangle`, `Zap`, `Info` from `lucide-react`.
- Produces (`src/lib/threatIntel/taxonomy.ts`):
  - `interface CategoryConfig { name: string; description: string; color: string }`
  - `NEWS_CATEGORY_CONFIG: Readonly<Record<NewsCategory, CategoryConfig>>`
  - `NEWS_CATEGORIES: readonly NewsCategory[]`
  - `SEVERITY_LEVELS: readonly SeverityLevel[]`
  - `THREAT_INTEL_SCOPES = ['web3-incidents', 'all'] as const`
  - `DEFAULT_SCOPE: ThreatIntelScope = 'web3-incidents'`
  - `isNewsCategory(value: unknown): value is NewsCategory`
  - `isSeverityLevel(value: unknown): value is SeverityLevel`
  - `parseScope(value: string | null): ThreatIntelScope`
  - `parseListParam<T extends string>(value: string | null, allowed: readonly T[]): T[]`
  - `getCategoryConfig(category: string): CategoryConfig`
  - `interface SeverityStyle { label; rank; icon: LucideIcon; iconClass; textClass; badgeClass; solidBadgeClass; outlineClass; cardClass }`
  - `SEVERITY_STYLES: Readonly<Record<SeverityLevel, SeverityStyle>>`
  - `getSeverityStyle(severity: string): SeverityStyle`
- Produces (`supabase/functions/_shared/news-categories.ts`): `NEWS_CATEGORY_VALUES` (readonly tuple), `type NewsCategoryValue`, `VALID_NEWS_CATEGORIES: ReadonlySet<string>`.
- `src/data/newsData.ts` keeps exporting `newsCategoryConfig` as an alias of `NEWS_CATEGORY_CONFIG`, so `EmailPreview.tsx` and `ManageSubscription.tsx` (Workstream D files) keep compiling untouched.

`ThreatIntelScope` in `src/types/news.ts` is already `'all' | 'web3-incidents'`, which is also the set of `subscriptions.content_scope` values. The type does not change; only its documented meaning does (absent URL param means `web3-incidents`).

- [ ] **Step 1: Write the failing taxonomy and drift test**

Create `src/utils/__tests__/threatIntelTaxonomy.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  NEWS_CATEGORY_VALUES,
  VALID_NEWS_CATEGORIES,
} from '../../../supabase/functions/_shared/news-categories';
import {
  DEFAULT_SCOPE,
  getCategoryConfig,
  getSeverityStyle,
  isNewsCategory,
  isSeverityLevel,
  NEWS_CATEGORIES,
  NEWS_CATEGORY_CONFIG,
  parseListParam,
  parseScope,
  SEVERITY_LEVELS,
  SEVERITY_STYLES,
  THREAT_INTEL_SCOPES,
} from '@/lib/threatIntel/taxonomy';

const EDGE_FUNCTIONS_WITH_CATEGORY_ALLOWLIST = ['submit-form', 'update-subscription'];

describe('threat-intel taxonomy drift', () => {
  it('matches the server category allowlist exactly', () => {
    expect([...NEWS_CATEGORIES].sort()).toEqual([...NEWS_CATEGORY_VALUES].sort());
    expect(VALID_NEWS_CATEGORIES.size).toBe(NEWS_CATEGORIES.length);
  });

  it('has display config for every category', () => {
    expect(Object.keys(NEWS_CATEGORY_CONFIG).sort()).toEqual([...NEWS_CATEGORIES].sort());
  });

  it.each(EDGE_FUNCTIONS_WITH_CATEGORY_ALLOWLIST)(
    '%s validates categories through the shared module',
    (name) => {
      const source = readFileSync(resolve(process.cwd(), 'supabase/functions', name, 'index.ts'), 'utf8');
      expect(source).toContain('../_shared/news-categories.ts');
      expect(source).not.toMatch(/["']tools-reviews["']/);
    },
  );
});

describe('scope parsing', () => {
  it('defaults to Web3 incidents', () => {
    expect(DEFAULT_SCOPE).toBe('web3-incidents');
    expect(THREAT_INTEL_SCOPES).toEqual(['web3-incidents', 'all']);
    expect(parseScope(null)).toBe('web3-incidents');
    expect(parseScope('')).toBe('web3-incidents');
    expect(parseScope('unknown')).toBe('web3-incidents');
  });

  it('keeps explicit scopes, including legacy ?scope=web3-incidents links', () => {
    expect(parseScope('all')).toBe('all');
    expect(parseScope('web3-incidents')).toBe('web3-incidents');
  });
});

describe('parseListParam', () => {
  it('keeps allowed values once, in URL order', () => {
    expect(parseListParam('defi-exploits,web3-security,defi-exploits', NEWS_CATEGORIES))
      .toEqual(['defi-exploits', 'web3-security']);
  });

  it('drops unknown values and tolerates spaces', () => {
    expect(parseListParam(' critical , nope,high', SEVERITY_LEVELS)).toEqual(['critical', 'high']);
  });

  it('returns an empty list for missing input', () => {
    expect(parseListParam(null, SEVERITY_LEVELS)).toEqual([]);
  });
});

describe('category config', () => {
  it('returns the configured entry for known categories', () => {
    expect(getCategoryConfig('supply-chain')).toBe(NEWS_CATEGORY_CONFIG['supply-chain']);
  });

  it('returns a neutral fallback for unknown categories', () => {
    expect(getCategoryConfig('legacy-feed')).toEqual({
      name: 'Legacy Feed',
      description: 'Security news outside the standard categories',
      color: 'text-muted-foreground',
    });
    expect(getCategoryConfig('constructor').name).toBe('Constructor');
    expect(getCategoryConfig('').name).toBe('Uncategorized');
  });

  it('type-guards category and severity values', () => {
    expect(isNewsCategory('web3-security')).toBe(true);
    expect(isNewsCategory('toString')).toBe(false);
    expect(isSeverityLevel('high')).toBe(true);
    expect(isSeverityLevel('severe')).toBe(false);
  });
});

describe('severity styles', () => {
  it('defines a style for every severity, ranked critical first', () => {
    expect(Object.keys(SEVERITY_STYLES)).toEqual([...SEVERITY_LEVELS]);
    expect(SEVERITY_LEVELS.map((level) => SEVERITY_STYLES[level].rank)).toEqual([0, 1, 2, 3, 4]);
  });

  it('falls back to info styling for unknown severities', () => {
    expect(getSeverityStyle('severe')).toBe(SEVERITY_STYLES.info);
    expect(getSeverityStyle('critical').solidBadgeClass).toBe('bg-red-500 text-white');
  });
});
```

Append to the end of `src/components/news/__tests__/NewsCard.test.tsx`:

```tsx

describe('NewsCard category fallback', () => {
  it('renders a neutral badge instead of crashing on an unknown category', () => {
    render(<NewsCard article={{ ...preliminaryArticle, category: 'legacy-feed' as NewsArticle['category'] }} />);

    expect(screen.getByText('Legacy Feed')).not.toBeNull();
  });
});
```

Append to the end of `src/components/news/__tests__/NewsDetail.test.tsx`:

```tsx

describe('NewsDetail category fallback', () => {
  it('renders a neutral badge instead of crashing on an unknown category', () => {
    render(
      <MemoryRouter>
        <NewsDetail
          article={{ ...slowMistArticle, category: 'legacy-feed' as NewsArticle['category'] }}
          onBack={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Legacy Feed')).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `rtk proxy npx vitest run src/utils/__tests__/threatIntelTaxonomy.test.ts src/components/news/__tests__/NewsCard.test.tsx src/components/news/__tests__/NewsDetail.test.tsx`

Expected: the taxonomy file fails with `Failed to resolve import "../../../supabase/functions/_shared/news-categories"` (or `"@/lib/threatIntel/taxonomy"`). The two new card/detail tests fail with `TypeError: Cannot read properties of undefined (reading 'color')`.

- [ ] **Step 3: Create the shared server category list**

Create `supabase/functions/_shared/news-categories.ts`:

```ts
// Canonical news_articles.category values accepted by the subscription
// endpoints. Keep this module free of Deno and URL imports: Vitest loads it in
// src/utils/__tests__/threatIntelTaxonomy.test.ts to fail the build if the
// frontend taxonomy (src/lib/threatIntel/taxonomy.ts) drifts from it.
export const NEWS_CATEGORY_VALUES = [
  'operational-security',
  'supply-chain',
  'personal-protection',
  'web3-security',
  'defi-exploits',
  'vulnerability-disclosure',
  'tools-reviews',
] as const;

export type NewsCategoryValue = (typeof NEWS_CATEGORY_VALUES)[number];

export const VALID_NEWS_CATEGORIES: ReadonlySet<string> = new Set<string>(NEWS_CATEGORY_VALUES);
```

In `supabase/functions/submit-form/index.ts`, replace:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
```

with:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { VALID_NEWS_CATEGORIES } from "../_shared/news-categories.ts";
```

and replace:

```ts
const VALID_CATEGORIES = new Set([
  'operational-security', 'supply-chain', 'personal-protection', 'web3-security',
  'defi-exploits', 'vulnerability-disclosure', 'tools-reviews',
]);
```

with:

```ts
const VALID_CATEGORIES = VALID_NEWS_CATEGORIES;
```

In `supabase/functions/update-subscription/index.ts`, replace:

```ts
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
```

with:

```ts
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { VALID_NEWS_CATEGORIES } from "../_shared/news-categories.ts";
```

and replace:

```ts
const VALID_CATEGORIES = new Set([
  "operational-security", "supply-chain", "personal-protection", "web3-security",
  "defi-exploits", "vulnerability-disclosure", "tools-reviews",
]);
```

with:

```ts
const VALID_CATEGORIES = VALID_NEWS_CATEGORIES;
```

Both files only call `VALID_CATEGORIES.has(category)` (`submit-form/index.ts:229`, `update-subscription/index.ts:155`), which `ReadonlySet<string>` supports.

- [ ] **Step 4: Create the taxonomy module**

Create `src/lib/threatIntel/taxonomy.ts`:

```ts
import { AlertTriangle, Info, Zap, type LucideIcon } from 'lucide-react';
import type { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';

/**
 * Single source for Threat Intel categories, severities and scopes.
 * The server copy of the category list lives in
 * supabase/functions/_shared/news-categories.ts; threatIntelTaxonomy.test.ts
 * fails if the two drift.
 */

export interface CategoryConfig {
  name: string;
  description: string;
  color: string;
}

// Record<NewsCategory, ...> makes the compiler reject a missing category.
// Key order is the display order for filter chips and subscription options.
export const NEWS_CATEGORY_CONFIG: Readonly<Record<NewsCategory, CategoryConfig>> = {
  'operational-security': {
    name: 'Operational Security',
    description: 'OPSEC best practices and privacy protection',
    color: 'text-red-400',
  },
  'supply-chain': {
    name: 'Supply Chain Security',
    description: 'Dependency and package security',
    color: 'text-orange-400',
  },
  'personal-protection': {
    name: 'Personal Protection',
    description: 'Individual security measures',
    color: 'text-blue-400',
  },
  'web3-security': {
    name: 'Web3 Security',
    description: 'All Web3 and blockchain security, including DeFi incidents',
    color: 'text-purple-400',
  },
  'defi-exploits': {
    name: 'DeFi Exploits',
    description: 'DeFi protocol vulnerabilities',
    color: 'text-pink-400',
  },
  'vulnerability-disclosure': {
    name: 'Vulnerability Disclosure',
    description: 'CVE announcements and patches',
    color: 'text-yellow-400',
  },
  'tools-reviews': {
    name: 'Tools & Reviews',
    description: 'Security tool analysis',
    color: 'text-green-400',
  },
};

export const NEWS_CATEGORIES: readonly NewsCategory[] = Object.freeze(
  Object.keys(NEWS_CATEGORY_CONFIG) as NewsCategory[],
);

export const SEVERITY_LEVELS: readonly SeverityLevel[] = ['critical', 'high', 'medium', 'low', 'info'];

/** URL values for the top-level view. No `scope` param means DEFAULT_SCOPE. */
export const THREAT_INTEL_SCOPES = ['web3-incidents', 'all'] as const satisfies readonly ThreatIntelScope[];

export const DEFAULT_SCOPE: ThreatIntelScope = 'web3-incidents';

const hasOwn = (record: object, key: string): boolean => Object.prototype.hasOwnProperty.call(record, key);

export function isNewsCategory(value: unknown): value is NewsCategory {
  return typeof value === 'string' && hasOwn(NEWS_CATEGORY_CONFIG, value);
}

export function isSeverityLevel(value: unknown): value is SeverityLevel {
  return typeof value === 'string' && (SEVERITY_LEVELS as readonly string[]).includes(value);
}

/** `?scope=all` shows all security news; anything else (or nothing) is the Web3 incidents view. */
export function parseScope(value: string | null): ThreatIntelScope {
  return value !== null && (THREAT_INTEL_SCOPES as readonly string[]).includes(value)
    ? (value as ThreatIntelScope)
    : DEFAULT_SCOPE;
}

/** Parse a comma-separated URL param, keeping allowed values once, in URL order. */
export function parseListParam<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  const allowedValues = new Set<string>(allowed);
  const result: T[] = [];
  for (const raw of value.split(',')) {
    const item = raw.trim();
    if (allowedValues.has(item) && !result.includes(item as T)) result.push(item as T);
  }
  return result;
}

function humanizeSlug(value: string): string {
  return value
    .slice(0, 40)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Display config for any category string. Rows from older importers can carry
 * categories outside NewsCategory; they get a neutral badge instead of
 * crashing the card (previously NewsCard.tsx:80 and NewsDetail.tsx:180).
 */
export function getCategoryConfig(category: string): CategoryConfig {
  if (isNewsCategory(category)) return NEWS_CATEGORY_CONFIG[category];
  const name = typeof category === 'string' ? humanizeSlug(category) : '';
  return {
    name: name || 'Uncategorized',
    description: 'Security news outside the standard categories',
    color: 'text-muted-foreground',
  };
}

export interface SeverityStyle {
  label: string;
  /** 0 = most severe. Mirrors the ORDER BY in search_news_articles(sort_by => 'severity'). */
  rank: number;
  icon: LucideIcon;
  /** Icon colour. */
  iconClass: string;
  /** Plain text colour (stat tiles, select items). */
  textClass: string;
  /** Soft outlined badge (cards, filter chips). */
  badgeClass: string;
  /** Filled badge (alerts list). */
  solidBadgeClass: string;
  /** Border and text only (related articles). */
  outlineClass: string;
  /** Card accent class defined in src/index.css. */
  cardClass: string;
}

export const SEVERITY_STYLES: Readonly<Record<SeverityLevel, SeverityStyle>> = {
  critical: {
    label: 'Critical',
    rank: 0,
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    textClass: 'text-red-400',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    solidBadgeClass: 'bg-red-500 text-white',
    outlineClass: 'border-red-500/50 text-red-400',
    cardClass: 'severity-critical',
  },
  high: {
    label: 'High',
    rank: 1,
    icon: Zap,
    iconClass: 'text-orange-500',
    textClass: 'text-orange-400',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    solidBadgeClass: 'bg-orange-500 text-white',
    outlineClass: 'border-orange-500/50 text-orange-400',
    cardClass: 'severity-high',
  },
  medium: {
    label: 'Medium',
    rank: 2,
    icon: Info,
    iconClass: 'text-yellow-500',
    textClass: 'text-yellow-400',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    solidBadgeClass: 'bg-yellow-500 text-black',
    outlineClass: 'border-yellow-500/50 text-yellow-400',
    cardClass: 'severity-medium',
  },
  low: {
    label: 'Low',
    rank: 3,
    icon: Info,
    iconClass: 'text-blue-500',
    textClass: 'text-blue-400',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    solidBadgeClass: 'bg-blue-500 text-white',
    outlineClass: 'border-blue-500/50 text-blue-400',
    cardClass: 'severity-low',
  },
  info: {
    label: 'Info',
    rank: 4,
    icon: Info,
    iconClass: 'text-blue-500',
    textClass: 'text-muted-foreground',
    badgeClass: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    solidBadgeClass: 'bg-gray-500 text-white',
    outlineClass: 'border-muted text-muted-foreground',
    cardClass: 'glass-card',
  },
};

export function getSeverityStyle(severity: string): SeverityStyle {
  return isSeverityLevel(severity) ? SEVERITY_STYLES[severity] : SEVERITY_STYLES.info;
}
```

- [ ] **Step 5: Point the old config and type at the new module**

In `src/types/news.ts`, replace:

```ts
export type ThreatIntelScope = 'all' | 'web3-incidents';
```

with:

```ts
/**
 * Threat Intel view and subscription content scope.
 * 'web3-incidents' is the default page view (no ?scope param); 'all' is ?scope=all.
 * The same two values are stored in subscriptions.content_scope.
 */
export type ThreatIntelScope = 'all' | 'web3-incidents';
```

In `src/data/newsData.ts`, replace the whole block from `export const newsCategoryConfig = {` through the closing `};` at the end of the file (lines 141-177) with:

```ts
// Kept as an alias for EmailPreview and ManageSubscription. New code should
// import NEWS_CATEGORY_CONFIG or getCategoryConfig from the taxonomy module.
export { NEWS_CATEGORY_CONFIG as newsCategoryConfig } from '@/lib/threatIntel/taxonomy';
```

- [ ] **Step 6: Use the taxonomy in NewsCard**

In `src/components/news/NewsCard.tsx`, replace:

```tsx
import { ExternalLink, Clock, AlertTriangle, Info, Zap, Sparkles, RadioTower } from 'lucide-react';
import { newsCategoryConfig } from '@/data/newsData';
```

with:

```tsx
import { ExternalLink, Clock, Sparkles, RadioTower } from 'lucide-react';
import { getCategoryConfig, getSeverityStyle } from '@/lib/threatIntel/taxonomy';
```

Replace:

```tsx
  const categoryInfo = newsCategoryConfig[article.category];
```

with:

```tsx
  const categoryInfo = getCategoryConfig(article.category);
  const severityStyle = getSeverityStyle(article.severity);
  const SeverityIcon = severityStyle.icon;
```

Delete this block (lines 31-70, from `const getSeverityIcon` through the `};` that closes `getSeverityClass`):

```tsx
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <Zap className="w-4 h-4 text-orange-500" />;
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return 'glass-card';
    }
  };
```

Replace:

```tsx
      className={`news-card cursor-pointer group ${getSeverityClass(article.severity)}`}
```

with:

```tsx
      className={`news-card cursor-pointer group ${severityStyle.cardClass}`}
```

Replace:

```tsx
            <Badge variant="outline" className={getSeverityColor(article.severity)}>
              {getSeverityIcon(article.severity)}
              <span className="ml-1 capitalize">{article.severity}</span>
            </Badge>
```

with:

```tsx
            <Badge variant="outline" className={severityStyle.badgeClass}>
              <SeverityIcon className={`w-4 h-4 ${severityStyle.iconClass}`} aria-hidden="true" />
              <span className="ml-1">{severityStyle.label}</span>
            </Badge>
```

- [ ] **Step 7: Use the taxonomy in NewsDetail**

In `src/components/news/NewsDetail.tsx`, replace:

```tsx
import { ArrowLeft, ExternalLink, Clock, AlertTriangle, Info, Zap, Share, Bookmark, Home, Newspaper, ChevronRight, Loader2, RadioTower } from 'lucide-react';
import { newsCategoryConfig } from '@/data/newsData';
```

with:

```tsx
import { ArrowLeft, ExternalLink, Clock, AlertTriangle, Share, Bookmark, Home, Newspaper, ChevronRight, Loader2, RadioTower } from 'lucide-react';
import { getCategoryConfig, getSeverityStyle } from '@/lib/threatIntel/taxonomy';
```

Replace:

```tsx
  const categoryInfo = newsCategoryConfig[article.category];
```

with:

```tsx
  const categoryInfo = getCategoryConfig(article.category);
  const severityStyle = getSeverityStyle(article.severity);
  const SeverityIcon = severityStyle.icon;
```

Delete this block (lines 59-85):

```tsx
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'high':
        return <Zap className="w-5 h-5 text-orange-500" />;
      case 'medium':
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return 'glass-card';
    }
  };
```

Replace:

```tsx
      <Card className={`${getSeverityClass(article.severity)} glow`}>
```

with:

```tsx
      <Card className={`${severityStyle.cardClass} glow`}>
```

Replace:

```tsx
            <Badge variant="outline" className="flex items-center gap-1">
              {getSeverityIcon(article.severity)}
              <span className="capitalize">{article.severity}</span>
            </Badge>
```

with:

```tsx
            <Badge variant="outline" className="flex items-center gap-1">
              <SeverityIcon className={`w-5 h-5 ${severityStyle.iconClass}`} aria-hidden="true" />
              <span>{severityStyle.label}</span>
            </Badge>
```

Replace:

```tsx
                const relatedCategoryInfo = newsCategoryConfig[related.category];
```

with:

```tsx
                const relatedCategoryInfo = getCategoryConfig(related.category);
```

Replace (leave the `<Badge ` line above it untouched; it has a trailing space):

```tsx
                            className={`text-xs ${
                              related.severity === 'critical' ? 'border-red-500/50 text-red-400' :
                              related.severity === 'high' ? 'border-orange-500/50 text-orange-400' :
                              'border-muted'
                            }`}
```

with:

```tsx
                            className={`text-xs ${getSeverityStyle(related.severity).outlineClass}`}
```

Replace:

```tsx
                            {relatedCategoryInfo?.name || related.category}
```

with:

```tsx
                            {relatedCategoryInfo.name}
```

- [ ] **Step 8: Use the taxonomy in NewsFilters and SubscriptionForm**

In `src/components/news/NewsFilters.tsx`, replace:

```tsx
import { newsCategoryConfig } from '@/data/newsData';
```

with:

```tsx
import { NEWS_CATEGORIES, NEWS_CATEGORY_CONFIG, SEVERITY_LEVELS, SEVERITY_STYLES } from '@/lib/threatIntel/taxonomy';
```

Replace:

```tsx
  const severityLevels: { value: SeverityLevel; label: string; color: string }[] = [
    { value: 'critical', label: 'Critical', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { value: 'high', label: 'High', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    { value: 'low', label: 'Low', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { value: 'info', label: 'Info', color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' }
  ];
```

with:

```tsx
  const severityLevels: { value: SeverityLevel; label: string; color: string }[] = SEVERITY_LEVELS.map((level) => ({
    value: level,
    label: SEVERITY_STYLES[level].label,
    color: SEVERITY_STYLES[level].badgeClass,
  }));
```

Replace:

```tsx
            {(Object.keys(newsCategoryConfig) as NewsCategory[]).map((category) => {
```

with:

```tsx
            {NEWS_CATEGORIES.map((category) => {
```

Replace:

```tsx
              const categoryInfo = newsCategoryConfig[category];
```

with:

```tsx
              const categoryInfo = NEWS_CATEGORY_CONFIG[category];
```

In `src/components/news/SubscriptionForm.tsx`, replace:

```tsx
import { technologyCategories, newsCategoryConfig } from '@/data/newsData';
```

with:

```tsx
import { technologyCategories } from '@/data/newsData';
import { NEWS_CATEGORIES, NEWS_CATEGORY_CONFIG, SEVERITY_STYLES } from '@/lib/threatIntel/taxonomy';
```

Replace:

```tsx
  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };
```

with:

```tsx
  const getSeverityColor = (severity: SeverityLevel) => SEVERITY_STYLES[severity].textClass;
```

Replace:

```tsx
              {(Object.keys(newsCategoryConfig) as NewsCategory[]).map((category) => {
                const categoryInfo = newsCategoryConfig[category];
```

with:

```tsx
              {NEWS_CATEGORIES.map((category) => {
                const categoryInfo = NEWS_CATEGORY_CONFIG[category];
```

- [ ] **Step 9: Use the taxonomy in News.tsx**

In `src/pages/News.tsx`, replace:

```tsx
import { useNewsArticles } from '@/hooks/useNewsArticles';
```

with:

```tsx
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { NEWS_CATEGORIES, SEVERITY_LEVELS, SEVERITY_STYLES, parseListParam } from '@/lib/threatIntel/taxonomy';
```

Replace:

```tsx
const NEWS_CATEGORIES = new Set<NewsCategory>([
  'operational-security',
  'supply-chain',
  'personal-protection',
  'web3-security',
  'defi-exploits',
  'vulnerability-disclosure',
  'tools-reviews',
]);
const SEVERITY_LEVELS = new Set<SeverityLevel>(['critical', 'high', 'medium', 'low', 'info']);

function parseListParam<T extends string>(value: string | null, allowed: Set<T>): T[] {
  if (!value) return [];
  return [...new Set(value.split(',').filter((item): item is T => allowed.has(item as T)))];
}

const News = () => {
```

with:

```tsx
const News = () => {
```

The two `parseListParam(...)` calls at the old lines 71-78 keep working unchanged: the imported arrays replace the local Sets and the signature takes `readonly T[]`.

Replace:

```tsx
                              <Badge className="bg-red-500 text-white">CRITICAL</Badge>
```

with:

```tsx
                              <Badge className={SEVERITY_STYLES.critical.solidBadgeClass}>CRITICAL</Badge>
```

Replace:

```tsx
                              <Badge className="bg-orange-500 text-white">HIGH</Badge>
```

with:

```tsx
                              <Badge className={SEVERITY_STYLES.high.solidBadgeClass}>HIGH</Badge>
```

- [ ] **Step 10: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/threatIntelTaxonomy.test.ts src/components/news/__tests__/NewsCard.test.tsx src/components/news/__tests__/NewsDetail.test.tsx src/pages/__tests__/News.navigation.test.tsx src/components/news/__tests__/ContentScopeSelector.test.tsx`

Expected: all files pass.

Then run `npx tsc --noEmit -p tsconfig.app.json` (expected: no errors) and `npx eslint src/lib/threatIntel/taxonomy.ts src/components/news/NewsCard.tsx src/components/news/NewsDetail.tsx src/components/news/NewsFilters.tsx src/components/news/SubscriptionForm.tsx src/pages/News.tsx src/data/newsData.ts src/types/news.ts src/utils/__tests__/threatIntelTaxonomy.test.ts` (expected: 0 errors; the existing `any` warnings in News.tsx remain).

If Deno is installed, also run `deno check supabase/functions/submit-form/index.ts supabase/functions/update-subscription/index.ts`. Deno is not installed on the main dev machine; the Lovable deploy of these two functions is then the check.

- [ ] **Step 11: Commit**

```bash
git add src/lib/threatIntel/taxonomy.ts supabase/functions/_shared/news-categories.ts \
  supabase/functions/submit-form/index.ts supabase/functions/update-subscription/index.ts \
  src/types/news.ts src/data/newsData.ts src/components/news/NewsCard.tsx \
  src/components/news/NewsDetail.tsx src/components/news/NewsFilters.tsx \
  src/components/news/SubscriptionForm.tsx src/pages/News.tsx \
  src/utils/__tests__/threatIntelTaxonomy.test.ts \
  src/components/news/__tests__/NewsCard.test.tsx src/components/news/__tests__/NewsDetail.test.tsx
git commit -m "refactor(threat-intel): consolidate category and severity taxonomy

One module now owns categories, severities, scopes and severity styles.
Unknown categories render a neutral badge instead of crashing cards, and
a drift test keeps the frontend list equal to the server allowlist."
```

---

### Task B2: Article row mapper and the publishable filter everywhere

**Files:**
- Create: `src/lib/threatIntel/articleRow.ts`
- Modify: `src/utils/newsIncident.ts:20-23` (`CLASSIFICATION_RELEVANCE_POSTGREST_FILTER` also excludes `duplicate_of_uid`)
- Modify: `src/types/news.ts:37` (add `duplicate_of_uid` to metadata)
- Modify: `src/hooks/useNewsArticles.ts:12-21, 77-118, 205, 260, 344, 380, 415`
- Modify: `src/pages/News.tsx:26-31, 201-243, 251-345` (alerts mapper, deep-link mapper, duplicate redirect, deep-link fetch race)
- Modify: `src/hooks/useRelatedArticles.ts` (full replacement)
- Modify: `src/hooks/useMobileNotifications.ts` (full replacement)
- Modify: `src/components/news/RealtimeAlertListener.tsx:5-22, 76-80`
- Modify: `src/pages/Index.tsx:20, 78-81`
- Test: `src/utils/__tests__/articleRow.test.ts` (new), `src/hooks/__tests__/useRelatedArticles.test.tsx` (new), `src/hooks/__tests__/useMobileNotifications.test.tsx` (new), `src/components/news/__tests__/RealtimeAlertListener.test.tsx`, `src/pages/__tests__/News.navigation.test.tsx`

**Interfaces:**
- Consumes: `sanitizeText(text: string | null | undefined): string` from `src/utils/sanitize.ts`; `isSeverityLevel` from Task B1; `CLASSIFICATION_RELEVANCE_POSTGREST_FILTER` from `src/utils/newsIncident.ts`.
- Produces (`src/lib/threatIntel/articleRow.ts`):
  - `NEWS_ARTICLE_COLUMNS = 'id,title,summary,content,category,severity,tags,affected_technologies,link,source_url,source_name,author,cve_id,published_at,is_processed,metadata' as const`
  - `PUBLISHABLE_POSTGREST_FILTER: string` (same value as `CLASSIFICATION_RELEVANCE_POSTGREST_FILTER`; pass to one `.or()` call)
  - `mapNewsArticleRow(row: unknown): NewsArticle | null`
  - `isPublishable(metadata: unknown): boolean`
  - `getDuplicateOfUid(metadata: unknown): string | null`
  - `mapPublishableNewsArticleRows(rows: unknown): NewsArticle[]`
- Behaviour contract: a row is publishable when `metadata.classification_relevant` is neither `false` nor the string `'false'`, and `metadata.duplicate_of_uid` is absent or `null`. The PostgREST filter and the SQL predicate in Task B3 use the same rule (`metadata->>'duplicate_of_uid' IS NULL`).

`isClassificationRelevant` in `src/utils/newsIncident.ts` stays as it is (classifier-only check) because `isPublishable` takes raw `unknown` metadata and also checks duplicates. `src/lib/threatIntel/articleRow.ts` imports from `newsIncident.ts`, never the reverse, so there is no import cycle.

- [ ] **Step 1: Write the failing mapper test**

Create `src/utils/__tests__/articleRow.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  getDuplicateOfUid,
  isPublishable,
  mapNewsArticleRow,
  mapPublishableNewsArticleRows,
  NEWS_ARTICLE_COLUMNS,
  PUBLISHABLE_POSTGREST_FILTER,
} from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';

const baseRow = {
  id: '6f1c2d4e-0000-4000-8000-000000000001',
  title: 'Bridge &amp; <b>Router</b> drained',
  summary: 'Attacker drained the bridge.',
  content: '<p>Full report</p>',
  category: 'web3-security',
  severity: 'critical',
  tags: ['bridge', 7, ''],
  affected_technologies: ['Ethereum'],
  link: 'https://example.com/report',
  source_url: '',
  source_name: 'QuillMonitor',
  author: null,
  cve_id: null,
  published_at: '2026-10-01T12:00:00Z',
  is_processed: true,
  metadata: { provider: 'quillmonitor', verification_status: 'verified' },
};

describe('NEWS_ARTICLE_COLUMNS', () => {
  it('selects only public card and detail fields', () => {
    const columns = NEWS_ARTICLE_COLUMNS.split(',');
    expect(columns).toContain('metadata');
    expect(columns).not.toContain('raw_content');
    expect(columns).not.toContain('search_vector');
  });
});

describe('mapNewsArticleRow', () => {
  it('maps and sanitizes a database row', () => {
    expect(mapNewsArticleRow(baseRow)).toEqual({
      id: baseRow.id,
      title: 'Bridge & Router drained',
      summary: 'Attacker drained the bridge.',
      content: 'Full report',
      category: 'web3-security',
      tags: ['bridge'],
      severity: 'critical',
      sourceUrl: undefined,
      link: 'https://example.com/report',
      publishedAt: new Date('2026-10-01T12:00:00Z'),
      affectedTechnologies: ['Ethereum'],
      author: undefined,
      cveId: undefined,
      isProcessed: true,
      sourceName: 'QuillMonitor',
      metadata: { provider: 'quillmonitor', verification_status: 'verified' },
    });
  });

  it('falls back to the summary when content is empty', () => {
    expect(mapNewsArticleRow({ ...baseRow, content: '   ' })?.content).toBe('Attacker drained the bridge.');
  });

  it('normalizes unknown severity to info and keeps unknown categories for the display fallback', () => {
    const article = mapNewsArticleRow({ ...baseRow, severity: 'severe', category: 'legacy-feed' });
    expect(article?.severity).toBe('info');
    expect(article?.category).toBe('legacy-feed');
  });

  it('uses vulnerability-disclosure when the category is missing', () => {
    expect(mapNewsArticleRow({ ...baseRow, category: null })?.category).toBe('vulnerability-disclosure');
  });

  it('drops metadata that is not a plain object', () => {
    expect(mapNewsArticleRow({ ...baseRow, metadata: ['x'] })?.metadata).toBeUndefined();
  });

  it.each([
    ['null', null],
    ['an array', [baseRow]],
    ['a row without an id', { ...baseRow, id: '' }],
    ['a row without a title', { ...baseRow, title: '<b></b>' }],
    ['a row with an invalid date', { ...baseRow, published_at: 'not a date' }],
  ])('returns null for %s', (_label, row) => {
    expect(mapNewsArticleRow(row)).toBeNull();
  });
});

describe('isPublishable', () => {
  it.each([
    [undefined, true],
    [null, true],
    [{}, true],
    [{ classification_relevant: true }, true],
    [{ duplicate_of_uid: null }, true],
    [{ classification_relevant: false }, false],
    [{ classification_relevant: 'false' }, false],
    [{ duplicate_of_uid: 'quillmonitor:42' }, false],
    [{ duplicate_of_uid: '' }, false],
  ])('isPublishable(%j) is %s', (metadata, expected) => {
    expect(isPublishable(metadata)).toBe(expected);
  });

  it('reads the primary uid of a merged duplicate', () => {
    expect(getDuplicateOfUid({ duplicate_of_uid: 'quillmonitor:42' })).toBe('quillmonitor:42');
    expect(getDuplicateOfUid({ duplicate_of_uid: '' })).toBeNull();
    expect(getDuplicateOfUid(undefined)).toBeNull();
  });
});

describe('mapPublishableNewsArticleRows', () => {
  it('drops invalid, rejected and duplicate rows', () => {
    const rows = [
      baseRow,
      { ...baseRow, id: 'dup', metadata: { duplicate_of_uid: 'quillmonitor:1' } },
      { ...baseRow, id: 'rejected', metadata: { classification_relevant: false } },
      { ...baseRow, id: '' },
    ];
    expect(mapPublishableNewsArticleRows(rows).map((article) => article.id)).toEqual([baseRow.id]);
  });

  it('returns an empty list for non-array input', () => {
    expect(mapPublishableNewsArticleRows(null)).toEqual([]);
  });
});

describe('publishable PostgREST filter', () => {
  it('excludes classifier rejections and merged duplicates in one or() group', () => {
    expect(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER).toBe(
      'and(or(metadata->>classification_relevant.is.null,metadata->>classification_relevant.neq.false),metadata->>duplicate_of_uid.is.null)',
    );
    expect(PUBLISHABLE_POSTGREST_FILTER).toBe(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `rtk proxy npx vitest run src/utils/__tests__/articleRow.test.ts`

Expected: FAIL with `Failed to resolve import "@/lib/threatIntel/articleRow"`.

- [ ] **Step 3: Create the mapper and extend the PostgREST filter**

Create `src/lib/threatIntel/articleRow.ts`:

```ts
import type { NewsArticle, NewsCategory } from '@/types/news';
import { sanitizeText } from '@/utils/sanitize';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';
import { isSeverityLevel } from '@/lib/threatIntel/taxonomy';

/**
 * Public card and detail columns. Do not use select('*'): raw_content and
 * search_vector are large and never needed in the browser.
 */
export const NEWS_ARTICLE_COLUMNS = 'id,title,summary,content,category,severity,tags,affected_technologies,link,source_url,source_name,author,cve_id,published_at,is_processed,metadata' as const;

/** PostgREST filter for one `.or()` call that keeps only publishable rows (see isPublishable). */
export const PUBLISHABLE_POSTGREST_FILTER = CLASSIFICATION_RELEVANCE_POSTGREST_FILTER;

// The server classifier's own default (supabase/functions/_shared/rss-classifier.ts).
const FALLBACK_CATEGORY: NewsCategory = 'vulnerability-disclosure';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Convert one news_articles row (table select or search_news_articles RPC) into
 * a NewsArticle. Returns null when the row has no id, no title after
 * sanitizing, or no valid published_at.
 */
export function mapNewsArticleRow(row: unknown): NewsArticle | null {
  if (!isRecord(row)) return null;

  const id = typeof row.id === 'string' ? row.id.trim() : typeof row.id === 'number' ? String(row.id) : '';
  const title = sanitizeText(typeof row.title === 'string' ? row.title : '');
  const publishedAt = parseDate(row.published_at);
  if (!id || !title || !publishedAt) return null;

  const summary = sanitizeText(typeof row.summary === 'string' ? row.summary : '');
  const content = typeof row.content === 'string' && row.content.trim() !== ''
    ? sanitizeText(row.content)
    : summary;

  return {
    id,
    title,
    summary,
    content,
    // Unknown categories are kept as-is and rendered through getCategoryConfig().
    category: (optionalText(row.category) ?? FALLBACK_CATEGORY) as NewsCategory,
    tags: stringList(row.tags),
    severity: isSeverityLevel(row.severity) ? row.severity : 'info',
    sourceUrl: optionalText(row.source_url),
    link: optionalText(row.link),
    publishedAt,
    affectedTechnologies: stringList(row.affected_technologies),
    author: optionalText(row.author),
    cveId: optionalText(row.cve_id),
    isProcessed: row.is_processed === true,
    sourceName: optionalText(row.source_name),
    metadata: isRecord(row.metadata) ? (row.metadata as NewsArticle['metadata']) : undefined,
  };
}

/**
 * False when the classifier rejected the row or the cross-provider matcher
 * merged it into another record. Same rule as PUBLISHABLE_POSTGREST_FILTER and
 * the SQL predicate in search_news_articles / count_news_articles / threat_intel_stats.
 */
export function isPublishable(metadata: unknown): boolean {
  if (!isRecord(metadata)) return true;
  if (metadata.classification_relevant === false || metadata.classification_relevant === 'false') return false;
  return metadata.duplicate_of_uid === undefined || metadata.duplicate_of_uid === null;
}

/** The uid of the primary record when this row is a merged duplicate. */
export function getDuplicateOfUid(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null;
  const uid = metadata.duplicate_of_uid;
  return typeof uid === 'string' && uid.trim() !== '' ? uid.trim() : null;
}

export function mapPublishableNewsArticleRows(rows: unknown): NewsArticle[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(mapNewsArticleRow)
    .filter((article): article is NewsArticle => article !== null && isPublishable(article.metadata));
}
```

In `src/utils/newsIncident.ts`, replace:

```ts
export const CLASSIFICATION_RELEVANCE_POSTGREST_FILTER = [
  'metadata->>classification_relevant.is.null',
  'metadata->>classification_relevant.neq.false',
].join(',');
```

with:

```ts
// Publishable = not rejected by the classifier AND not merged into another
// provider's record. Pass it to a single `.or()` call: the outer and() keeps
// both conditions inside one PostgREST logic group. Mirrors isPublishable() in
// src/lib/threatIntel/articleRow.ts and the SQL predicate in the feed RPCs.
export const CLASSIFICATION_RELEVANCE_POSTGREST_FILTER =
  'and(or(metadata->>classification_relevant.is.null,metadata->>classification_relevant.neq.false),metadata->>duplicate_of_uid.is.null)';
```

In `src/types/news.ts`, replace:

```ts
    classification_relevant?: boolean;
```

with:

```ts
    classification_relevant?: boolean;
    duplicate_of_uid?: string | null;
```

- [ ] **Step 4: Run the mapper test and confirm it passes**

Run: `rtk proxy npx vitest run src/utils/__tests__/articleRow.test.ts src/utils/__tests__/newsIncident.test.ts`

Expected: PASS.

- [ ] **Step 5: Write failing tests for related articles, mobile badges, realtime toasts and deep links**

Create `src/hooks/__tests__/useRelatedArticles.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NEWS_ARTICLE_COLUMNS } from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';
import { useRelatedArticles } from '@/hooks/useRelatedArticles';

const db = vi.hoisted(() => {
  const state: { rows: unknown[] } = { rows: [] };
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'or', 'eq', 'neq', 'order', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: state.rows, error: null }).then(resolve);
  return { state, query, from: vi.fn(() => query) };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: db.from } }));

const row = (id: string, tags: string[], metadata: Record<string, unknown> = {}) => ({
  id,
  title: `Report ${id}`,
  summary: 'Summary',
  content: 'Body',
  category: 'supply-chain',
  severity: 'high',
  tags,
  affected_technologies: [],
  link: null,
  source_url: null,
  source_name: 'Feed',
  author: null,
  cve_id: null,
  published_at: '2026-10-01T00:00:00Z',
  is_processed: false,
  metadata,
});

describe('useRelatedArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.state.rows = [
      row('plain', []),
      row('duplicate', ['npm'], { duplicate_of_uid: 'quillmonitor:1' }),
      row('tagged', ['NPM']),
      { id: '', title: 'broken' },
    ];
  });

  afterEach(cleanup);

  it('selects public columns, applies the publishable filter and ranks by tag overlap', async () => {
    const tags = ['npm'];
    const { result } = renderHook(() => useRelatedArticles({
      currentArticleId: 'current',
      category: 'supply-chain',
      tags,
      limit: 4,
    }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.query.select).toHaveBeenCalledWith(NEWS_ARTICLE_COLUMNS);
    expect(db.query.or).toHaveBeenCalledWith(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
    expect(result.current.relatedArticles.map((article) => article.id)).toEqual(['tagged', 'plain']);
  });
});
```

Create `src/hooks/__tests__/useMobileNotifications.test.tsx`:

```tsx
// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';
import { useMobileNotifications } from '@/hooks/useMobileNotifications';

const db = vi.hoisted(() => {
  const handlers: Record<string, (payload: { new: unknown }) => void> = {};
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'or', 'in', 'gte']) {
    query[method] = vi.fn(() => query);
  }
  query.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ count: 2, error: null }).then(resolve);
  const channel: Record<string, unknown> = {};
  channel.on = vi.fn((_type: string, config: { event: string }, callback: (payload: { new: unknown }) => void) => {
    handlers[config.event] = callback;
    return channel;
  });
  channel.subscribe = vi.fn(() => channel);
  return { handlers, query, channel, from: vi.fn(() => query) };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: db.from,
    channel: vi.fn(() => db.channel),
    removeChannel: vi.fn(),
  },
}));

describe('useMobileNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(cleanup);

  it('counts only publishable critical and high alerts', async () => {
    const { result } = renderHook(() => useMobileNotifications());

    await waitFor(() => expect(result.current.alertCount).toBe(2));
    expect(db.query.select).toHaveBeenCalledWith('id', { count: 'exact', head: true });
    expect(db.query.or).toHaveBeenCalledWith(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
  });

  it('ignores realtime inserts for merged duplicates', async () => {
    const { result } = renderHook(() => useMobileNotifications());
    await waitFor(() => expect(result.current.alertCount).toBe(2));

    act(() => {
      db.handlers.INSERT({ new: { severity: 'critical', metadata: { duplicate_of_uid: 'quillmonitor:1' } } });
    });
    expect(result.current.alertCount).toBe(2);

    act(() => {
      db.handlers.INSERT({ new: { severity: 'critical', metadata: { provider: 'quillmonitor' } } });
    });
    expect(result.current.alertCount).toBe(3);
  });
});
```

In `src/components/news/__tests__/RealtimeAlertListener.test.tsx`, replace the last four lines of the file:

```tsx
    expect(realtime.toast).not.toHaveBeenCalled();
    expect(onNewArticle).toHaveBeenCalledTimes(1);
  });
});
```

The two `expect` lines appear in both existing tests, but only the last test is followed by the describe's closing `});` at column 0, so the four-line block above is unique. Replace it with:

```tsx
    expect(realtime.toast).not.toHaveBeenCalled();
    expect(onNewArticle).toHaveBeenCalledTimes(1);
  });

  it('does not toast a merged duplicate insert', () => {
    const onNewArticle = vi.fn();
    render(<RealtimeAlertListener onNewArticle={onNewArticle} />);

    act(() => {
      realtime.handlers.INSERT({
        new: {
          id: 'slowmist:2',
          title: 'Duplicate of a QuillMonitor incident',
          severity: 'critical',
          category: 'web3-security',
          summary: 'Summary',
          published_at: new Date().toISOString(),
          source_name: 'SlowMist Hacked',
          metadata: { provider: 'slowmist', classification_relevant: false, duplicate_of_uid: 'quillmonitor:1' },
        },
      });
      vi.advanceTimersByTime(1_500);
    });

    expect(realtime.toast).not.toHaveBeenCalled();
    expect(onNewArticle).toHaveBeenCalledTimes(1);
  });
});
```

In `src/pages/__tests__/News.navigation.test.tsx`, replace:

```tsx
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
```

with:

```tsx
const deepLink = vi.hoisted(() => {
  const rows: Record<string, unknown> = {};
  const from = vi.fn(() => {
    const filters: Record<string, unknown> = {};
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn((column: string, value: unknown) => {
      filters[column] = value;
      return chain;
    });
    chain.maybeSingle = vi.fn(async () => {
      const key = filters.id !== undefined ? `id:${String(filters.id)}` : `uid:${String(filters.uid)}`;
      return { data: rows[key] ?? null, error: null };
    });
    return chain;
  });
  return { rows, from };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: deepLink.from,
    auth: {
```

Replace:

```tsx
describe('threat-intel article navigation', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
  });
```

with:

```tsx
function renderAt(url: string) {
  const router = createMemoryRouter(
    [
      { path: '/threat-intel', element: <News /> },
      { path: '/threat-intel/:articleId', element: <News /> },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('threat-intel article navigation', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(deepLink.rows)) delete deepLink.rows[key];
  });
```

Replace the end of the file:

```tsx
    await waitFor(() => expect(screen.queryByTestId('article-detail')).toBeNull());
    expect(screen.getByRole('heading', { name: 'Threat Intelligence Feed' })).not.toBeNull();
  });
});
```

with:

```tsx
    await waitFor(() => expect(screen.queryByTestId('article-detail')).toBeNull());
    expect(screen.getByRole('heading', { name: 'Threat Intelligence Feed' })).not.toBeNull();
  });

  it('redirects a deep link for a merged duplicate to the primary incident', async () => {
    deepLink.rows['id:dup-1'] = {
      id: 'dup-1',
      title: 'Duplicate report',
      summary: 'Summary',
      content: 'Body',
      category: 'web3-security',
      severity: 'critical',
      tags: [],
      affected_technologies: [],
      link: null,
      source_url: null,
      source_name: 'SlowMist Hacked',
      author: null,
      cve_id: null,
      published_at: '2026-09-27T08:00:00Z',
      is_processed: false,
      metadata: { classification_relevant: false, duplicate_of_uid: 'quillmonitor:42' },
    };
    deepLink.rows['uid:quillmonitor:42'] = { id: 'article-1' };

    const router = renderAt('/threat-intel/dup-1');

    await waitFor(() => expect(router.state.location.pathname).toBe('/threat-intel/article-1'));
    expect((await screen.findByTestId('article-detail')).textContent).toContain('Test threat report');
    expect(deepLink.from).toHaveBeenCalledWith('news_articles');
  });

  it('does not follow a merged duplicate whose primary is itself a duplicate', async () => {
    deepLink.rows['id:dup-2'] = {
      id: 'dup-2',
      title: 'Duplicate report',
      summary: 'Summary',
      content: 'Body',
      category: 'web3-security',
      severity: 'critical',
      tags: [],
      affected_technologies: [],
      link: null,
      source_url: null,
      source_name: 'SlowMist Hacked',
      author: null,
      cve_id: null,
      published_at: '2026-09-27T08:00:00Z',
      is_processed: false,
      metadata: { duplicate_of_uid: 'slowmist:7' },
    };
    deepLink.rows['uid:slowmist:7'] = { id: 'dup-3', metadata: { duplicate_of_uid: 'web3-incidents:9' } };

    const router = renderAt('/threat-intel/dup-2');

    const uidLookups = () => deepLink.from.mock.results
      .filter((result) => (result.value as { eq: { mock: { calls: unknown[][] } } }).eq.mock.calls.some(([column]) => column === 'uid'))
      .length;
    await waitFor(() => expect(uidLookups()).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(router.state.location.pathname).toBe('/threat-intel/dup-2');
    expect(screen.queryByTestId('article-detail')).toBeNull();
  });
});
```

- [ ] **Step 6: Run the new tests and confirm they fail**

Run: `rtk proxy npx vitest run src/hooks/__tests__/useRelatedArticles.test.tsx src/hooks/__tests__/useMobileNotifications.test.tsx src/components/news/__tests__/RealtimeAlertListener.test.tsx src/pages/__tests__/News.navigation.test.tsx`

Expected failures:
- `useRelatedArticles`: `expected "spy" to be called with arguments: [ 'id,title,…' ]` (the hook still selects `'*'`).
- `useMobileNotifications`: `select` called with `'*'` and `or` never called.
- `RealtimeAlertListener › does not toast a merged duplicate insert`: `expected "spy" to not be called` (a toast fires).
- `News.navigation › redirects a deep link…`: the pathname stays `/threat-intel/dup-1` (the record shows "not found").
- `News.navigation › does not follow a merged duplicate whose primary…`: `expected 0 to be 1` (no uid lookup happens yet). It passes once Step 12 lands; the guard in Step 12 is what keeps it from redirecting to `dup-3`.

- [ ] **Step 7: Replace `useRelatedArticles`**

Replace the full contents of `src/hooks/useRelatedArticles.ts` with:

```ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle, NewsCategory } from '@/types/news';
import { mapPublishableNewsArticleRows, NEWS_ARTICLE_COLUMNS } from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';

interface UseRelatedArticlesOptions {
  currentArticleId: string;
  category: NewsCategory;
  tags: string[];
  limit?: number;
}

const TAG_SEPARATOR = '\u0000';

export function useRelatedArticles({
  currentArticleId,
  category,
  tags,
  limit = 4,
}: UseRelatedArticlesOptions) {
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Key on tag contents so a new array with the same tags does not refetch.
  const tagsKey = tags.map((tag) => tag.toLowerCase()).join(TAG_SEPARATOR);

  useEffect(() => {
    let cancelled = false;
    const wantedTags = tagsKey ? tagsKey.split(TAG_SEPARATOR) : [];

    const fetchRelatedArticles = async () => {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('news_articles')
          .select(NEWS_ARTICLE_COLUMNS)
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .eq('category', category)
          .neq('id', currentArticleId)
          .order('published_at', { ascending: false })
          .limit(limit + 5); // Fetch extra to allow for scoring

        if (error) throw error;
        if (cancelled) return;

        const scored = mapPublishableNewsArticleRows(data).map((article) => ({
          article,
          score: wantedTags.filter((tag) => article.tags.some((articleTag) => articleTag.toLowerCase() === tag)).length,
        }));

        // Higher tag overlap first, then newest first.
        scored.sort((a, b) => (
          b.score - a.score || b.article.publishedAt.getTime() - a.article.publishedAt.getTime()
        ));

        setRelatedArticles(scored.slice(0, limit).map((entry) => entry.article));
      } catch (err) {
        console.error('Error fetching related articles:', err);
        if (!cancelled) setRelatedArticles([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    if (currentArticleId && category) {
      void fetchRelatedArticles();
    } else {
      setIsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [currentArticleId, category, tagsKey, limit]);

  return { relatedArticles, isLoading };
}
```

- [ ] **Step 8: Replace `useMobileNotifications`**

Replace the full contents of `src/hooks/useMobileNotifications.ts` with:

```ts
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isPublishable } from '@/lib/threatIntel/articleRow';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';

interface NotificationState {
  alertCount: number;
  hasNewQuiz: boolean;
  lastCheckedAlerts: string | null;
}

export const useMobileNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState>({
    alertCount: 0,
    hasNewQuiz: false,
    lastCheckedAlerts: null,
  });

  useEffect(() => {
    // Load last checked timestamp from localStorage
    const lastChecked = localStorage.getItem('lastCheckedAlerts');
    const lastQuizVisit = localStorage.getItem('lastQuizVisit');

    // Check for new critical/high severity alerts since last check
    const fetchNewAlerts = async () => {
      try {
        const checkTime = lastChecked || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { count, error } = await supabase
          .from('news_articles')
          .select('id', { count: 'exact', head: true })
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .in('severity', ['critical', 'high'])
          .gte('published_at', checkTime);

        if (!error && count !== null) {
          setNotifications(prev => ({
            ...prev,
            alertCount: Math.min(count, 99), // Cap at 99
            lastCheckedAlerts: checkTime,
          }));
        }
      } catch (err) {
        console.error('Error fetching alert count:', err);
      }
    };

    // Check if there's a new quiz challenge (weekly reset)
    const checkQuizStatus = () => {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const hasNewChallenge = !lastQuizVisit || new Date(lastQuizVisit) < weekStart;
      setNotifications(prev => ({ ...prev, hasNewQuiz: hasNewChallenge }));
    };

    fetchNewAlerts();
    checkQuizStatus();

    // Subscribe to realtime updates for new critical alerts
    const channel = supabase
      .channel('mobile-alert-badges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'news_articles',
        },
        (payload) => {
          const row = payload.new as { severity?: string; metadata?: unknown } | null;
          const isAlertSeverity = row?.severity === 'critical' || row?.severity === 'high';
          // Merged duplicates and classifier rejections never reach the feed,
          // so they must not raise the badge either.
          if (isAlertSeverity && isPublishable(row?.metadata)) {
            setNotifications(prev => ({
              ...prev,
              alertCount: Math.min(prev.alertCount + 1, 99),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAlertsRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastCheckedAlerts', now);
    setNotifications(prev => ({ ...prev, alertCount: 0, lastCheckedAlerts: now }));
  };

  const markQuizVisited = () => {
    localStorage.setItem('lastQuizVisit', new Date().toISOString());
    setNotifications(prev => ({ ...prev, hasNewQuiz: false }));
  };

  return {
    alertCount: notifications.alertCount,
    hasNewQuiz: notifications.hasNewQuiz,
    markAlertsRead,
    markQuizVisited,
  };
};
```

- [ ] **Step 9: Skip toasts for unpublishable realtime inserts**

In `src/components/news/RealtimeAlertListener.tsx`, replace:

```tsx
import { NewsCategory, SeverityLevel } from '@/types/news';
```

with:

```tsx
import { NewsCategory, SeverityLevel } from '@/types/news';
import { isPublishable } from '@/lib/threatIntel/articleRow';
```

Replace:

```tsx
    provider_created_at?: string;
    suppress_realtime_alert?: boolean;
  };
}
```

with:

```tsx
    provider_created_at?: string;
    suppress_realtime_alert?: boolean;
    classification_relevant?: boolean | string;
    duplicate_of_uid?: string | null;
  };
}
```

Replace:

```tsx
          if (
            article.metadata?.suppress_realtime_alert !== true &&
            isRecent &&
```

with:

```tsx
          if (
            article.metadata?.suppress_realtime_alert !== true &&
            isPublishable(article.metadata) &&
            isRecent &&
```

- [ ] **Step 10: Apply the filter to the homepage alerts list**

In `src/pages/Index.tsx`, replace:

```tsx
import { supabase } from '@/integrations/supabase/client';
```

with:

```tsx
import { supabase } from '@/integrations/supabase/client';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER } from '@/utils/newsIncident';
```

Replace:

```tsx
        .select('id, title, severity, published_at')
        .in('severity', ['critical', 'high', 'medium'])
```

with:

```tsx
        .select('id, title, severity, published_at')
        .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
        .in('severity', ['critical', 'high', 'medium'])
```

- [ ] **Step 11: Use the shared mapper in useNewsArticles**

In `src/hooks/useNewsArticles.ts`, replace:

```ts
import {
  buildCategoryPostgrestFilter,
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isClassificationRelevant,
  isWeb3Incident,
  WEB3_INCIDENT_POSTGREST_FILTER,
} from '@/utils/newsIncident';
import type { Database } from '@/integrations/supabase/types';
```

with:

```ts
import {
  buildCategoryPostgrestFilter,
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isWeb3Incident,
  WEB3_INCIDENT_POSTGREST_FILTER,
} from '@/utils/newsIncident';
import {
  isPublishable,
  mapPublishableNewsArticleRows,
  NEWS_ARTICLE_COLUMNS,
} from '@/lib/threatIntel/articleRow';
```

Delete the local column list, row type and mapper (lines 77-118), from:

```ts
const NEWS_ARTICLE_COLUMNS = 'id,title,summary,content,category,severity,tags,affected_technologies,link,source_url,source_name,author,cve_id,published_at,is_processed,metadata' as const;
```

through the end of `const toNewsArticle = (row: NewsArticleQueryRow): NewsArticle => ({ ... });` (the line `});` right before `const emptyFeedFreshness = {`).

Replace:

```ts
      setArticles(cached.articles.filter(isClassificationRelevant));
      setTotalCount(cached.totalCount);
      setIsCachedData(true);
      setFeedStatus({
        source: 'cache',
        isStale: cached.isStale,
        checkedAt: cached.cachedAt,
        ...emptyFeedFreshness,
      });
```

with:

```ts
      setArticles(cached.articles.filter((article) => isPublishable(article.metadata)));
      setTotalCount(cached.totalCount);
      setIsCachedData(true);
      setFeedStatus({
        source: 'cache',
        isStale: cached.isStale,
        checkedAt: cached.cachedAt,
        ...emptyFeedFreshness,
      });
```

Replace:

```ts
      let data: NewsArticleQueryRow[] | null = null;
```

with:

```ts
      let data: unknown[] | null = null;
```

Replace:

```ts
        const transformedArticles = (fallbackData || []).map(toNewsArticle).filter(isClassificationRelevant);
```

with:

```ts
        const transformedArticles = mapPublishableNewsArticleRows(fallbackData);
```

Replace:

```ts
      const transformedArticles = (data || []).map(toNewsArticle).filter(isClassificationRelevant);
```

with:

```ts
      const transformedArticles = mapPublishableNewsArticleRows(data);
```

Replace:

```ts
        setArticles(cached.articles.filter(isClassificationRelevant));
        setTotalCount(cached.totalCount);
        setIsCachedData(true);
```

with:

```ts
        setArticles(cached.articles.filter((article) => isPublishable(article.metadata)));
        setTotalCount(cached.totalCount);
        setIsCachedData(true);
```

(The first `setArticles(cached.articles.filter(isClassificationRelevant));` is indented 6 spaces in the hydration effect; the second is indented 8 spaces in the `catch` block. Both get replaced.)

- [ ] **Step 12: Use the mapper in News.tsx (alerts and deep link) and redirect duplicates**

In `src/pages/News.tsx`, replace:

```tsx
import {
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isClassificationRelevant,
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
} from '@/utils/newsIncident';
```

with:

```tsx
import {
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
} from '@/utils/newsIncident';
import {
  getDuplicateOfUid,
  isPublishable,
  mapNewsArticleRow,
  mapPublishableNewsArticleRows,
  NEWS_ARTICLE_COLUMNS,
} from '@/lib/threatIntel/articleRow';
```

Replace (alerts query, 6-space indent):

```tsx
      .from('news_articles')
      .select('*')
      .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
```

with:

```tsx
      .from('news_articles')
      .select(NEWS_ARTICLE_COLUMNS)
      .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
```

Replace:

```tsx
    const sanitize = (value: string | null | undefined) => (value || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const alertRows = data || [];
    setActiveAlerts(alertRows.map((row) => ({
      id: row.id,
      title: sanitize(row.title),
      summary: sanitize(row.summary),
      content: sanitize(row.content || row.summary),
      category: row.category as NewsCategory,
      severity: row.severity as SeverityLevel,
      tags: row.tags || [],
      affectedTechnologies: row.affected_technologies || [],
      link: row.link,
      sourceUrl: row.source_url || '',
      sourceName: row.source_name || '',
      author: row.author || '',
      cveId: row.cve_id || undefined,
      publishedAt: new Date(row.published_at),
      isProcessed: row.is_processed ?? false,
      metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata as NewsArticle['metadata']
        : undefined,
    })));
    setActiveAlertCount(alertRows.length);
```

with:

```tsx
    const alertRows = mapPublishableNewsArticleRows(data);
    setActiveAlerts(alertRows);
    setActiveAlertCount(alertRows.length);
```

Replace (deep-link query, 8-space indent):

```tsx
        .from('news_articles')
        .select('*')
        .eq('id', requestedArticleId)
        .maybeSingle();
```

with:

```tsx
        .from('news_articles')
        .select(NEWS_ARTICLE_COLUMNS)
        .eq('id', requestedArticleId)
        .maybeSingle();
```

Replace the block from `      if (data) {` through the `      }` that closes its `else` branch (old lines 293-337):

```tsx
      if (data) {
        const sanitize = (t: string | null | undefined) => {
          if (!t) return '';
          let s = t, prev = '';
          while (s !== prev) {
            prev = s;
            s = s.replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(parseInt(c, 10)))
              .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
              .replace(/&(amp|lt|gt|quot|apos|nbsp|mdash|ndash|hellip|rsquo|lsquo|rdquo|ldquo);/gi, (_, n) => {
                const m: Record<string, string> = { amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',mdash:'—',ndash:'–',hellip:'…',rsquo:'\u2019',lsquo:'\u2018',rdquo:'\u201D',ldquo:'\u201C' };
                return m[n.toLowerCase()] ?? '';
              });
            s = s.replace(/<[^>]*>/g, '');
          }
          return s.replace(/\s+/g, ' ').trim();
        };
        const article: NewsArticle = {
          id: data.id,
          title: sanitize(data.title),
          summary: sanitize(data.summary),
          content: sanitize(data.content),
          category: data.category as any,
          severity: data.severity as any,
          tags: data.tags || [],
          affectedTechnologies: data.affected_technologies || [],
          link: data.link,
          sourceUrl: data.source_url || '',
          sourceName: data.source_name || '',
          author: data.author || '',
          cveId: data.cve_id || undefined,
          publishedAt: new Date(data.published_at),
          isProcessed: data.is_processed ?? false,
          metadata: data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
            ? data.metadata as NewsArticle['metadata']
            : undefined,
        };
        if (!isClassificationRelevant(article)) {
          setDeepLinkState('not-found');
          return;
        }
        setSelectedArticle(article);
        setDeepLinkState('idle');
      } else {
        setDeepLinkState('not-found');
      }
```

with:

```tsx
      const article = mapNewsArticleRow(data);
      if (!article) {
        setDeepLinkState('not-found');
        return;
      }

      // A record merged into another provider's incident keeps its old URL
      // working (shared links, emails) by forwarding to the primary record.
      const primaryUid = getDuplicateOfUid(article.metadata);
      if (primaryUid) {
        const { data: primary } = await supabase
          .from('news_articles')
          .select('id, metadata')
          .eq('uid', primaryUid)
          .maybeSingle();
        if (cancelled) return;
        // Only forward to a record that is not itself merged, so a bad merge
        // (A -> B -> A) can never send the browser round in a loop.
        if (primary?.id && primary.id !== article.id && !getDuplicateOfUid(primary.metadata)) {
          deepLinkLoaded.current = '';
          navigate(`/threat-intel/${encodeURIComponent(primary.id)}`, { replace: true });
          return;
        }
        setDeepLinkState('not-found');
        return;
      }

      if (!isPublishable(article.metadata)) {
        setDeepLinkState('not-found');
        return;
      }
      setSelectedArticle(article);
      setDeepLinkState('idle');
```

The deep-link effect also has a race that the redirect test exposes. It depends on `dbArticles`, so when the feed (or cache hydration on mount) replaces the article list while the single-row fetch is in flight, the cleanup sets `cancelled`, the re-run hits the `deepLinkLoaded` guard and returns, and the page stays on the feed instead of the article. Read the list through a ref so only a route change restarts the effect. Replace:

```tsx
  const requestedArticleId = (routeArticleId || searchParams.get('article') || '').trim();
  const deepLinkLoaded = useRef('');
```

with:

```tsx
  const requestedArticleId = (routeArticleId || searchParams.get('article') || '').trim();
  const deepLinkLoaded = useRef('');
  // Read the loaded list through a ref: a feed refresh must not cancel an
  // in-flight deep-link fetch (the effect below only restarts on route change).
  const dbArticlesRef = useRef(dbArticles);
  useEffect(() => {
    dbArticlesRef.current = dbArticles;
  }, [dbArticles]);
```

Replace:

```tsx
    const found = dbArticles.find(a => a.id === requestedArticleId);
```

with:

```tsx
    const found = dbArticlesRef.current.find(a => a.id === requestedArticleId);
```

Replace the deep-link effect's dependency list:

```tsx
  }, [requestedArticleId, dbArticles]);

  useEffect(() => {
    if (!requestedArticleId) return;
```

with:

```tsx
  }, [requestedArticleId, navigate]);

  useEffect(() => {
    if (!requestedArticleId) return;
```

The existing effect right below it (`refreshedArticle`) still swaps in the newer copy of the selected article when the feed reloads.

- [ ] **Step 13: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/articleRow.test.ts src/hooks/__tests__/useRelatedArticles.test.tsx src/hooks/__tests__/useMobileNotifications.test.tsx src/components/news/__tests__/RealtimeAlertListener.test.tsx src/pages/__tests__/News.navigation.test.tsx src/components/news/__tests__/NewsDetail.test.tsx src/utils/__tests__/newsIncident.test.ts`

Expected: PASS.

Then `npx tsc --noEmit -p tsconfig.app.json` (no errors) and `npx eslint src/lib/threatIntel/articleRow.ts src/utils/newsIncident.ts src/hooks/useNewsArticles.ts src/hooks/useRelatedArticles.ts src/hooks/useMobileNotifications.ts src/components/news/RealtimeAlertListener.tsx src/pages/Index.tsx src/pages/News.tsx` (0 errors).

Confirm no ad-hoc mappers or `select('*')` remain in Threat Intel code: `rtk proxy grep -rn "select('\*')" src/pages/News.tsx src/hooks/useRelatedArticles.ts src/hooks/useMobileNotifications.ts src/hooks/useNewsArticles.ts` prints nothing.

- [ ] **Step 14: Commit**

```bash
git add src/lib/threatIntel/articleRow.ts src/utils/newsIncident.ts src/types/news.ts \
  src/hooks/useNewsArticles.ts src/hooks/useRelatedArticles.ts src/hooks/useMobileNotifications.ts \
  src/components/news/RealtimeAlertListener.tsx src/pages/Index.tsx src/pages/News.tsx \
  src/utils/__tests__/articleRow.test.ts src/hooks/__tests__/useRelatedArticles.test.tsx \
  src/hooks/__tests__/useMobileNotifications.test.tsx \
  src/components/news/__tests__/RealtimeAlertListener.test.tsx \
  src/pages/__tests__/News.navigation.test.tsx
git commit -m "fix(threat-intel): share article row mapping and hide merged duplicates

One mapper replaces the four ad-hoc row conversions. Related articles,
homepage alerts, mobile badges and realtime toasts now skip classifier
rejections and records marked duplicate_of_uid, and deep links to a
merged duplicate forward to the primary incident."
```

---

### Task B3: Server-side stats and severity sort

**Files:**
- Create: `supabase/migrations/20261011090000_threat_intel_stats.sql`
- Create: `src/lib/threatIntel/query.ts`
- Modify: `src/integrations/supabase/types.ts:717-748` (`count_news_articles`), `:781-869` (`search_news_articles`, add `threat_intel_stats`)
- Modify: `src/utils/newsCache.ts` (full replacement: explicit scope in keys, stats cached per filter set)
- Modify: `src/hooks/useNewsArticles.ts` (full replacement)
- Modify: `src/pages/News.tsx:185-186` (destructure `statsSource`), `:548-578` (stat tiles)
- Modify: `src/pages/__tests__/News.navigation.test.tsx:47` (mock stats shape)
- Test: `src/utils/__tests__/threatIntelQuery.test.ts` (new), `src/utils/__tests__/newsCache.test.ts` (full replacement), `src/hooks/__tests__/useNewsArticles.test.tsx` (new)

**Interfaces:**
- Consumes: `NEWS_CATEGORIES`, `SEVERITY_LEVELS`, `parseListParam`, `parseScope`, `DEFAULT_SCOPE` (B1); `NEWS_ARTICLE_COLUMNS`, `mapPublishableNewsArticleRows`, `isPublishable` (B2).
- Produces (`src/lib/threatIntel/query.ts`):
  - `DATE_FILTERS = ['all','7d','30d','90d'] as const`, `type DateFilter`
  - `SORT_OPTIONS = ['date','severity'] as const`, `type SortBy`
  - `DEFAULT_PAGE_SIZE = 20`, `ALERTS_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`
  - `ALERT_SEVERITIES: readonly SeverityLevel[]` (`['critical','high']`)
  - `interface ThreatIntelFilters { scope; categories; severities; searchQuery; dateFilter; sortBy; page; pageSize }`
  - `type ThreatIntelFilterInput = Pick<ThreatIntelFilters, 'scope' | 'categories' | 'severities' | 'searchQuery' | 'dateFilter'>`
  - `interface ThreatIntelFilterParams { search_query; category_filter; severity_filter; date_from; source_filter; web3_incidents_only }` (exact `count_news_articles` / `threat_intel_stats` args)
  - `interface ThreatIntelSearchParams extends ThreatIntelFilterParams { result_limit; result_offset; sort_by }` (exact `search_news_articles` args)
  - `interface ThreatIntelAlertQuery { search: ThreatIntelSearchParams; filter: ThreatIntelFilterParams }`
  - `interface ThreatIntelStats { total; critical; high; medium; low; info; supplyChain; unconfirmed }` (all `number`)
  - `EMPTY_THREAT_INTEL_STATS: ThreatIntelStats`
  - `parseThreatIntelFilters(params: URLSearchParams, pageSize?: number): ThreatIntelFilters`
  - `dateFilterToIso(dateFilter: DateFilter, now?: Date): string | null`
  - `buildThreatIntelFilterParams(filters: ThreatIntelFilterInput, now?: Date): ThreatIntelFilterParams`
  - `buildThreatIntelQueryParams(filters: ThreatIntelFilters, now?: Date): ThreatIntelSearchParams`
  - `requiresThreatIntelRpc(filters: Pick<ThreatIntelFilters, 'scope' | 'categories' | 'searchQuery' | 'sortBy'>): boolean`
  - `resolveAlertSeverities(selected: readonly SeverityLevel[]): SeverityLevel[]`
  - `buildAlertQueryParams(filters: ThreatIntelFilterInput, page: number, now?: Date): ThreatIntelAlertQuery | null`
  - `parseThreatIntelStats(value: unknown): ThreatIntelStats | null`
  - `computePageStats(articles: readonly NewsArticle[], total: number): ThreatIntelStats`
- Produces (`useNewsArticles`): result gains `stats: ThreatIntelStats` (new shape; `aiSummarized` and `web3Incidents` are removed, nothing reads them) and `statsSource: 'server' | 'page'`. Options are unchanged except `view` now defaults to `DEFAULT_SCOPE`.
- Produces (`newsCache`): `interface CacheFilterInput { scope: ThreatIntelScope; categories?; severities?; searchQuery?; dateFilter?; sortBy?; source?; page? }`, `buildFilterKey(opts: CacheFilterInput)`, `buildStatsFilterKey(opts: CacheFilterInput)`, `saveStatsToCache(stats: ThreatIntelStats, filterKey: string)`, `loadStatsFromCache(filterKey: string): ThreatIntelStats | null`.
- Produces (SQL):
  - `public.search_news_articles(search_query text, category_filter text[], severity_filter text[], date_from timestamptz, result_limit integer, result_offset integer, source_filter text, web3_incidents_only boolean, sort_by text DEFAULT 'date')`, same `RETURNS TABLE` as before.
  - `public.count_news_articles(search_query, category_filter, severity_filter, date_from, source_filter, web3_incidents_only) RETURNS bigint` (signature unchanged, now excludes duplicates).
  - `public.threat_intel_stats(search_query, category_filter, severity_filter, date_from, source_filter, web3_incidents_only) RETURNS jsonb` with keys `total, critical, high, medium, low, info, supply_chain, unconfirmed`.

The localStorage scope leak listed under B5 is fixed in this task (Step 7), because the stats cache shape changes here anyway. The old stats cache was one global entry, so a Web3 visit seeded the total shown on any later URL, including `?tab=subscribe`.

- [ ] **Step 1: Write the failing query-helper test**

Create `src/utils/__tests__/threatIntelQuery.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import {
  ALERTS_PAGE_SIZE,
  buildAlertQueryParams,
  buildThreatIntelFilterParams,
  buildThreatIntelQueryParams,
  computePageStats,
  parseThreatIntelFilters,
  parseThreatIntelStats,
  requiresThreatIntelRpc,
  resolveAlertSeverities,
  type ThreatIntelFilters,
} from '@/lib/threatIntel/query';

const NOW = new Date('2026-10-10T12:00:00.000Z');

const baseFilters: ThreatIntelFilters = {
  scope: 'web3-incidents',
  categories: [],
  severities: [],
  searchQuery: '',
  dateFilter: 'all',
  sortBy: 'date',
  page: 1,
  pageSize: 20,
};

describe('parseThreatIntelFilters', () => {
  it('reads every shareable filter from the URL', () => {
    const params = new URLSearchParams('scope=all&categories=web3-security,bogus&severities=critical&q=bridge&date=30d&sort=severity&page=3');
    expect(parseThreatIntelFilters(params)).toEqual({
      scope: 'all',
      categories: ['web3-security'],
      severities: ['critical'],
      searchQuery: 'bridge',
      dateFilter: '30d',
      sortBy: 'severity',
      page: 3,
      pageSize: 20,
    });
  });

  it('defaults to the Web3 incidents view and safe values', () => {
    expect(parseThreatIntelFilters(new URLSearchParams('date=1y&sort=random&page=-4'))).toEqual(baseFilters);
  });

  it('accepts the legacy singular category and severity params', () => {
    const filters = parseThreatIntelFilters(new URLSearchParams('category=supply-chain&severity=high'));
    expect(filters.categories).toEqual(['supply-chain']);
    expect(filters.severities).toEqual(['high']);
  });
});

describe('buildThreatIntelQueryParams', () => {
  it('maps the default view to Web3-only, newest-first RPC params', () => {
    expect(buildThreatIntelQueryParams(baseFilters, NOW)).toEqual({
      search_query: null,
      category_filter: null,
      severity_filter: null,
      date_from: null,
      source_filter: null,
      web3_incidents_only: true,
      result_limit: 20,
      result_offset: 0,
      sort_by: 'date',
    });
  });

  it('maps filters, date window, severity sort and page offset', () => {
    expect(buildThreatIntelQueryParams({
      ...baseFilters,
      scope: 'all',
      categories: ['supply-chain'],
      severities: ['critical', 'high'],
      searchQuery: '  npm worm ',
      dateFilter: '7d',
      sortBy: 'severity',
      page: 3,
    }, NOW)).toEqual({
      search_query: 'npm worm',
      category_filter: ['supply-chain'],
      severity_filter: ['critical', 'high'],
      date_from: '2026-10-03T12:00:00.000Z',
      source_filter: null,
      web3_incidents_only: false,
      result_limit: 20,
      result_offset: 40,
      sort_by: 'severity',
    });
  });

  it('clamps page size to the RPC maximum and page to 1', () => {
    const params = buildThreatIntelQueryParams({ ...baseFilters, page: 0, pageSize: 500 }, NOW);
    expect(params.result_limit).toBe(100);
    expect(params.result_offset).toBe(0);
  });

  it('does not share array references with the caller', () => {
    const categories: ThreatIntelFilters['categories'] = ['supply-chain'];
    const params = buildThreatIntelFilterParams({ ...baseFilters, categories }, NOW);
    expect(params.category_filter).toEqual(['supply-chain']);
    expect(params.category_filter).not.toBe(categories);
  });
});

describe('requiresThreatIntelRpc', () => {
  it('keeps plain chronological browsing of all news on the direct query', () => {
    expect(requiresThreatIntelRpc({ ...baseFilters, scope: 'all' })).toBe(false);
  });

  it.each([
    ['the Web3 scope', { scope: 'web3-incidents' as const }],
    ['the Web3 umbrella category', { scope: 'all' as const, categories: ['web3-security' as const] }],
    ['a search', { scope: 'all' as const, searchQuery: 'bridge' }],
    ['severity sort', { scope: 'all' as const, sortBy: 'severity' as const }],
  ])('uses the RPC for %s', (_label, overrides) => {
    expect(requiresThreatIntelRpc({ ...baseFilters, ...overrides })).toBe(true);
  });
});

describe('alert queries', () => {
  it('limits alerts to critical and high unless the user narrowed severity', () => {
    expect(resolveAlertSeverities([])).toEqual(['critical', 'high']);
    expect(resolveAlertSeverities(['critical', 'medium'])).toEqual(['critical']);
    expect(resolveAlertSeverities(['low'])).toEqual([]);
  });

  it('builds paginated alert params that follow scope and filters', () => {
    const query = buildAlertQueryParams({
      scope: 'all',
      categories: ['supply-chain'],
      severities: [],
      searchQuery: 'npm',
      dateFilter: '30d',
    }, 2, NOW);
    const filter = {
      search_query: 'npm',
      category_filter: ['supply-chain'],
      severity_filter: ['critical', 'high'],
      date_from: '2026-09-10T12:00:00.000Z',
      source_filter: null,
      web3_incidents_only: false,
    };
    expect(query?.filter).toEqual(filter);
    expect(query?.search).toEqual({
      ...filter,
      result_limit: ALERTS_PAGE_SIZE,
      result_offset: ALERTS_PAGE_SIZE,
      sort_by: 'date',
    });
  });

  it('returns null when no alert severity is selected', () => {
    expect(buildAlertQueryParams({ ...baseFilters, severities: ['medium'] }, 1, NOW)).toBeNull();
  });
});

describe('stats', () => {
  it('parses the threat_intel_stats jsonb payload', () => {
    expect(parseThreatIntelStats({
      total: 57, critical: 9, high: '14', medium: 20, low: 10, info: 4, supply_chain: 3, unconfirmed: 2,
    })).toEqual({
      total: 57, critical: 9, high: 14, medium: 20, low: 10, info: 4, supplyChain: 3, unconfirmed: 2,
    });
  });

  it('rejects payloads without a valid total', () => {
    expect(parseThreatIntelStats(null)).toBeNull();
    expect(parseThreatIntelStats([])).toBeNull();
    expect(parseThreatIntelStats({ critical: 1 })).toBeNull();
    expect(parseThreatIntelStats({ total: -1 })).toBeNull();
  });

  it('treats missing buckets as zero', () => {
    expect(parseThreatIntelStats({ total: 3 })?.critical).toBe(0);
  });

  it('computes page-only fallback stats', () => {
    const article = (severity: NewsArticle['severity'], extra: Partial<NewsArticle> = {}): NewsArticle => ({
      id: `${severity}-${extra.category ?? 'x'}`,
      title: 'Title',
      summary: '',
      content: '',
      category: 'web3-security',
      tags: [],
      severity,
      publishedAt: NOW,
      ...extra,
    });
    expect(computePageStats([
      article('critical'),
      article('high', { category: 'supply-chain' }),
      article('info', { metadata: { verification_status: 'unverified' } }),
    ], 42)).toEqual({
      total: 42, critical: 1, high: 1, medium: 0, low: 0, info: 1, supplyChain: 1, unconfirmed: 1,
    });
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `rtk proxy npx vitest run src/utils/__tests__/threatIntelQuery.test.ts`

Expected: FAIL with `Failed to resolve import "@/lib/threatIntel/query"`.

- [ ] **Step 3: Create the query helpers**

Create `src/lib/threatIntel/query.ts`:

```ts
import type { NewsArticle, NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { NEWS_CATEGORIES, SEVERITY_LEVELS, parseListParam, parseScope } from '@/lib/threatIntel/taxonomy';

export const DATE_FILTERS = ['all', '7d', '30d', '90d'] as const;
export type DateFilter = (typeof DATE_FILTERS)[number];

export const SORT_OPTIONS = ['date', 'severity'] as const;
export type SortBy = (typeof SORT_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const ALERTS_PAGE_SIZE = 20;
/** search_news_articles clamps result_limit to 100. */
export const MAX_PAGE_SIZE = 100;
export const ALERT_SEVERITIES: readonly SeverityLevel[] = ['critical', 'high'];

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_FILTER_DAYS: Record<Exclude<DateFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

/** Everything the Threat Intel URL can express. */
export interface ThreatIntelFilters {
  scope: ThreatIntelScope;
  categories: NewsCategory[];
  severities: SeverityLevel[];
  searchQuery: string;
  dateFilter: DateFilter;
  sortBy: SortBy;
  page: number;
  pageSize: number;
}

/** The filters that decide which rows match (no paging or ordering). */
export type ThreatIntelFilterInput = Pick<
  ThreatIntelFilters,
  'scope' | 'categories' | 'severities' | 'searchQuery' | 'dateFilter'
>;

/** Arguments of count_news_articles and threat_intel_stats. */
export interface ThreatIntelFilterParams {
  search_query: string | null;
  category_filter: NewsCategory[] | null;
  severity_filter: SeverityLevel[] | null;
  date_from: string | null;
  source_filter: string | null;
  web3_incidents_only: boolean;
}

/** Arguments of search_news_articles. */
export interface ThreatIntelSearchParams extends ThreatIntelFilterParams {
  result_limit: number;
  result_offset: number;
  sort_by: SortBy;
}

export interface ThreatIntelAlertQuery {
  search: ThreatIntelSearchParams;
  filter: ThreatIntelFilterParams;
}

/** Counts for the whole filtered result (threat_intel_stats), camelCased. */
export interface ThreatIntelStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  supplyChain: number;
  unconfirmed: number;
}

export const EMPTY_THREAT_INTEL_STATS: ThreatIntelStats = Object.freeze({
  total: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  info: 0,
  supplyChain: 0,
  unconfirmed: 0,
});

function positiveInteger(value: number, fallback: number): number {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function parseThreatIntelFilters(
  params: URLSearchParams,
  pageSize: number = DEFAULT_PAGE_SIZE,
): ThreatIntelFilters {
  const date = params.get('date') || '';
  const page = Number.parseInt(params.get('page') || '1', 10);
  return {
    scope: parseScope(params.get('scope')),
    categories: parseListParam(params.get('categories') || params.get('category'), NEWS_CATEGORIES),
    severities: parseListParam(params.get('severities') || params.get('severity'), SEVERITY_LEVELS),
    searchQuery: params.get('q') || '',
    dateFilter: (DATE_FILTERS as readonly string[]).includes(date) ? (date as DateFilter) : 'all',
    sortBy: params.get('sort') === 'severity' ? 'severity' : 'date',
    page: positiveInteger(page, 1),
    pageSize,
  };
}

export function dateFilterToIso(dateFilter: DateFilter, now: Date = new Date()): string | null {
  if (dateFilter === 'all') return null;
  return new Date(now.getTime() - DATE_FILTER_DAYS[dateFilter] * DAY_MS).toISOString();
}

export function buildThreatIntelFilterParams(
  filters: ThreatIntelFilterInput,
  now: Date = new Date(),
): ThreatIntelFilterParams {
  const searchQuery = filters.searchQuery.trim();
  return {
    search_query: searchQuery || null,
    category_filter: filters.categories.length > 0 ? [...filters.categories] : null,
    severity_filter: filters.severities.length > 0 ? [...filters.severities] : null,
    date_from: dateFilterToIso(filters.dateFilter, now),
    source_filter: null,
    web3_incidents_only: filters.scope === 'web3-incidents',
  };
}

export function buildThreatIntelQueryParams(
  filters: ThreatIntelFilters,
  now: Date = new Date(),
): ThreatIntelSearchParams {
  const pageSize = Math.min(positiveInteger(filters.pageSize, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const page = positiveInteger(filters.page, 1);
  return {
    ...buildThreatIntelFilterParams(filters, now),
    result_limit: pageSize,
    result_offset: (page - 1) * pageSize,
    sort_by: filters.sortBy === 'severity' ? 'severity' : 'date',
  };
}

/**
 * Plain newest-first browsing of all news stays on the indexed direct table
 * query. Search, the Web3 scope, the Web3 umbrella category and severity sort
 * need the RPC (ranking, metadata predicates, server-side ORDER BY).
 */
export function requiresThreatIntelRpc(
  filters: Pick<ThreatIntelFilters, 'scope' | 'categories' | 'searchQuery' | 'sortBy'>,
): boolean {
  return filters.scope === 'web3-incidents'
    || filters.categories.includes('web3-security')
    || filters.searchQuery.trim() !== ''
    || filters.sortBy === 'severity';
}

/** Alerts are critical/high; a severity filter can narrow that but not widen it. */
export function resolveAlertSeverities(selected: readonly SeverityLevel[]): SeverityLevel[] {
  if (selected.length === 0) return [...ALERT_SEVERITIES];
  return ALERT_SEVERITIES.filter((severity) => selected.includes(severity));
}

/** Null when the active severity filter leaves no alert severity to show. */
export function buildAlertQueryParams(
  filters: ThreatIntelFilterInput,
  page: number,
  now: Date = new Date(),
): ThreatIntelAlertQuery | null {
  const severities = resolveAlertSeverities(filters.severities);
  if (severities.length === 0) return null;
  const alertFilters: ThreatIntelFilterInput = { ...filters, severities };
  return {
    search: buildThreatIntelQueryParams({
      ...alertFilters,
      sortBy: 'date',
      page,
      pageSize: ALERTS_PAGE_SIZE,
    }, now),
    filter: buildThreatIntelFilterParams(alertFilters, now),
  };
}

function toCount(value: unknown): number | null {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

/** Validate the jsonb returned by threat_intel_stats. */
export function parseThreatIntelStats(value: unknown): ThreatIntelStats | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const total = toCount(record.total);
  if (total === null) return null;
  const read = (key: string) => toCount(record[key]) ?? 0;
  return {
    total,
    critical: read('critical'),
    high: read('high'),
    medium: read('medium'),
    low: read('low'),
    info: read('info'),
    supplyChain: read('supply_chain'),
    unconfirmed: read('unconfirmed'),
  };
}

/** Fallback when threat_intel_stats is unavailable: counts for the loaded page only. */
export function computePageStats(articles: readonly NewsArticle[], total: number): ThreatIntelStats {
  const count = (predicate: (article: NewsArticle) => boolean) => articles.filter(predicate).length;
  return {
    total,
    critical: count((article) => article.severity === 'critical'),
    high: count((article) => article.severity === 'high'),
    medium: count((article) => article.severity === 'medium'),
    low: count((article) => article.severity === 'low'),
    info: count((article) => !['critical', 'high', 'medium', 'low'].includes(article.severity)),
    supplyChain: count((article) => article.category === 'supply-chain'),
    unconfirmed: count((article) => article.metadata?.verification_status === 'unverified'),
  };
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `rtk proxy npx vitest run src/utils/__tests__/threatIntelQuery.test.ts`

Expected: PASS.

- [ ] **Step 5: Write the migration**

Create `supabase/migrations/20261011090000_threat_intel_stats.sql`:

```sql
-- Threat Intel page: whole-result stats and server-side severity sort.
--
-- 1. threat_intel_stats(...) returns severity, category and verification
--    counts for exactly the rows search_news_articles can return for the same
--    filters, so the stat tiles describe the whole filtered result instead of
--    the 20 rows on screen.
-- 2. search_news_articles gains sort_by ('date' | 'severity'). Severity order
--    is applied before LIMIT/OFFSET, so page 2 continues page 1's ordering.
-- 3. search, count and stats exclude rows the cross-provider matcher marked
--    metadata.duplicate_of_uid. This matches isPublishable() in
--    src/lib/threatIntel/articleRow.ts and CLASSIFICATION_RELEVANCE_POSTGREST_FILTER
--    in src/utils/newsIncident.ts.
--
-- The WHERE clause is identical in all three functions (marked
-- THREAT_INTEL_FILTER_PREDICATE). Change all three together.

-- PostgREST resolves RPC calls by argument names. Older 6-, 7- and 8-argument
-- overloads of search_news_articles are still live (see
-- src/integrations/supabase/types.ts). A 9-argument version with all defaults
-- next to them makes calls that omit sort_by ambiguous (PGRST203), so drop
-- every historical signature first. The stale count overloads go too; the
-- frontend only calls the 6-argument count.
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text);
DROP FUNCTION IF EXISTS public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz);
DROP FUNCTION IF EXISTS public.count_news_articles(text, text[], text[], timestamptz, text);

CREATE FUNCTION public.search_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  result_limit integer DEFAULT 100,
  result_offset integer DEFAULT 0,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false,
  sort_by text DEFAULT 'date'
)
RETURNS TABLE(
  id uuid, title text, summary text, content text, category text, severity text,
  tags text[], affected_technologies text[], link text, source_url text,
  source_name text, author text, cve_id text, published_at timestamptz,
  is_processed boolean, metadata jsonb, rank real
)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_val tsquery;
BEGIN
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;

  RETURN QUERY
  SELECT na.id, na.title, na.summary, na.content, na.category, na.severity,
    na.tags, na.affected_technologies, na.link, na.source_url, na.source_name,
    na.author, na.cve_id, na.published_at, na.is_processed, na.metadata,
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0.0 END
  FROM public.news_articles na
  -- THREAT_INTEL_FILTER_PREDICATE (keep identical in search/count/stats)
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND na.metadata->>'duplicate_of_uid' IS NULL
    AND (
      category_filter IS NULL
      OR na.category = ANY(array_remove(category_filter, 'web3-security'))
      OR (
        'web3-security' = ANY(category_filter)
        AND (
          na.metadata->>'security_domain' = 'web3'
          OR (
            na.metadata->>'security_domain' IS NULL
            AND (
              na.category IN ('web3-security', 'defi-exploits')
              OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
              OR na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
            )
          )
        )
      )
    )
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
    AND (
      NOT web3_incidents_only
      OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
      OR (
        na.metadata->>'is_web3_incident' IS NULL
        AND na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
      )
    )
  ORDER BY
    -- Rank order mirrors SEVERITY_STYLES[*].rank in src/lib/threatIntel/taxonomy.ts.
    CASE WHEN sort_by = 'severity' THEN
      CASE na.severity
        WHEN 'critical' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END
    ELSE 0 END,
    CASE WHEN tsquery_val IS NOT NULL THEN ts_rank(na.search_vector, tsquery_val) ELSE 0 END DESC,
    na.published_at DESC,
    na.id DESC
  LIMIT greatest(1, least(result_limit, 100))
  OFFSET greatest(result_offset, 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.count_news_articles(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false
)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_val tsquery;
  total_count bigint;
BEGIN
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;

  SELECT count(*) INTO total_count
  FROM public.news_articles na
  -- THREAT_INTEL_FILTER_PREDICATE (keep identical in search/count/stats)
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND na.metadata->>'duplicate_of_uid' IS NULL
    AND (
      category_filter IS NULL
      OR na.category = ANY(array_remove(category_filter, 'web3-security'))
      OR (
        'web3-security' = ANY(category_filter)
        AND (
          na.metadata->>'security_domain' = 'web3'
          OR (
            na.metadata->>'security_domain' IS NULL
            AND (
              na.category IN ('web3-security', 'defi-exploits')
              OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
              OR na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
            )
          )
        )
      )
    )
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
    AND (
      NOT web3_incidents_only
      OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
      OR (
        na.metadata->>'is_web3_incident' IS NULL
        AND na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
      )
    );

  RETURN total_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.threat_intel_stats(
  search_query text DEFAULT NULL,
  category_filter text[] DEFAULT NULL,
  severity_filter text[] DEFAULT NULL,
  date_from timestamptz DEFAULT NULL,
  source_filter text DEFAULT NULL,
  web3_incidents_only boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_val tsquery;
  result jsonb;
BEGIN
  IF search_query IS NOT NULL AND search_query != '' THEN
    tsquery_val := plainto_tsquery('english', search_query);
  END IF;

  SELECT jsonb_build_object(
    'total', count(*),
    'critical', count(*) FILTER (WHERE na.severity = 'critical'),
    'high', count(*) FILTER (WHERE na.severity = 'high'),
    'medium', count(*) FILTER (WHERE na.severity = 'medium'),
    'low', count(*) FILTER (WHERE na.severity = 'low'),
    -- The frontend maps unknown severities to 'info' (mapNewsArticleRow), so count them here too.
    'info', count(*) FILTER (WHERE na.severity IS NULL OR na.severity NOT IN ('critical', 'high', 'medium', 'low')),
    'supply_chain', count(*) FILTER (WHERE na.category = 'supply-chain'),
    'unconfirmed', count(*) FILTER (WHERE na.metadata->>'verification_status' = 'unverified')
  )
  INTO result
  FROM public.news_articles na
  -- THREAT_INTEL_FILTER_PREDICATE (keep identical in search/count/stats)
  WHERE (tsquery_val IS NULL OR na.search_vector @@ tsquery_val)
    AND coalesce(na.metadata->>'classification_relevant', 'true') != 'false'
    AND na.metadata->>'duplicate_of_uid' IS NULL
    AND (
      category_filter IS NULL
      OR na.category = ANY(array_remove(category_filter, 'web3-security'))
      OR (
        'web3-security' = ANY(category_filter)
        AND (
          na.metadata->>'security_domain' = 'web3'
          OR (
            na.metadata->>'security_domain' IS NULL
            AND (
              na.category IN ('web3-security', 'defi-exploits')
              OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
              OR na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
            )
          )
        )
      )
    )
    AND (severity_filter IS NULL OR na.severity = ANY(severity_filter))
    AND (date_from IS NULL OR na.published_at >= date_from)
    AND (source_filter IS NULL OR na.source_name = source_filter)
    AND (
      NOT web3_incidents_only
      OR coalesce(na.metadata->>'is_web3_incident', 'false') = 'true'
      OR (
        na.metadata->>'is_web3_incident' IS NULL
        AND na.metadata->>'provider' IN ('quillmonitor', 'web3-incidents', 'web3')
      )
    );

  RETURN result;
END;
$function$;

COMMENT ON FUNCTION public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text) IS
  'Public Threat Intel feed page. sort_by: date (default) or severity. Excludes classifier rejections and merged duplicates.';
COMMENT ON FUNCTION public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean) IS
  'Whole-result counts for the Threat Intel stat tiles. Same filters and predicate as search_news_articles.';

-- Earlier versions relied on default EXECUTE grants. The search function was
-- dropped and recreated, so grant explicitly.
GRANT EXECUTE ON FUNCTION public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_news_articles(text, text[], text[], timestamptz, text, boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean) TO anon, authenticated, service_role;

-- Make PostgREST forget the dropped overloads immediately.
NOTIFY pgrst, 'reload schema';
```

There is no local database, so review the SQL by reading it. Each of the three `WHERE` blocks (after the `THREAT_INTEL_FILTER_PREDICATE` comment) must equal `supabase/migrations/20260927180000_add_subscription_content_scope.sql:76-106` plus exactly one added line, `AND na.metadata->>'duplicate_of_uid' IS NULL`. Quick checks: `rtk proxy grep -c "duplicate_of_uid' IS NULL" supabase/migrations/20261011090000_threat_intel_stats.sql` prints `3`, and `rtk proxy grep -c "THREAT_INTEL_FILTER_PREDICATE (keep identical" supabase/migrations/20261011090000_threat_intel_stats.sql` prints `3`.

Sanity check for the deployer, to run in the Lovable SQL editor after the migration is applied:

```sql
-- 1. Exactly one search, one count and one stats function remain.
SELECT p.oid::regprocedure AS signature
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('search_news_articles', 'count_news_articles', 'threat_intel_stats')
ORDER BY 1;
-- Expect 3 rows.

-- 2. Stats total equals the count for the default Web3 view and for all news.
SELECT
  (public.threat_intel_stats(web3_incidents_only => true) ->> 'total')::bigint
    = public.count_news_articles(web3_incidents_only => true) AS web3_total_matches,
  (public.threat_intel_stats() ->> 'total')::bigint
    = public.count_news_articles() AS all_total_matches;
-- Expect true, true.

-- 3. Severity buckets add up to the total.
SELECT (s ->> 'total')::bigint
  = (s ->> 'critical')::bigint + (s ->> 'high')::bigint + (s ->> 'medium')::bigint
  + (s ->> 'low')::bigint + (s ->> 'info')::bigint AS buckets_sum_to_total
FROM public.threat_intel_stats(web3_incidents_only => true) AS s;
-- Expect true.

-- 4. Severity sort puts the most severe rows first across the whole result.
SELECT severity, published_at, title
FROM public.search_news_articles(web3_incidents_only => true, sort_by => 'severity', result_limit => 10);
-- Expect critical rows first (if any exist), newest first within a severity.

-- 5. No merged duplicates leak into the feed.
SELECT count(*) AS leaked_duplicates
FROM public.search_news_articles(result_limit => 100, web3_incidents_only => true) s
WHERE s.metadata ->> 'duplicate_of_uid' IS NOT NULL;
-- Expect 0.

-- 6. Anonymous visitors can call the stats RPC (RLS still applies: SECURITY INVOKER).
--    If the SQL editor refuses SET ROLE, check instead that the live page's
--    stat tiles say "in this view" while logged out.
SET ROLE anon;
SELECT public.threat_intel_stats(web3_incidents_only => true);
RESET ROLE;

-- 7. Cost of the extra request per filter change.
EXPLAIN (ANALYZE, BUFFERS) SELECT public.threat_intel_stats();
-- Note the execution time; anything above ~300 ms needs a follow-up index review.
```

- [ ] **Step 6: Update the generated Supabase typings**

The project keeps generated types in this file; Lovable regenerates them after the migration, but the code must typecheck before that.

In `src/integrations/supabase/types.ts`, replace:

```ts
      count_news_articles:
        | {
            Args: {
              category_filter?: string[]
              date_from?: string
              search_query?: string
              severity_filter?: string[]
            }
            Returns: number
          }
        | {
            Args: {
              category_filter?: string[]
              date_from?: string
              search_query?: string
              severity_filter?: string[]
              source_filter?: string
            }
            Returns: number
          }
        | {
            Args: {
              category_filter?: string[]
              date_from?: string
              search_query?: string
              severity_filter?: string[]
              source_filter?: string
              web3_incidents_only?: boolean
            }
            Returns: number
          }
```

with:

```ts
      count_news_articles: {
        Args: {
          category_filter?: string[]
          date_from?: string
          search_query?: string
          severity_filter?: string[]
          source_filter?: string
          web3_incidents_only?: boolean
        }
        Returns: number
      }
```

Replace the whole `search_news_articles:` union (from `      search_news_articles:` through the `          }` on the line before `    }` / `    Enums: {`) with:

```ts
      search_news_articles: {
        Args: {
          category_filter?: string[]
          date_from?: string
          result_limit?: number
          result_offset?: number
          search_query?: string
          severity_filter?: string[]
          sort_by?: string
          source_filter?: string
          web3_incidents_only?: boolean
        }
        Returns: {
          affected_technologies: string[]
          author: string
          category: string
          content: string
          cve_id: string
          id: string
          is_processed: boolean
          link: string
          metadata: Json
          published_at: string
          rank: number
          severity: string
          source_name: string
          source_url: string
          summary: string
          tags: string[]
          title: string
        }[]
      }
      threat_intel_stats: {
        Args: {
          category_filter?: string[]
          date_from?: string
          search_query?: string
          severity_filter?: string[]
          source_filter?: string
          web3_incidents_only?: boolean
        }
        Returns: Json
      }
```

- [ ] **Step 7: Write the failing cache and hook tests**

Replace the full contents of `src/utils/__tests__/newsCache.test.ts` with:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildFilterKey,
  buildStatsFilterKey,
  saveToCache,
  loadFromCache,
  saveStatsToCache,
  loadStatsFromCache,
} from '../newsCache';
import type { ThreatIntelStats } from '@/lib/threatIntel/query';

// Mock localStorage
const store: Record<string, string> = {};
beforeEach(() => {
  Object.keys(store).forEach(k => delete store[k]);
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
    },
    writable: true,
  });
});

const stats: ThreatIntelStats = {
  total: 100, critical: 5, high: 20, medium: 30, low: 25, info: 20, supplyChain: 3, unconfirmed: 2,
};

describe('buildFilterKey', () => {
  it('produces stable keys for same inputs', () => {
    const key1 = buildFilterKey({ scope: 'all', categories: ['web3-security'], page: 1 });
    const key2 = buildFilterKey({ scope: 'all', categories: ['web3-security'], page: 1 });
    expect(key1).toBe(key2);
  });

  it('sorts categories for determinism', () => {
    const key1 = buildFilterKey({ scope: 'all', categories: ['a', 'b'] });
    const key2 = buildFilterKey({ scope: 'all', categories: ['b', 'a'] });
    expect(key1).toBe(key2);
  });

  it('does not mutate filter arrays while building a key', () => {
    const categories = ['web3-security', 'operational-security'];
    const severities = ['medium', 'critical'];
    buildFilterKey({ scope: 'all', categories, severities });
    expect(categories).toEqual(['web3-security', 'operational-security']);
    expect(severities).toEqual(['medium', 'critical']);
  });

  it('produces different keys for different filters', () => {
    const key1 = buildFilterKey({ scope: 'all', categories: ['web3-security'] });
    const key2 = buildFilterKey({ scope: 'all', categories: ['operational-security'] });
    expect(key1).not.toBe(key2);
  });

  it('produces different keys for different pages', () => {
    expect(buildFilterKey({ scope: 'all', page: 1 })).not.toBe(buildFilterKey({ scope: 'all', page: 2 }));
  });

  it('produces different keys for the Web3 and all-news scopes', () => {
    expect(buildFilterKey({ scope: 'web3-incidents' })).not.toBe(buildFilterKey({ scope: 'all' }));
  });

  it('defaults missing fields', () => {
    const key = buildFilterKey({ scope: 'all' });
    expect(key).toContain('"q":""');
    expect(key).toContain('"p":1');
    expect(key).toContain('"sc":"all"');
  });
});

describe('buildStatsFilterKey', () => {
  it('ignores page and sort because stats cover the whole result', () => {
    expect(buildStatsFilterKey({ scope: 'all', page: 3, sortBy: 'severity' }))
      .toBe(buildStatsFilterKey({ scope: 'all', page: 1, sortBy: 'date' }));
  });
});

describe('saveToCache / loadFromCache', () => {
  it('round-trips articles correctly', () => {
    const articles = [
      { id: '1', title: 'Test', publishedAt: new Date('2025-01-01') } as any,
    ];
    const filterKey = buildFilterKey({ scope: 'all' });
    saveToCache(articles, 1, filterKey);

    const result = loadFromCache(filterKey);
    expect(result).not.toBeNull();
    expect(result!.articles).toHaveLength(1);
    expect(result!.totalCount).toBe(1);
    expect(result!.articles[0].title).toBe('Test');
    expect(result!.cachedAt).toBeInstanceOf(Date);
    expect(result!.isStale).toBe(false);
  });

  it('returns null for mismatched filter key', () => {
    const articles = [{ id: '1', title: 'Test', publishedAt: new Date() } as any];
    saveToCache(articles, 1, 'key-a');
    expect(loadFromCache('key-b')).toBeNull();
  });

  it('returns null when nothing cached', () => {
    expect(loadFromCache('any-key')).toBeNull();
  });
});

describe('saveStatsToCache / loadStatsFromCache', () => {
  it('round-trips stats for the same filter set', () => {
    const key = buildStatsFilterKey({ scope: 'all' });
    saveStatsToCache(stats, key);
    expect(loadStatsFromCache(key)).toEqual(stats);
  });

  it('returns null when nothing cached', () => {
    expect(loadStatsFromCache(buildStatsFilterKey({ scope: 'all' }))).toBeNull();
  });

  it('does not leak Web3 view stats into the all-news view', () => {
    saveStatsToCache(stats, buildStatsFilterKey({ scope: 'web3-incidents' }));
    expect(loadStatsFromCache(buildStatsFilterKey({ scope: 'all' }))).toBeNull();
  });

  it('drops the legacy global v2 entries', () => {
    store.digibastion_news_stats_v2 = '{"total":9}';
    store.digibastion_news_cache_v2 = '{}';
    saveStatsToCache(stats, buildStatsFilterKey({ scope: 'all' }));
    expect(store.digibastion_news_stats_v2).toBeUndefined();
    expect(store.digibastion_news_cache_v2).toBeUndefined();
  });
});
```

Create `src/hooks/__tests__/useNewsArticles.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewsArticles } from '@/hooks/useNewsArticles';

const db = vi.hoisted(() => {
  type Result = { data: unknown; error: unknown; count?: number | null };
  const makeChain = (result: Result) => {
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'neq', 'in', 'or', 'gte', 'order', 'range', 'limit', 'maybeSingle']) {
      chain[method] = vi.fn(() => chain);
    }
    chain.then = (resolve: (value: Result) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject);
    return chain;
  };
  return { makeChain, from: vi.fn(), rpc: vi.fn() };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: db.from, rpc: db.rpc, functions: { invoke: vi.fn() } },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const row = (id: string, severity: string, metadata: Record<string, unknown> = {}) => ({
  id,
  title: `Incident ${id}`,
  summary: 'Summary',
  content: 'Body',
  category: 'web3-security',
  severity,
  tags: [],
  affected_technologies: [],
  link: null,
  source_url: null,
  source_name: 'QuillMonitor',
  author: null,
  cve_id: null,
  published_at: '2026-10-01T00:00:00Z',
  is_processed: false,
  metadata,
});

const serverStats = {
  total: 57, critical: 9, high: 14, medium: 20, low: 10, info: 4, supply_chain: 3, unconfirmed: 2,
};

describe('useNewsArticles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    db.from.mockImplementation(() => db.makeChain({ data: [], error: null, count: 0 }));
    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') {
        return { data: [row('a', 'critical'), row('b', 'high', { duplicate_of_uid: 'quillmonitor:1' })], error: null };
      }
      if (name === 'threat_intel_stats') return { data: serverStats, error: null };
      if (name === 'count_news_articles') return { data: 2, error: null };
      return { data: null, error: { message: `unexpected rpc ${name}` } };
    });
  });

  afterEach(cleanup);

  it('sorts by severity on the server and reports whole-result stats', async () => {
    const { result } = renderHook(() => useNewsArticles({ view: 'all', sortBy: 'severity', page: 1, pageSize: 20 }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.rpc).toHaveBeenCalledWith('search_news_articles', expect.objectContaining({
      sort_by: 'severity',
      web3_incidents_only: false,
      result_limit: 20,
      result_offset: 0,
    }));
    expect(db.rpc).toHaveBeenCalledWith('threat_intel_stats', expect.objectContaining({ web3_incidents_only: false }));
    expect(result.current.articles.map((article) => article.id)).toEqual(['a']);
    expect(result.current.stats).toEqual({
      total: 57, critical: 9, high: 14, medium: 20, low: 10, info: 4, supplyChain: 3, unconfirmed: 2,
    });
    expect(result.current.statsSource).toBe('server');
    expect(result.current.pagination.totalCount).toBe(57);
  });

  it('falls back to page stats and the count RPC when the stats RPC fails', async () => {
    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') {
        return { data: [row('a', 'critical'), row('b', 'high', { duplicate_of_uid: 'quillmonitor:1' })], error: null };
      }
      if (name === 'count_news_articles') return { data: 2, error: null };
      return { data: null, error: { message: 'function threat_intel_stats does not exist' } };
    });

    const { result } = renderHook(() => useNewsArticles({ view: 'web3-incidents' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.statsSource).toBe('page');
    expect(result.current.stats.critical).toBe(1);
    expect(result.current.pagination.totalCount).toBe(2);
  });

  it('keeps plain newest-first browsing of all news on the direct table query', async () => {
    const { result } = renderHook(() => useNewsArticles({ view: 'all', sortBy: 'date' }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.from).toHaveBeenCalledWith('news_articles');
    expect(db.rpc).not.toHaveBeenCalledWith('search_news_articles', expect.anything());
    expect(result.current.stats.total).toBe(57);
  });
});
```

Run: `rtk proxy npx vitest run src/utils/__tests__/newsCache.test.ts src/hooks/__tests__/useNewsArticles.test.tsx`

Expected: FAIL. `newsCache.test.ts` fails on `buildStatsFilterKey is not a function` and the leak test; `useNewsArticles.test.tsx` fails because `search_news_articles` is never called with `sort_by` and `result.current.statsSource` is `undefined`.

- [ ] **Step 8: Replace `newsCache.ts`**

Replace the full contents of `src/utils/newsCache.ts` with:

```ts
import type { NewsArticle, ThreatIntelScope } from '@/types/news';
import type { ThreatIntelStats } from '@/lib/threatIntel/query';

// v3: every key carries an explicit scope, and stats are cached per filter
// set. The v2 stats entry was global, so a Web3-only visit seeded the counts
// shown on unrelated URLs (for example /threat-intel?tab=subscribe).
const CACHE_KEY = 'digibastion_news_cache_v3';
const STATS_KEY = 'digibastion_news_stats_v3';
const LEGACY_KEYS = ['digibastion_news_cache_v2', 'digibastion_news_stats_v2'] as const;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes: after this we still show cache but mark it stale

interface CachedData {
  articles: NewsArticle[];
  totalCount: number;
  timestamp: number;
  /** A fingerprint of the filters used so we don't serve wrong-filter cache */
  filterKey: string;
}

interface CachedStats {
  stats: ThreatIntelStats;
  timestamp: number;
  filterKey: string;
}

export interface CacheFilterInput {
  scope: ThreatIntelScope;
  categories?: readonly string[];
  severities?: readonly string[];
  searchQuery?: string;
  dateFilter?: string;
  sortBy?: string;
  source?: string;
  page?: number;
}

/** Build a stable key from filter options so cache only matches the same query. */
export function buildFilterKey(opts: CacheFilterInput): string {
  return JSON.stringify({
    sc: opts.scope,
    c: opts.categories ? [...opts.categories].sort() : [],
    s: opts.severities ? [...opts.severities].sort() : [],
    q: opts.searchQuery ?? '',
    d: opts.dateFilter ?? 'all',
    sb: opts.sortBy ?? 'date',
    src: opts.source ?? 'all',
    p: opts.page ?? 1,
  });
}

/** Stats describe the whole filtered result, so page and sort are not part of their key. */
export function buildStatsFilterKey(opts: CacheFilterInput): string {
  return buildFilterKey({ ...opts, sortBy: 'date', page: 1 });
}

function dropLegacyEntries(): void {
  for (const key of LEGACY_KEYS) localStorage.removeItem(key);
}

export function saveToCache(
  articles: NewsArticle[],
  totalCount: number,
  filterKey: string,
): void {
  try {
    dropLegacyEntries();
    const payload: CachedData = {
      articles,
      totalCount,
      timestamp: Date.now(),
      filterKey,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage might be full or unavailable – silently ignore
  }
}

export function loadFromCache(filterKey: string): {
  articles: NewsArticle[];
  totalCount: number;
  isStale: boolean;
  cachedAt: Date;
} | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data: CachedData = JSON.parse(raw);

    // Only return cache if filters match (prevents showing wrong data)
    if (data.filterKey !== filterKey) return null;

    // Re-hydrate Date objects
    const articles: NewsArticle[] = data.articles.map((a) => ({
      ...a,
      publishedAt: new Date(a.publishedAt),
    }));

    const isStale = Date.now() - data.timestamp > CACHE_TTL_MS;

    return { articles, totalCount: data.totalCount, isStale, cachedAt: new Date(data.timestamp) };
  } catch {
    return null;
  }
}

function readCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/** Save whole-result stats for one filter set (see buildStatsFilterKey). */
export function saveStatsToCache(stats: ThreatIntelStats, filterKey: string): void {
  try {
    dropLegacyEntries();
    const payload: CachedStats = { stats, filterKey, timestamp: Date.now() };
    localStorage.setItem(STATS_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadStatsFromCache(filterKey: string): ThreatIntelStats | null {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<CachedStats>;
    if (data.filterKey !== filterKey || typeof data.stats !== 'object' || data.stats === null) return null;
    const stats = data.stats as unknown as Record<string, unknown>;
    return {
      total: readCount(stats.total),
      critical: readCount(stats.critical),
      high: readCount(stats.high),
      medium: readCount(stats.medium),
      low: readCount(stats.low),
      info: readCount(stats.info),
      supplyChain: readCount(stats.supplyChain),
      unconfirmed: readCount(stats.unconfirmed),
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 9: Replace `useNewsArticles.ts`**

Replace the full contents of `src/hooks/useNewsArticles.ts` with:

```ts
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle, NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';
import { useToast } from '@/hooks/use-toast';
import {
  buildFilterKey,
  buildStatsFilterKey,
  loadFromCache,
  loadStatsFromCache,
  saveStatsToCache,
  saveToCache,
  type CacheFilterInput,
} from '@/utils/newsCache';
import { summarizeFeedFreshness } from '@/utils/feedFreshness';
import {
  buildCategoryPostgrestFilter,
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  WEB3_INCIDENT_POSTGREST_FILTER,
} from '@/utils/newsIncident';
import {
  isPublishable,
  mapPublishableNewsArticleRows,
  NEWS_ARTICLE_COLUMNS,
} from '@/lib/threatIntel/articleRow';
import { DEFAULT_SCOPE } from '@/lib/threatIntel/taxonomy';
import {
  buildThreatIntelFilterParams,
  buildThreatIntelQueryParams,
  computePageStats,
  DEFAULT_PAGE_SIZE,
  EMPTY_THREAT_INTEL_STATS,
  parseThreatIntelStats,
  requiresThreatIntelRpc,
  type DateFilter,
  type SortBy,
  type ThreatIntelFilterParams,
  type ThreatIntelFilters,
  type ThreatIntelStats,
} from '@/lib/threatIntel/query';

interface UseNewsArticlesOptions {
  categories?: NewsCategory[];
  severities?: SeverityLevel[];
  searchQuery?: string;
  dateFilter?: DateFilter;
  sortBy?: SortBy;
  view?: ThreatIntelScope;
  page?: number;
  pageSize?: number;
}

/**
 * 'server': stats cover the whole filtered result (threat_intel_stats).
 * 'page': the stats RPC failed and counts describe only the loaded page.
 */
export type StatsSource = 'server' | 'page';

interface FeedStatus {
  source: 'loading' | 'live' | 'cache';
  isStale: boolean;
  checkedAt: Date | null;
  activeFeedCount: number;
  checkedFeedCount: number;
  pipelineCheckedAt: Date | null;
  pipelineIsStale: boolean;
  newestPublishedAt: Date | null;
}

interface UseNewsArticlesResult {
  articles: NewsArticle[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refreshFromRSS: () => Promise<void>;
  refreshWeb3Incidents: () => Promise<void>;
  summarizeArticles: () => Promise<void>;
  isRefreshing: boolean;
  isRefreshingWeb3: boolean;
  isSummarizing: boolean;
  feedStatus: FeedStatus;
  stats: ThreatIntelStats;
  statsSource: StatsSource;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const sanitizePostgrestSearchTerm = (value: string): string => value
  .replace(/[,%_*()"'\\]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const emptyFeedFreshness = {
  activeFeedCount: 0,
  checkedFeedCount: 0,
  pipelineCheckedAt: null as Date | null,
  pipelineIsStale: true,
  newestPublishedAt: null as Date | null,
};

async function fetchFeedFreshness() {
  try {
    const [feedsResult, latestArticleResult] = await Promise.all([
      supabase
        .from('rss_feeds')
        .select('last_fetched_at')
        .eq('is_active', true),
      supabase
        .from('news_articles')
        .select('published_at')
        .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (feedsResult.error) throw feedsResult.error;
    if (latestArticleResult.error) throw latestArticleResult.error;

    const feedSummary = summarizeFeedFreshness(feedsResult.data || []);
    const newestPublishedAt = latestArticleResult.data?.published_at
      ? new Date(latestArticleResult.data.published_at)
      : null;

    return { ...feedSummary, newestPublishedAt };
  } catch (freshnessError) {
    console.warn('Unable to load threat-feed freshness metadata:', freshnessError);
    return emptyFeedFreshness;
  }
}

async function fetchThreatIntelStats(params: ThreatIntelFilterParams): Promise<ThreatIntelStats | null> {
  try {
    const { data, error } = await supabase.rpc('threat_intel_stats', params);
    if (error) {
      console.warn('Unable to load threat-intel stats; falling back to page counts:', error);
      return null;
    }
    return parseThreatIntelStats(data);
  } catch (statsError) {
    console.warn('Unable to load threat-intel stats; falling back to page counts:', statsError);
    return null;
  }
}

function toCacheInput(filters: ThreatIntelFilters): CacheFilterInput {
  return {
    scope: filters.scope,
    categories: filters.categories,
    severities: filters.severities,
    searchQuery: filters.searchQuery,
    dateFilter: filters.dateFilter,
    sortBy: filters.sortBy,
    page: filters.page,
  };
}

/** Lower bound for the result count when only one page is known. */
function countFloor(offset: number, rowCount: number, pageSize: number): number {
  return offset + rowCount + (rowCount === pageSize ? 1 : 0);
}

export function useNewsArticles(options: UseNewsArticlesOptions = {}): UseNewsArticlesResult {
  const {
    categories,
    severities,
    searchQuery = '',
    dateFilter = 'all',
    sortBy = 'date',
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    view = DEFAULT_SCOPE,
  } = options;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingWeb3, setIsRefreshingWeb3] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState<ThreatIntelStats>(EMPTY_THREAT_INTEL_STATS);
  const [statsSource, setStatsSource] = useState<StatsSource>('page');
  const [feedStatus, setFeedStatus] = useState<FeedStatus>({
    source: 'loading',
    isStale: false,
    checkedAt: null,
    ...emptyFeedFreshness,
  });
  const { toast } = useToast();
  const cacheInitialised = useRef(false);
  const latestRequest = useRef(0);

  // Callers rebuild their filter arrays on every URL change, including tab
  // switches. Key the query on the array contents so identical filters do not
  // refetch, and so `refetch` keeps a stable identity.
  const categoriesKey = (categories ?? []).join(',');
  const severitiesKey = (severities ?? []).join(',');
  const filters = useMemo<ThreatIntelFilters>(() => ({
    scope: view,
    categories: categoriesKey ? (categoriesKey.split(',') as NewsCategory[]) : [],
    severities: severitiesKey ? (severitiesKey.split(',') as SeverityLevel[]) : [],
    searchQuery,
    dateFilter,
    sortBy,
    page,
    pageSize,
  }), [view, categoriesKey, severitiesKey, searchQuery, dateFilter, sortBy, page, pageSize]);

  // Hydrate from cache on first mount so the page is never blank.
  useEffect(() => {
    if (cacheInitialised.current) return;
    cacheInitialised.current = true;
    const cacheInput = toCacheInput(filters);

    const cached = loadFromCache(buildFilterKey(cacheInput));
    if (cached) {
      setArticles(cached.articles.filter((article) => isPublishable(article.metadata)));
      setTotalCount(cached.totalCount);
      setFeedStatus({
        source: 'cache',
        isStale: cached.isStale,
        checkedAt: cached.cachedAt,
        ...emptyFeedFreshness,
      });
    }

    const cachedStats = loadStatsFromCache(buildStatsFilterKey(cacheInput));
    if (cachedStats) {
      setStats(cachedStats);
      setStatsSource('server');
      if (!cached) setTotalCount(cachedStats.total);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchArticles = useCallback(async () => {
    const requestId = ++latestRequest.current;
    // A slower response for an older filter set must not overwrite a newer one.
    const isCurrent = () => requestId === latestRequest.current;

    const now = new Date();
    const filterParams = buildThreatIntelFilterParams(filters, now);
    const queryParams = buildThreatIntelQueryParams(filters, now);
    const cacheInput = toCacheInput(filters);
    const filterKey = buildFilterKey(cacheInput);
    const statsKey = buildStatsFilterKey(cacheInput);
    const offset = queryParams.result_offset;
    const limit = queryParams.result_limit;
    const categoryOrFilter = filterParams.category_filter
      ? buildCategoryPostgrestFilter(filterParams.category_filter)
      : null;

    const feedFreshnessPromise = fetchFeedFreshness();
    // Stats run in parallel with the page query; they never block the list.
    const statsPromise = fetchThreatIntelStats(filterParams);

    const applyStats = (
      serverStats: ThreatIntelStats | null,
      pageArticles: NewsArticle[],
      fallbackTotal: number,
      rawRowCount: number,
    ): number => {
      if (serverStats) {
        const total = Math.max(serverStats.total, countFloor(offset, rawRowCount, limit));
        const resolved = { ...serverStats, total };
        setStats(resolved);
        setStatsSource('server');
        saveStatsToCache(resolved, statsKey);
        return total;
      }
      setStats(computePageStats(pageArticles, fallbackTotal));
      setStatsSource('page');
      return fallbackTotal;
    };

    try {
      setIsLoading(true);
      setError(null);

      let rows: unknown[] | null = null;
      let fetchError: { message?: string } | null = null;
      let queryCount: number | null = null;
      const useRpc = requiresThreatIntelRpc(filters);

      if (!useRpc) {
        // Plain newest-first browsing stays on the indexed table query. The
        // estimated count is exact for small results and planner-based for
        // large ones; threat_intel_stats supplies the exact total.
        let query = supabase
          .from('news_articles')
          .select(NEWS_ARTICLE_COLUMNS, { count: 'estimated' })
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (categoryOrFilter) query = query.or(categoryOrFilter);
        else if (filterParams.category_filter) query = query.in('category', filterParams.category_filter);
        if (filterParams.severity_filter) query = query.in('severity', filterParams.severity_filter);
        if (filterParams.date_from) query = query.gte('published_at', filterParams.date_from);
        const directResult = await query;
        rows = directResult.data;
        fetchError = directResult.error;
        queryCount = directResult.count;
      } else {
        // Search ranking, metadata predicates and severity ordering all run in
        // the database so ordering is correct across pages.
        const rpcResult = await supabase.rpc('search_news_articles', queryParams);
        rows = rpcResult.data;
        fetchError = rpcResult.error;
      }
      if (!isCurrent()) return;

      if (fetchError) {
        console.error('Primary threat-feed query failed, retrying without a count:', fetchError);
        // Narrow direct query with public card/detail columns only. Ordering
        // falls back to newest first.
        let query = supabase
          .from('news_articles')
          .select(NEWS_ARTICLE_COLUMNS)
          .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
          .order('published_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (categoryOrFilter) query = query.or(categoryOrFilter);
        else if (filterParams.category_filter) query = query.in('category', filterParams.category_filter);
        if (filterParams.severity_filter) query = query.in('severity', filterParams.severity_filter);
        if (filterParams.date_from) query = query.gte('published_at', filterParams.date_from);
        if (filterParams.web3_incidents_only) query = query.or(WEB3_INCIDENT_POSTGREST_FILTER);
        if (filterParams.search_query) {
          const safeSearchTerm = sanitizePostgrestSearchTerm(filterParams.search_query);
          if (safeSearchTerm) {
            query = query.or(`title.ilike.%${safeSearchTerm}%,summary.ilike.%${safeSearchTerm}%`);
          }
        }

        const { data: fallbackData, error: fallbackError } = await query;
        if (fallbackError) throw fallbackError;
        const fallbackRows = fallbackData ?? [];
        const fallbackArticles = mapPublishableNewsArticleRows(fallbackRows);
        const serverStats = await statsPromise;
        if (!isCurrent()) return;

        const resolvedCount = applyStats(
          serverStats,
          fallbackArticles,
          countFloor(offset, fallbackRows.length, limit),
          fallbackRows.length,
        );
        setTotalCount(resolvedCount);
        setArticles(fallbackArticles);
        const freshness = await feedFreshnessPromise;
        if (!isCurrent()) return;
        setFeedStatus({ source: 'live', isStale: false, checkedAt: new Date(), ...freshness });
        saveToCache(fallbackArticles, resolvedCount, filterKey);
        return;
      }

      const pageRows = rows ?? [];
      const pageArticles = mapPublishableNewsArticleRows(pageRows);
      const serverStats = await statsPromise;
      if (!isCurrent()) return;

      let fallbackTotal = queryCount ?? countFloor(offset, pageRows.length, limit);
      if (!serverStats && useRpc) {
        // Stats are unavailable (for example before the migration is applied):
        // keep pagination correct with the count RPC.
        const { data: countData, error: countError } = await supabase.rpc('count_news_articles', filterParams);
        if (!isCurrent()) return;
        if (countError) console.warn('Unable to load the complete threat-intel count:', countError);
        else fallbackTotal = Math.max(Number(countData) || 0, fallbackTotal);
      }

      const resolvedCount = applyStats(serverStats, pageArticles, fallbackTotal, pageRows.length);
      setTotalCount(resolvedCount);
      setArticles(pageArticles);
      const freshness = await feedFreshnessPromise;
      if (!isCurrent()) return;
      setFeedStatus({ source: 'live', isStale: false, checkedAt: new Date(), ...freshness });

      // Persist to cache for offline / error fallback
      saveToCache(pageArticles, resolvedCount, filterKey);
    } catch (err) {
      console.error('Error fetching news articles:', err);
      const freshness = await feedFreshnessPromise;
      if (!isCurrent()) return;

      // Attempt to serve cached data instead of showing an empty page
      const cached = loadFromCache(filterKey);
      if (cached && cached.articles.length > 0) {
        const cachedArticles = cached.articles.filter((article) => isPublishable(article.metadata));
        setArticles(cachedArticles);
        setTotalCount(cached.totalCount);
        const cachedStats = loadStatsFromCache(statsKey);
        if (cachedStats) {
          setStats(cachedStats);
          setStatsSource('server');
        } else {
          setStats(computePageStats(cachedArticles, cached.totalCount));
          setStatsSource('page');
        }
        setFeedStatus({
          source: 'cache',
          isStale: cached.isStale,
          checkedAt: cached.cachedAt,
          ...freshness,
        });
        setError(err instanceof Error ? err : new Error('Failed to refresh articles'));
        console.info('Serving cached news data due to fetch error');
      } else {
        setArticles([]);
        setTotalCount(0);
        setStats(EMPTY_THREAT_INTEL_STATS);
        setStatsSource('page');
        setFeedStatus({ source: 'live', isStale: false, checkedAt: null, ...freshness });
        setError(err instanceof Error ? err : new Error('Failed to fetch articles'));
      }
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [filters]);

  const refreshFromRSS = useCallback(async () => {
    try {
      setIsRefreshing(true);

      const { data, error: fetchError } = await supabase.functions.invoke('fetch-rss-news');

      if (fetchError) {
        throw fetchError;
      }

      if (data?.success) {
        toast({
          title: data.partial ? 'News updated with warnings' : 'News updated',
          description: `Found ${data.articlesFound} articles, ${data.articlesInserted} new.${data.partial ? ' Review ingestion health for provider or write errors.' : ''}`,
        });
        await fetchArticles();
      } else {
        throw new Error(data?.error || 'Failed to refresh news');
      }
    } catch (err) {
      console.error('Error refreshing from RSS:', err);
      toast({
        title: 'Refresh Failed',
        description: err instanceof Error ? err.message : 'Failed to refresh news feed',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchArticles, toast]);

  const refreshWeb3Incidents = useCallback(async () => {
    try {
      setIsRefreshingWeb3(true);

      const [collector, partner] = await Promise.allSettled([
        supabase.functions.invoke('fetch-web3-incidents'),
        supabase.functions.invoke('fetch-quillmonitor-incidents'),
      ]);
      const outcomes = [collector, partner].map((result) => result.status === 'fulfilled' && !result.value.error && result.value.data?.success);
      if (!outcomes.some(Boolean)) throw new Error('Both Web3 incident sources failed');
      toast({ title: 'Web3 Incidents Updated', description: outcomes.every(Boolean) ? 'All incident sources refreshed.' : 'One source refreshed; one needs attention in Admin Health.' });
      await fetchArticles();
    } catch (err) {
      console.error('Error fetching Web3 incidents:', err);
      toast({
        title: 'Web3 Fetch Failed',
        description: err instanceof Error ? err.message : 'Failed to fetch Web3 incidents',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshingWeb3(false);
    }
  }, [fetchArticles, toast]);

  const summarizeArticles = useCallback(async () => {
    try {
      setIsSummarizing(true);

      const { data, error: summarizeError } = await supabase.functions.invoke('summarize-article', {
        body: { limit: 10 }
      });

      if (summarizeError) {
        throw summarizeError;
      }

      if (data?.success) {
        toast({
          title: 'AI Summarization Complete',
          description: `Processed ${data.processed} articles${data.failed > 0 ? `, ${data.failed} failed` : ''}.`,
        });
        await fetchArticles();
      } else {
        throw new Error(data?.error || 'Failed to summarize articles');
      }
    } catch (err) {
      console.error('Error summarizing articles:', err);
      toast({
        title: 'Summarization Failed',
        description: err instanceof Error ? err.message : 'Failed to generate AI summaries',
        variant: 'destructive',
      });
    } finally {
      setIsSummarizing(false);
    }
  }, [fetchArticles, toast]);

  useEffect(() => {
    void fetchArticles();
  }, [fetchArticles]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const pagination = {
    currentPage: page,
    totalPages,
    totalCount,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  return {
    articles,
    isLoading,
    error,
    refetch: fetchArticles,
    refreshFromRSS,
    refreshWeb3Incidents,
    summarizeArticles,
    isRefreshing,
    isRefreshingWeb3,
    isSummarizing,
    feedStatus,
    stats,
    statsSource,
    pagination,
  };
}
```

- [ ] **Step 10: Show whole-view stats in News.tsx**

In `src/pages/News.tsx`, replace:

```tsx
    stats,
    pagination
  } = useNewsArticles({
```

with:

```tsx
    stats,
    statsSource,
    pagination
  } = useNewsArticles({
```

Replace the stats banner (old lines 548-578), from:

```tsx
          {/* Quick Stats Banner - Compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
```

through the matching closing `</div>` that precedes `{/* Enhanced Tab Navigation - More Visible */}`, i.e. this whole block:

```tsx
          {/* Quick Stats Banner - Compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-red-400">{stats.critical}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Critical <span className="hidden sm:inline">Severity</span></div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">current view</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-orange-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-orange-400">{stats.high}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">High <span className="hidden sm:inline">Severity</span></div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">current view</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-purple-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-purple-400">{stats.supplyChain}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Supply Chain</div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">current view</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-blue-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Total Articles</div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">all time</div>
              </CardContent>
            </Card>
          </div>
```

with:

```tsx
          {/* Stats Banner - counts cover the whole filtered result (threat_intel_stats) */}
          {isLoading && stats.total === 0 ? (
            <div className="mb-6">
              <StatsSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              <Card className="glass-card border-red-500/20">
                <CardContent className="p-2 sm:p-3 text-center">
                  <div className={`text-lg sm:text-xl font-bold ${SEVERITY_STYLES.critical.textClass}`}>{stats.critical}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Critical <span className="hidden sm:inline">Severity</span></div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">{statsCaption}</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-orange-500/20">
                <CardContent className="p-2 sm:p-3 text-center">
                  <div className={`text-lg sm:text-xl font-bold ${SEVERITY_STYLES.high.textClass}`}>{stats.high}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">High <span className="hidden sm:inline">Severity</span></div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">{statsCaption}</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-purple-500/20">
                <CardContent className="p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-xl font-bold text-purple-400">{stats.supplyChain}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Supply Chain</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">{statsCaption}</div>
                </CardContent>
              </Card>
              <Card className="glass-card border-blue-500/20">
                <CardContent className="p-2 sm:p-3 text-center">
                  <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.total}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">Total Articles</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">{statsCaption}</div>
                </CardContent>
              </Card>
            </div>
          )}
```

Replace:

```tsx
  // Tab configuration with better visibility
  const tabs = [
```

with:

```tsx
  // Tiles say "in this view" only when the server counted the whole result.
  const statsCaption = statsSource === 'server' ? 'in this view' : 'on this page';

  // Tab configuration with better visibility
  const tabs = [
```

In `src/pages/__tests__/News.navigation.test.tsx`, replace:

```tsx
    stats: { total: 1, critical: 0, high: 1, supplyChain: 0, aiSummarized: 0, web3Incidents: 0 },
```

with:

```tsx
    stats: { total: 1, critical: 0, high: 1, medium: 0, low: 0, info: 0, supplyChain: 0, unconfirmed: 0 },
    statsSource: 'server',
```

- [ ] **Step 11: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/threatIntelQuery.test.ts src/utils/__tests__/newsCache.test.ts src/hooks/__tests__/useNewsArticles.test.tsx src/pages/__tests__/News.navigation.test.tsx`

Expected: PASS.

Then `npx tsc --noEmit -p tsconfig.app.json` (no errors; this also checks the `supabase.rpc('threat_intel_stats', ...)` and `sort_by` typings) and `npx eslint src/lib/threatIntel/query.ts src/utils/newsCache.ts src/hooks/useNewsArticles.ts src/pages/News.tsx src/integrations/supabase/types.ts` (0 errors). Confirm the page-only sort is gone: `rtk proxy grep -n "severityOrder" src/hooks/useNewsArticles.ts` prints nothing.

- [ ] **Step 12: Commit**

```bash
git add supabase/migrations/20261011090000_threat_intel_stats.sql src/lib/threatIntel/query.ts \
  src/integrations/supabase/types.ts src/utils/newsCache.ts src/hooks/useNewsArticles.ts \
  src/pages/News.tsx src/utils/__tests__/threatIntelQuery.test.ts \
  src/utils/__tests__/newsCache.test.ts src/hooks/__tests__/useNewsArticles.test.tsx \
  src/pages/__tests__/News.navigation.test.tsx
git commit -m "feat(threat-intel): server-side stats and severity sort

threat_intel_stats returns counts for the whole filtered result, and
search_news_articles sorts by severity before paging. Stat tiles now say
'in this view', duplicates are excluded server-side, and the stats cache
is keyed by scope and filters so views no longer leak counts."
```

---

### Task B4: Alerts tab follows scope and filters, with pagination

**Files:**
- Create: `src/hooks/useThreatIntelAlerts.ts`
- Modify: `src/pages/News.tsx` (old lines 24-37 imports, 85-88 state, 198-249 alerts fetch, 355-364 auto-refresh, 391-401 memos, 421-430 realtime and tab count, 738 Web3 refresh button, 968, 982-987, 1058-1063, 1128-1135)
- Test: `src/hooks/__tests__/useThreatIntelAlerts.test.tsx` (new), `src/pages/__tests__/News.navigation.test.tsx`

**Interfaces:**
- Consumes: `buildAlertQueryParams`, `parseThreatIntelStats`, `ALERTS_PAGE_SIZE`, `ThreatIntelFilterInput` (B3); `mapPublishableNewsArticleRows` (B2); RPCs `search_news_articles` and `threat_intel_stats` (B3).
- Produces: `useThreatIntelAlerts({ filters: ThreatIntelFilterInput; page: number; enabled: boolean }): UseThreatIntelAlertsResult` where `UseThreatIntelAlertsResult = { alerts: NewsArticle[]; totalCount: number; criticalCount: number; highCount: number; totalPages: number; isLoading: boolean; error: string | null; refetch: () => Promise<void> }`.
- The tab badge count comes from the feed stats (`stats.critical + stats.high`), which load with the page. The feed stats already apply the same scope and filters, so the badge equals the alerts total without opening the tab.

- [ ] **Step 1: Write the failing hook test**

Create `src/hooks/__tests__/useThreatIntelAlerts.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThreatIntelAlerts } from '@/hooks/useThreatIntelAlerts';
import type { ThreatIntelFilterInput } from '@/lib/threatIntel/query';

const db = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: db.rpc } }));

const filters: ThreatIntelFilterInput = {
  scope: 'web3-incidents',
  categories: [],
  severities: [],
  searchQuery: '',
  dateFilter: 'all',
};

const alertRow = (id: string, severity: string, metadata: Record<string, unknown> = {}) => ({
  id,
  title: `Alert ${id}`,
  summary: 'Summary',
  content: 'Body',
  category: 'web3-security',
  severity,
  tags: [],
  affected_technologies: [],
  link: null,
  source_url: null,
  source_name: 'QuillMonitor',
  author: null,
  cve_id: null,
  published_at: '2026-10-01T00:00:00Z',
  is_processed: false,
  metadata,
});

describe('useThreatIntelAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.rpc.mockImplementation(async (name: string) => {
      if (name === 'search_news_articles') {
        return {
          data: [
            alertRow('c1', 'critical'),
            alertRow('h1', 'high'),
            alertRow('d1', 'critical', { duplicate_of_uid: 'quillmonitor:9' }),
          ],
          error: null,
        };
      }
      if (name === 'threat_intel_stats') {
        return {
          data: { total: 45, critical: 12, high: 33, medium: 0, low: 0, info: 0, supply_chain: 0, unconfirmed: 4 },
          error: null,
        };
      }
      return { data: null, error: { message: 'unexpected rpc' } };
    });
  });

  afterEach(cleanup);

  it('does not query until enabled', () => {
    renderHook(() => useThreatIntelAlerts({ filters, page: 1, enabled: false }));
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('loads one page of critical and high alerts for the current scope and filters', async () => {
    const { result } = renderHook(() => useThreatIntelAlerts({ filters, page: 2, enabled: true }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.rpc).toHaveBeenCalledWith('search_news_articles', expect.objectContaining({
      severity_filter: ['critical', 'high'],
      web3_incidents_only: true,
      result_limit: 20,
      result_offset: 20,
      sort_by: 'date',
    }));
    expect(db.rpc).toHaveBeenCalledWith('threat_intel_stats', expect.objectContaining({
      severity_filter: ['critical', 'high'],
      web3_incidents_only: true,
    }));
    expect(result.current.alerts.map((alert) => alert.id)).toEqual(['c1', 'h1']);
    expect(result.current.totalCount).toBe(45);
    expect(result.current.criticalCount).toBe(12);
    expect(result.current.highCount).toBe(33);
    expect(result.current.totalPages).toBe(3);
  });

  it('skips the query when the severity filter excludes critical and high', async () => {
    const { result } = renderHook(() => useThreatIntelAlerts({
      filters: { ...filters, severities: ['medium'] },
      page: 1,
      enabled: true,
    }));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(db.rpc).not.toHaveBeenCalled();
    expect(result.current.alerts).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  it('reports an error when the alert query fails', async () => {
    db.rpc.mockImplementation(async (name: string) => (
      name === 'search_news_articles'
        ? { data: null, error: { message: 'boom' } }
        : { data: null, error: null }
    ));

    const { result } = renderHook(() => useThreatIntelAlerts({ filters, page: 1, enabled: true }));

    await waitFor(() => expect(result.current.error).toBe('Active alerts could not be loaded.'));
    expect(result.current.alerts).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `rtk proxy npx vitest run src/hooks/__tests__/useThreatIntelAlerts.test.tsx`

Expected: FAIL with `Failed to resolve import "@/hooks/useThreatIntelAlerts"`.

- [ ] **Step 3: Create the hook**

Create `src/hooks/useThreatIntelAlerts.ts`:

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NewsArticle } from '@/types/news';
import { mapPublishableNewsArticleRows } from '@/lib/threatIntel/articleRow';
import {
  ALERTS_PAGE_SIZE,
  buildAlertQueryParams,
  parseThreatIntelStats,
  type ThreatIntelFilterInput,
} from '@/lib/threatIntel/query';

interface UseThreatIntelAlertsOptions {
  /** The same scope and filters as the feed; severity is narrowed to critical/high. */
  filters: ThreatIntelFilterInput;
  page: number;
  /** Only query while the Alerts tab is open. */
  enabled: boolean;
}

export interface UseThreatIntelAlertsResult {
  alerts: NewsArticle[];
  totalCount: number;
  criticalCount: number;
  highCount: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const EMPTY_COUNTS = { total: 0, critical: 0, high: 0 };
const LOAD_ERROR = 'Active alerts could not be loaded.';

export function useThreatIntelAlerts({ filters, page, enabled }: UseThreatIntelAlertsOptions): UseThreatIntelAlertsResult {
  const [alerts, setAlerts] = useState<NewsArticle[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  // Callers rebuild the filters object on every render; key on its contents.
  const filtersKey = JSON.stringify(filters);
  const stableFilters = useMemo(() => JSON.parse(filtersKey) as ThreatIntelFilterInput, [filtersKey]);

  const refetch = useCallback(async () => {
    if (!enabled) return;
    const requestId = ++latestRequest.current;
    const isCurrent = () => requestId === latestRequest.current;

    const query = buildAlertQueryParams(stableFilters, page);
    if (!query) {
      setAlerts([]);
      setCounts(EMPTY_COUNTS);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [listResult, statsResult] = await Promise.all([
        supabase.rpc('search_news_articles', query.search),
        supabase.rpc('threat_intel_stats', query.filter),
      ]);
      if (!isCurrent()) return;

      if (listResult.error) {
        console.error('Failed to fetch active alerts:', listResult.error);
        setAlerts([]);
        setCounts(EMPTY_COUNTS);
        setError(LOAD_ERROR);
        return;
      }

      const rows = Array.isArray(listResult.data) ? listResult.data : [];
      const pageAlerts = mapPublishableNewsArticleRows(rows);
      const stats = statsResult.error ? null : parseThreatIntelStats(statsResult.data);
      setAlerts(pageAlerts);
      setCounts(stats
        ? { total: stats.total, critical: stats.critical, high: stats.high }
        : {
          total: query.search.result_offset + rows.length + (rows.length === ALERTS_PAGE_SIZE ? 1 : 0),
          critical: pageAlerts.filter((alert) => alert.severity === 'critical').length,
          high: pageAlerts.filter((alert) => alert.severity === 'high').length,
        });
    } catch (alertsError) {
      if (!isCurrent()) return;
      console.error('Failed to fetch active alerts:', alertsError);
      setAlerts([]);
      setCounts(EMPTY_COUNTS);
      setError(LOAD_ERROR);
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [enabled, stableFilters, page]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    alerts,
    totalCount: counts.total,
    criticalCount: counts.critical,
    highCount: counts.high,
    totalPages: Math.max(1, Math.ceil(counts.total / ALERTS_PAGE_SIZE)),
    isLoading,
    error,
    refetch,
  };
}
```

Run: `rtk proxy npx vitest run src/hooks/__tests__/useThreatIntelAlerts.test.tsx`

Expected: PASS.

- [ ] **Step 4: Write the failing page test**

In `src/pages/__tests__/News.navigation.test.tsx`, replace:

```tsx
vi.mock('@/components/news/NewsDetail', () => ({
  NewsDetail: ({ article: selected }: { article: NewsArticle }) => <div data-testid="article-detail">{selected.title}</div>,
}));
```

with:

```tsx
vi.mock('@/components/news/NewsDetail', () => ({
  NewsDetail: ({ article: selected }: { article: NewsArticle }) => <div data-testid="article-detail">{selected.title}</div>,
}));

const useThreatIntelAlertsMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useThreatIntelAlerts', () => ({
  useThreatIntelAlerts: (options: unknown) => useThreatIntelAlertsMock(options),
}));

vi.mock('@/components/news/NewsCardSkeleton', () => ({
  NewsListSkeleton: () => <div data-testid="news-skeleton" />,
  AlertListSkeleton: () => <div data-testid="alert-skeleton" />,
  StatsSkeleton: () => <div data-testid="stats-skeleton" />,
}));

const idleAlerts = {
  alerts: [],
  totalCount: 0,
  criticalCount: 0,
  highCount: 0,
  totalPages: 1,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};
```

Replace:

```tsx
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(deepLink.rows)) delete deepLink.rows[key];
  });
```

with:

```tsx
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(deepLink.rows)) delete deepLink.rows[key];
    useThreatIntelAlertsMock.mockReturnValue(idleAlerts);
  });
```

Replace the end of the file:

```tsx
    expect(deepLink.from).toHaveBeenCalledWith('news_articles');
  });
});
```

with:

```tsx
    expect(deepLink.from).toHaveBeenCalledWith('news_articles');
  });

  it('loads alerts for the selected scope and filters and shows a skeleton while loading', async () => {
    useThreatIntelAlertsMock.mockReturnValue({ ...idleAlerts, isLoading: true });

    renderAt('/threat-intel?tab=alerts&scope=all&categories=supply-chain&severities=critical');

    expect(await screen.findByTestId('alert-skeleton')).not.toBeNull();
    expect(useThreatIntelAlertsMock).toHaveBeenLastCalledWith({
      filters: {
        scope: 'all',
        categories: ['supply-chain'],
        severities: ['critical'],
        searchQuery: '',
        dateFilter: 'all',
      },
      page: 1,
      enabled: true,
    });
    // Badge = stats.critical + stats.high from the feed hook mock (0 + 1).
    const alertsTab = screen.getAllByText('Active Alerts')
      .map((element) => element.closest('button'))
      .find((button) => button !== null);
    expect(alertsTab?.textContent).toContain('1');
  });
});
```

Run: `rtk proxy npx vitest run src/pages/__tests__/News.navigation.test.tsx`

Expected: FAIL. `Unable to find an element by: [data-testid="alert-skeleton"]` (News still fetches alerts itself, and the mocked supabase client has no `.or`).

- [ ] **Step 5: Wire the hook into News.tsx**

In `src/pages/News.tsx`, replace:

```tsx
import { useNewsArticles } from '@/hooks/useNewsArticles';
```

with:

```tsx
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { useThreatIntelAlerts } from '@/hooks/useThreatIntelAlerts';
import type { ThreatIntelFilterInput } from '@/lib/threatIntel/query';
```

Replace:

```tsx
import {
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
} from '@/utils/newsIncident';
import {
  getDuplicateOfUid,
  isPublishable,
  mapNewsArticleRow,
  mapPublishableNewsArticleRows,
  NEWS_ARTICLE_COLUMNS,
} from '@/lib/threatIntel/articleRow';
```

with:

```tsx
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
} from '@/utils/newsIncident';
import {
  getDuplicateOfUid,
  isPublishable,
  mapNewsArticleRow,
  NEWS_ARTICLE_COLUMNS,
} from '@/lib/threatIntel/articleRow';
```

Replace:

```tsx
  const [activeAlerts, setActiveAlerts] = useState<NewsArticle[]>([]);
  const [activeAlertCount, setActiveAlertCount] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
```

with:

```tsx
  const [alertsPage, setAlertsPage] = useState(1);
```

Replace the alerts fetch and its effect (as left by Task B2):

```tsx
  const fetchActiveAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);
    const { data, error: alertsFetchError } = await supabase
      .from('news_articles')
      .select(NEWS_ARTICLE_COLUMNS)
      .or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)
      .in('severity', ['critical', 'high'])
      .order('published_at', { ascending: false })
      .limit(100);

    if (alertsFetchError) {
      console.error('Failed to fetch active alerts:', alertsFetchError);
      setAlertsError('Active alerts could not be loaded.');
      setAlertsLoading(false);
      return;
    }

    const alertRows = mapPublishableNewsArticleRows(data);
    setActiveAlerts(alertRows);
    setActiveAlertCount(alertRows.length);
    setAlertsLoading(false);
  }, []);

  useEffect(() => {
    if (selectedTab === 'alerts' && activeAlerts.length === 0) {
      void fetchActiveAlerts();
    }
  }, [selectedTab, activeAlerts.length, fetchActiveAlerts]);
```

with:

```tsx
  // Alerts follow the same view and filters as the feed (severity is narrowed
  // to critical/high inside the hook) and page 20 at a time.
  // Explicit type: without it `dateFilter` widens to string in the object literal.
  const alertFilters = useMemo<ThreatIntelFilterInput>(() => ({
    scope: feedView,
    categories: selectedCategories,
    severities: selectedSeverities,
    searchQuery,
    dateFilter,
  }), [feedView, selectedCategories, selectedSeverities, searchQuery, dateFilter]);
  const alertFiltersKey = JSON.stringify(alertFilters);

  // A different view or filter set starts the alert list from page 1.
  useEffect(() => {
    setAlertsPage(1);
  }, [alertFiltersKey]);

  const {
    alerts: activeAlerts,
    isLoading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts,
    criticalCount: alertsCriticalCount,
    highCount: alertsHighCount,
    totalPages: alertsTotalPages,
  } = useThreatIntelAlerts({
    filters: alertFilters,
    page: alertsPage,
    enabled: selectedTab === 'alerts',
  });
```

Replace (auto-refresh):

```tsx
      void fetchActiveAlerts();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [selectedTab, autoRefreshInterval, fetchActiveAlerts]);
```

with:

```tsx
      void refetchAlerts();
    }, autoRefreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [selectedTab, autoRefreshInterval, refetchAlerts]);
```

Replace:

```tsx
  const highAlerts = useMemo(() => {
    return activeAlerts.filter(article => article.severity === 'high');
  }, [activeAlerts]);

  const actionRequiredAlerts = useMemo(() => {
    return activeAlerts;
  }, [activeAlerts]);
```

with:

```tsx
  const highAlerts = useMemo(() => {
    return activeAlerts.filter(article => article.severity === 'high');
  }, [activeAlerts]);
```

Replace:

```tsx
    void Promise.all([refetch(), fetchActiveAlerts()]);
  }, [refetch, fetchActiveAlerts]);
```

with:

```tsx
    void Promise.all([refetch(), refetchAlerts()]);
  }, [refetch, refetchAlerts]);
```

Replace:

```tsx
    { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle, count: activeAlertCount || actionRequiredAlerts.length },
```

with:

```tsx
    // Feed stats share the alerts' scope and filters, so this matches the
    // Alerts tab total and is available before the tab is opened.
    { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle, count: stats.critical + stats.high },
```

Replace:

```tsx
                        onClick={async () => { await refreshWeb3Incidents(); await fetchActiveAlerts(); }}
```

with:

```tsx
                        onClick={async () => { await refreshWeb3Incidents(); await refetchAlerts(); }}
```

Replace:

```tsx
                      onClick={() => void fetchActiveAlerts()}
                      disabled={alertsLoading}
```

with:

```tsx
                      onClick={() => void refetchAlerts()}
                      disabled={alertsLoading}
```

Replace:

```tsx
                {/* Critical Alerts */}
                {criticalAlerts.length > 0 && (
```

with:

```tsx
                {alertsLoading && <AlertListSkeleton count={3} />}

                {/* Critical Alerts */}
                {!alertsLoading && criticalAlerts.length > 0 && (
```

Replace:

```tsx
                      Critical Alerts ({criticalAlerts.length})
```

with:

```tsx
                      Critical Alerts ({alertsCriticalCount})
```

Replace:

```tsx
              {/* High Priority Alerts */}
              {highAlerts.length > 0 && (
```

with:

```tsx
              {/* High Priority Alerts */}
              {!alertsLoading && highAlerts.length > 0 && (
```

Replace:

```tsx
                      High Priority Alerts ({highAlerts.length})
```

with:

```tsx
                      High Priority Alerts ({alertsHighCount})
```

Replace:

```tsx
              {/* Empty state */}
              {!alertsLoading && activeAlerts.length === 0 && (
```

with:

```tsx
              {/* Alert pagination */}
              {!alertsLoading && alertsTotalPages > 1 && (
                <nav className="flex items-center justify-between gap-2" aria-label="Alert pages">
                  <span className="text-sm text-muted-foreground">
                    Page {alertsPage} of {alertsTotalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAlertsPage((current) => Math.max(1, current - 1))}
                      disabled={alertsPage <= 1}
                    >
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAlertsPage((current) => Math.min(alertsTotalPages, current + 1))}
                      disabled={alertsPage >= alertsTotalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </nav>
              )}

              {/* Empty state */}
              {!alertsLoading && activeAlerts.length === 0 && (
```

Replace:

```tsx
                    <Button onClick={() => void fetchActiveAlerts()}>Try Again</Button>
```

with:

```tsx
                    <Button onClick={() => void refetchAlerts()}>Try Again</Button>
```

Check nothing still references the old names: `rtk proxy grep -n "fetchActiveAlerts\|setActiveAlerts\|activeAlertCount\|actionRequiredAlerts" src/pages/News.tsx` prints nothing.

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/hooks/__tests__/useThreatIntelAlerts.test.tsx src/pages/__tests__/News.navigation.test.tsx`

Expected: PASS.

Then `npx tsc --noEmit -p tsconfig.app.json` (no errors) and `npx eslint src/hooks/useThreatIntelAlerts.ts src/pages/News.tsx` (0 errors).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useThreatIntelAlerts.ts src/pages/News.tsx \
  src/hooks/__tests__/useThreatIntelAlerts.test.tsx src/pages/__tests__/News.navigation.test.tsx
git commit -m "feat(threat-intel): scope-aware paginated alerts tab

Alerts now use the feed's scope and filters through search_news_articles,
page 20 at a time, show a skeleton while loading, and the tab badge comes
from the page stats instead of waiting for the tab to open."
```

---

### Task B5: URL and state bugs

**Files:**
- Create: `src/hooks/useDebouncedValue.ts`
- Modify: `src/pages/News.tsx` (old lines 1, 24, 44-49 constants, 167-170 search state, 443 tab keyboard handler, 582-586 tabs, 616-617 / 916-917 / 1144-1145 panels, 622-630 search input, 1160 breadcrumb)
- Modify: `src/components/news/RealtimeAlertListener.tsx:33-35, 44, 182`
- Test: `src/hooks/__tests__/useDebouncedValue.test.tsx` (new), `src/components/news/__tests__/RealtimeAlertListener.test.tsx`, `src/pages/__tests__/News.navigation.test.tsx`

**Interfaces:**
- Produces: `useDebouncedValue<T>(value: T, delayMs: number): T`.
- `RealtimeAlertListener` props are unchanged; the channel is created once per `enabled` value and the latest `onNewArticle` is read through a ref.
- DOM contract used by tests and by Section C: tablist `aria-label="Threat intelligence sections"`; tab ids `threat-intel-tab-{feed|alerts|subscribe}`; panel ids `threat-intel-panel-{feed|alerts|subscribe}`; search input `id="threat-intel-search"` with label text "Search threat intelligence".

The localStorage scope leak from this task's brief is already fixed in Task B3, Steps 7-8 (stats cached per scope and filter set, explicit `scope` in every cache key, legacy global entries removed, regression test `does not leak Web3 view stats into the all-news view`).

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/__tests__/useDebouncedValue.test.tsx`:

```tsx
// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('bridge', 300));
    expect(result.current).toBe('bridge');
  });

  it('publishes only the last value once input pauses for the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: '' } },
    );

    rerender({ value: 'd' });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: 'dr' });
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('dr');
  });
});
```

In `src/components/news/__tests__/RealtimeAlertListener.test.tsx`, replace:

```tsx
  return { handlers, channel, toast: vi.fn(), removeChannel: vi.fn() };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => realtime.channel),
    removeChannel: realtime.removeChannel,
  },
}));
```

with:

```tsx
  return { handlers, channel, channelFactory: vi.fn(() => channel), toast: vi.fn(), removeChannel: vi.fn() };
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: realtime.channelFactory,
    removeChannel: realtime.removeChannel,
  },
}));
```

Replace the end of the same file (the `does not toast a merged duplicate insert` test added in Task B2):

```tsx
          metadata: { provider: 'slowmist', classification_relevant: false, duplicate_of_uid: 'quillmonitor:1' },
        },
      });
      vi.advanceTimersByTime(1_500);
    });

    expect(realtime.toast).not.toHaveBeenCalled();
    expect(onNewArticle).toHaveBeenCalledTimes(1);
  });
});
```

with:

```tsx
          metadata: { provider: 'slowmist', classification_relevant: false, duplicate_of_uid: 'quillmonitor:1' },
        },
      });
      vi.advanceTimersByTime(1_500);
    });

    expect(realtime.toast).not.toHaveBeenCalled();
    expect(onNewArticle).toHaveBeenCalledTimes(1);
  });

  it('keeps one realtime channel when the refresh callback changes', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<RealtimeAlertListener onNewArticle={first} />);

    rerender(<RealtimeAlertListener onNewArticle={second} />);

    expect(realtime.channelFactory).toHaveBeenCalledTimes(1);
    expect(realtime.removeChannel).not.toHaveBeenCalled();

    act(() => {
      realtime.handlers.UPDATE({
        new: {
          id: 'quill-1',
          title: 'Verified incident',
          severity: 'high',
          category: 'web3-security',
          summary: 'Updated summary',
          source_name: 'QuillMonitor',
          metadata: { provider: 'quillmonitor' },
        },
      });
      vi.advanceTimersByTime(1_500);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
```

In `src/pages/__tests__/News.navigation.test.tsx`, replace:

```tsx
const idleAlerts = {
```

with:

```tsx
vi.mock('@/components/news/SubscriptionForm', () => ({
  SubscriptionForm: () => <div data-testid="subscription-form" />,
}));

const idleAlerts = {
```

Replace the end of the file:

```tsx
    expect(alertsTab?.textContent).toContain('1');
  });
});
```

with:

```tsx
    expect(alertsTab?.textContent).toContain('1');
  });

  it('debounces search typing before writing ?q= to the URL', async () => {
    const router = renderAt('/threat-intel?scope=all');

    const search = await screen.findByLabelText('Search threat intelligence');
    fireEvent.change(search, { target: { value: 'drainer' } });

    expect((search as HTMLInputElement).value).toBe('drainer');
    expect(router.state.location.search).not.toContain('q=');
    await waitFor(
      () => expect(router.state.location.search).toContain('q=drainer'),
      { timeout: 1500 },
    );
  });

  it('exposes accessible tabs and returns to the feed from the Subscribe breadcrumb', async () => {
    const router = renderAt('/threat-intel?scope=all');

    expect(await screen.findByRole('tablist', { name: 'Threat intelligence sections' })).not.toBeNull();
    const feedTab = screen.getByRole('tab', { name: /News Feed/ });
    expect(feedTab.getAttribute('aria-selected')).toBe('true');
    expect(feedTab.getAttribute('aria-controls')).toBe('threat-intel-panel-feed');
    expect(screen.getByRole('tabpanel').getAttribute('aria-labelledby')).toBe('threat-intel-tab-feed');

    fireEvent.click(screen.getByRole('tab', { name: /Subscribe/ }));
    await waitFor(() => expect(router.state.location.search).toContain('tab=subscribe'));
    expect(screen.getByRole('tab', { name: /Subscribe/ }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Threat Intel' }));
    await waitFor(() => expect(router.state.location.search).not.toContain('tab='));
    expect(screen.getByRole('tab', { name: /News Feed/ }).getAttribute('aria-selected')).toBe('true');
  });
});
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `rtk proxy npx vitest run src/hooks/__tests__/useDebouncedValue.test.tsx src/components/news/__tests__/RealtimeAlertListener.test.tsx src/pages/__tests__/News.navigation.test.tsx`

Expected failures:
- `useDebouncedValue`: `Failed to resolve import "@/hooks/useDebouncedValue"`.
- `RealtimeAlertListener › keeps one realtime channel…`: `expected "spy" to be called 1 times, but got 2 times` (and `removeChannel` was called).
- `News.navigation › debounces search…`: `Unable to find a label with the text of: Search threat intelligence`.
- `News.navigation › exposes accessible tabs…`: `Unable to find an accessible element with the role "tablist"`.

- [ ] **Step 3: Create the debounce hook**

Create `src/hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from 'react';

/** Returns `value` once it has stopped changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
```

- [ ] **Step 4: Stabilize the realtime channel**

In `src/components/news/RealtimeAlertListener.tsx`, replace:

```tsx
  const { toast } = useToast();
  const hasShownWelcomeToast = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
```

with:

```tsx
  const { toast } = useToast();
  const hasShownWelcomeToast = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Parents pass a new callback whenever their filters change. Reading it
  // through a ref keeps one channel for the lifetime of the listener.
  const onNewArticleRef = useRef(onNewArticle);

  useEffect(() => {
    onNewArticleRef.current = onNewArticle;
  }, [onNewArticle]);
```

Replace:

```tsx
        onNewArticle?.();
```

with:

```tsx
        onNewArticleRef.current?.();
```

Replace:

```tsx
  }, [enabled, onNewArticle, toast]);
```

with:

```tsx
  }, [enabled, toast]);
```

- [ ] **Step 5: Debounce search, fix the breadcrumb, add tab and label semantics in News.tsx**

In `src/pages/News.tsx`, replace:

```tsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
```

with:

```tsx
import { useState, useMemo, useCallback, useEffect, useRef, type KeyboardEvent } from 'react';
```

Replace:

```tsx
import { useThreatIntelAlerts } from '@/hooks/useThreatIntelAlerts';
```

with:

```tsx
import { useThreatIntelAlerts } from '@/hooks/useThreatIntelAlerts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
```

Replace:

```tsx
  { value: '300', label: '5m' },
];

const News = () => {
```

with:

```tsx
  { value: '300', label: '5m' },
];

const SEARCH_DEBOUNCE_MS = 300;

const News = () => {
```

Replace:

```tsx
  const setCurrentPage = useCallback((page: number | ((current: number) => number)) => {
    const nextPage = typeof page === 'function' ? page(currentPage) : page;
    updateFeedParam('page', nextPage > 1 ? String(nextPage) : null);
  }, [currentPage, updateFeedParam]);
```

with:

```tsx
  const setCurrentPage = useCallback((page: number | ((current: number) => number)) => {
    const nextPage = typeof page === 'function' ? page(currentPage) : page;
    updateFeedParam('page', nextPage > 1 ? String(nextPage) : null);
  }, [currentPage, updateFeedParam]);

  // Typing stays local; ?q= (and therefore the feed query) only changes after
  // the user pauses for SEARCH_DEBOUNCE_MS.
  const [searchInput, setSearchInput] = useState(searchQuery);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  const lastSyncedSearch = useRef(searchQuery);

  // URL -> input: Clear filters, Back/Forward and shared links.
  useEffect(() => {
    if (searchQuery === lastSyncedSearch.current) return;
    lastSyncedSearch.current = searchQuery;
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Input -> URL, once typing pauses.
  useEffect(() => {
    if (debouncedSearch === lastSyncedSearch.current) return;
    lastSyncedSearch.current = debouncedSearch;
    updateFeedParam('q', debouncedSearch || null, true);
  }, [debouncedSearch, updateFeedParam]);
```

Replace:

```tsx
  // Pull to refresh handler
  const handlePullToRefresh = async () => {
```

with:

```tsx
  // WAI-ARIA tabs: arrow keys, Home and End move between tabs.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (currentTabIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentTabIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    handleTabChange(nextTab.id);
    document.getElementById(`threat-intel-tab-${nextTab.id}`)?.focus();
  };

  // Pull to refresh handler
  const handlePullToRefresh = async () => {
```

Replace:

```tsx
            <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-card/80 rounded-xl border border-border shadow-lg min-w-max sm:min-w-0">
```

with:

```tsx
            <div
              role="tablist"
              aria-label="Threat intelligence sections"
              className="flex gap-1.5 sm:gap-2 p-1.5 bg-card/80 rounded-xl border border-border shadow-lg min-w-max sm:min-w-0"
            >
```

Replace:

```tsx
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
```

with:

```tsx
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`threat-intel-tab-${tab.id}`}
                  aria-selected={selectedTab === tab.id}
                  aria-controls={`threat-intel-panel-${tab.id}`}
                  tabIndex={selectedTab === tab.id ? 0 : -1}
                  onClick={() => handleTabChange(tab.id)}
                  onKeyDown={handleTabKeyDown}
```

Replace:

```tsx
          {selectedTab === 'feed' && (
            <div className="space-y-6">
```

with:

```tsx
          {selectedTab === 'feed' && (
            <div
              className="space-y-6"
              role="tabpanel"
              id="threat-intel-panel-feed"
              aria-labelledby="threat-intel-tab-feed"
            >
```

Replace:

```tsx
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search articles, technologies, tags..."
                        value={searchQuery}
                        onChange={(event) => updateFeedParam('q', event.target.value || null, true)}
                        className="pl-10"
                      />
                    </div>
```

with:

```tsx
                    <div className="relative flex-1">
                      <label htmlFor="threat-intel-search" className="sr-only">
                        Search threat intelligence
                      </label>
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        id="threat-intel-search"
                        type="search"
                        placeholder="Search articles, technologies, tags..."
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        className="pl-10"
                      />
                    </div>
```

Replace:

```tsx
            <ErrorBoundary>
              <div className="space-y-6">
```

with:

```tsx
            <ErrorBoundary>
              <div
                className="space-y-6"
                role="tabpanel"
                id="threat-intel-panel-alerts"
                aria-labelledby="threat-intel-tab-alerts"
              >
```

Replace:

```tsx
            <ErrorBoundary>
              <div className="space-y-4">
```

with:

```tsx
            <ErrorBoundary>
              <div
                className="space-y-4"
                role="tabpanel"
                id="threat-intel-panel-subscribe"
                aria-labelledby="threat-intel-tab-subscribe"
              >
```

Replace (Subscribe breadcrumb; it changed local state but left `tab=subscribe` in the URL, so the URL-sync effect switched straight back):

```tsx
                    onClick={() => setSelectedTab('feed')}
```

with:

```tsx
                    onClick={() => handleTabChange('feed')}
```

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/hooks/__tests__/useDebouncedValue.test.tsx src/components/news/__tests__/RealtimeAlertListener.test.tsx src/pages/__tests__/News.navigation.test.tsx`

Expected: PASS. The first navigation test still finds `findByDisplayValue('bridge')` because the input state starts from `?q=`.

Then `npx tsc --noEmit -p tsconfig.app.json` (no errors) and `npx eslint src/hooks/useDebouncedValue.ts src/components/news/RealtimeAlertListener.tsx src/pages/News.tsx` (0 errors).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useDebouncedValue.ts src/components/news/RealtimeAlertListener.tsx src/pages/News.tsx \
  src/hooks/__tests__/useDebouncedValue.test.tsx \
  src/components/news/__tests__/RealtimeAlertListener.test.tsx \
  src/pages/__tests__/News.navigation.test.tsx
git commit -m "fix(threat-intel): debounce search, stabilize realtime, accessible tabs

Search writes ?q= after a 300 ms pause instead of on every keystroke, the
Subscribe breadcrumb updates the URL, the realtime channel survives filter
changes, and the tabs and search field expose proper ARIA semantics."
```

---

### Task B6: Default view is Web3 incidents

**Files:**
- Modify: `src/pages/News.tsx` (old lines 23, 71-78, 145-153, 634, 765; taxonomy import from Task B1)
- Modify: `src/components/news/ContentScopeSelector.tsx:12-23` (Web3 Incidents listed first)
- Test: `src/pages/__tests__/News.navigation.test.tsx`, `src/components/news/__tests__/ContentScopeSelector.test.tsx`

**Interfaces:**
- Consumes: `parseThreatIntelFilters` (B3), `DEFAULT_SCOPE` and `parseScope` (B1).
- URL contract: no `scope` param (or any unknown value) means `web3-incidents`; `?scope=all` means all security news; `?scope=web3-incidents` keeps working. Choosing Web3 removes the param; choosing All writes `scope=all`. "Clear filters" removes `scope`, which returns to the Web3 view.
- Homepage and nav links that point at `?scope=web3-incidents` stay as they are.

- [ ] **Step 1: Write the failing tests**

In `src/pages/__tests__/News.navigation.test.tsx`, replace (inside the first test):

```tsx
    fireEvent.click(screen.getByRole('button', { name: 'All Intelligence' }));
    await waitFor(() => {
      expect(router.state.location.search).not.toContain('scope=');
      expect(router.state.location.search).toContain('categories=web3-security%2Cdefi-exploits');
      expect(router.state.location.search).not.toContain('page=2');
    });
```

with:

```tsx
    fireEvent.click(screen.getByRole('button', { name: 'All Intelligence' }));
    await waitFor(() => {
      expect(router.state.location.search).toContain('scope=all');
      expect(router.state.location.search).toContain('categories=web3-security%2Cdefi-exploits');
      expect(router.state.location.search).not.toContain('page=2');
    });
```

Replace the end of the file:

```tsx
    expect(screen.getByRole('tab', { name: /News Feed/ }).getAttribute('aria-selected')).toBe('true');
  });
});
```

with:

```tsx
    expect(screen.getByRole('tab', { name: /News Feed/ }).getAttribute('aria-selected')).toBe('true');
  });

  it('defaults to Web3 incidents and only writes scope=all for the broader view', async () => {
    const router = renderAt('/threat-intel');

    await waitFor(() => expect(useNewsArticlesMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ view: 'web3-incidents' }),
    ));
    expect(screen.getByRole('button', { name: 'Web3 Incidents' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'All Intelligence' }));
    await waitFor(() => {
      expect(router.state.location.search).toContain('scope=all');
      expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'all' }));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Web3 Incidents' }));
    await waitFor(() => {
      expect(router.state.location.search).not.toContain('scope=');
      expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'web3-incidents' }));
    });
  });
});
```

In `src/components/news/__tests__/ContentScopeSelector.test.tsx`, replace:

```tsx
    expect(group).not.toBeNull();
```

with:

```tsx
    expect(group).not.toBeNull();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Web3 Incidents',
      'All Intelligence',
    ]);
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `rtk proxy npx vitest run src/pages/__tests__/News.navigation.test.tsx src/components/news/__tests__/ContentScopeSelector.test.tsx`

Expected failures:
- `hydrates shareable feed filters…`: `expected '?categories=…' to contain 'scope=all'`.
- `defaults to Web3 incidents…`: last call has `view: 'all'`.
- `ContentScopeSelector`: `expected [ 'All Intelligence', 'Web3 Incidents' ] to deeply equal [ 'Web3 Incidents', 'All Intelligence' ]`.

- [ ] **Step 3: Parse the URL through the shared helper and flip the default**

In `src/pages/News.tsx`, replace:

```tsx
import { NewsCategory, SeverityLevel, NewsArticle, ThreatIntelScope } from '@/types/news';
```

with:

```tsx
import { NewsCategory, SeverityLevel, NewsArticle } from '@/types/news';
```

Replace:

```tsx
import { NEWS_CATEGORIES, SEVERITY_LEVELS, SEVERITY_STYLES, parseListParam } from '@/lib/threatIntel/taxonomy';
```

with:

```tsx
import { DEFAULT_SCOPE, SEVERITY_STYLES } from '@/lib/threatIntel/taxonomy';
import { parseThreatIntelFilters } from '@/lib/threatIntel/query';
```

Replace:

```tsx
  const selectedCategories = useMemo(
    () => parseListParam(searchParams.get('categories') || searchParams.get('category'), NEWS_CATEGORIES),
    [searchParams],
  );
  const selectedSeverities = useMemo(
    () => parseListParam(searchParams.get('severities') || searchParams.get('severity'), SEVERITY_LEVELS),
    [searchParams],
  );
```

with:

```tsx
  // Every shareable filter comes from the URL through one parser. No ?scope
  // (or an unknown value) means the default Web3 incidents view.
  const urlFilters = useMemo(() => parseThreatIntelFilters(searchParams), [searchParams]);
  const selectedCategories = urlFilters.categories;
  const selectedSeverities = urlFilters.severities;
```

Replace:

```tsx
  const searchQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') === 'severity' ? 'severity' : 'date';
  const dateFilter = ['7d', '30d', '90d'].includes(searchParams.get('date') || '')
    ? searchParams.get('date') as '7d' | '30d' | '90d'
    : 'all';
  const feedView: ThreatIntelScope = searchParams.get('scope') === 'web3-incidents' ? 'web3-incidents' : 'all';
  const parsedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = 20;
```

with:

```tsx
  const {
    searchQuery,
    sortBy,
    dateFilter,
    scope: feedView,
    page: currentPage,
    pageSize,
  } = urlFilters;
```

Replace:

```tsx
                        onChange={(value) => updateFeedParam('scope', value === 'all' ? null : value)}
```

with:

```tsx
                        onChange={(value) => updateFeedParam('scope', value === DEFAULT_SCOPE ? null : value)}
```

Replace:

```tsx
                      {(selectedCategories.length > 0 || selectedSeverities.length > 0 || searchQuery || feedView !== 'all') && (
```

with:

```tsx
                      {(selectedCategories.length > 0 || selectedSeverities.length > 0 || searchQuery || feedView !== DEFAULT_SCOPE) && (
```

In `src/components/news/ContentScopeSelector.tsx`, replace:

```tsx
const options: Array<{ value: ThreatIntelScope; label: string; description: string }> = [
  {
    value: 'all',
    label: 'All Intelligence',
    description: 'News, advisories, disclosures, and published incidents.',
  },
  {
    value: 'web3-incidents',
    label: 'Web3 Incidents',
    description: 'Verified and preliminary Web3 exploits, hacks, and security incidents.',
  },
];
```

with:

```tsx
// Web3 Incidents is the default Threat Intel view, so it is listed first.
const options: Array<{ value: ThreatIntelScope; label: string; description: string }> = [
  {
    value: 'web3-incidents',
    label: 'Web3 Incidents',
    description: 'Verified and preliminary Web3 exploits, hacks, and security incidents.',
  },
  {
    value: 'all',
    label: 'All Intelligence',
    description: 'News, advisories, disclosures, and published incidents.',
  },
];
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `rtk proxy npx vitest run src/pages/__tests__/News.navigation.test.tsx src/components/news/__tests__/ContentScopeSelector.test.tsx`

Expected: PASS.

Then the full gate:

- `rtk proxy npx vitest run` (expected: all files pass, including `supabase/functions/_shared/subscription-delivery.test.ts`)
- `npx tsc --noEmit -p tsconfig.app.json` (no errors)
- `npx eslint src/pages/News.tsx src/components/news/ContentScopeSelector.tsx src/lib/threatIntel src/hooks src/utils/newsCache.ts src/utils/newsIncident.ts` (0 errors)
- `npm run build` (expected: build succeeds)

Manual check with `npm run dev` (port 8080): `/threat-intel` shows Web3 incidents with the Web3 button pressed; choosing All Intelligence writes `?scope=all`; `/threat-intel?scope=web3-incidents` still works; typing in search updates `?q=` only after a pause; the Alerts tab badge shows a number before the tab is opened; Subscribe then the "Threat Intel" breadcrumb returns to the feed and drops `tab=subscribe`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/News.tsx src/components/news/ContentScopeSelector.tsx \
  src/pages/__tests__/News.navigation.test.tsx src/components/news/__tests__/ContentScopeSelector.test.tsx
git commit -m "feat(threat-intel): default to Web3 incidents view

/threat-intel now opens on Web3 incidents. ?scope=all shows all security
news, choosing Web3 removes the param, and existing
?scope=web3-incidents links keep working."
```

---

### Notes for the plan author

**How this plan was checked.** Every Create, Replace, Delete and Append step was applied mechanically, in task order, to a scratch copy of the repo at `be5d978`. Every before-snippet matched exactly once. After each task its listed tests passed and `tsc` was clean. After B6 the full suite passed (29 files, 204 tests), `eslint` reported 0 errors on the touched files, and `vite build` succeeded. The SQL was not run against a database.

**Deployment order.** Ship the B3 migration to Lovable before, or together with, the frontend from B3 onward. If the frontend lands first, `threat_intel_stats` 404s and the hook falls back to page counts and `count_news_articles` (tested in `useNewsArticles.test.tsx`). But `search_news_articles` with `sort_by` will fail, because the old 8-argument function rejects the unknown argument, and the feed then drops to the narrow fallback query for every RPC path, which is now the default view. Apply the migration first, run the sanity SQL in B3 Step 5, then publish the frontend. Rollback: re-run the `search_news_articles` and `count_news_articles` definitions from `20260927180000_add_subscription_content_scope.sql`, then `DROP FUNCTION public.search_news_articles(text, text[], text[], timestamptz, integer, integer, text, boolean, text); DROP FUNCTION public.threat_intel_stats(text, text[], text[], timestamptz, text, boolean);` and `NOTIFY pgrst, 'reload schema';`.

**Risks.**
- Dropping the 6- and 7-argument `search_news_articles` and the 4- and 5-argument `count_news_articles` overloads breaks any caller outside this repo that still uses them. The repo has none (`grep` finds only `useNewsArticles.ts`), but Lovable-side tooling was not checked.
- `threat_intel_stats` adds one aggregate query per filter change and runs on the whole filtered set. Step 7 of the sanity SQL measures it. If it is slow on the full corpus, a partial index on `published_at` with the publishable predicate is the first thing to try.
- Since the default view is now Web3 incidents, the default page always goes through the RPC. It already did for `?scope=web3-incidents`, so this is not a new plan shape, but it is now the most common request.
- `CLASSIFICATION_RELEVANCE_POSTGREST_FILTER` changed value. Every existing `.or(...)` caller, `fetchFeedFreshness` among them, now also hides duplicates. That is intended, but it also changes "Newest source report" if the newest row is a duplicate.
- Edits to `supabase/functions/submit-form/index.ts` and `update-subscription/index.ts` (B1) touch Workstream D files. They are two-line changes; land B1 before D starts or have D rebase. Deno type-checking was not run (no Deno locally).
- `src/integrations/supabase/types.ts` is edited by hand in B3 Step 6. When Lovable regenerates it after the migration, the result should match. If it does not, regenerate and re-run `tsc`.
- Small visual changes: the `info` severity badge on cards becomes gray (it was blue; filters already used gray), related-article badges for medium and low gain colour, and severity labels read "High" rather than lowercase "high" with CSS capitalisation.
- `duplicate_of_uid` is added to `NewsArticle['metadata']` in B2. The spec's "contracts first" change (section 12) may add the same field; keep one definition.
- Semantics of an empty `duplicate_of_uid`: everywhere (client, PostgREST, SQL) a present, non-null value marks the row as a duplicate, even `''`. `supabase/functions/_shared/telegram-alerts.ts:59` uses `Boolean(...)`, which treats `''` as not a duplicate. The dedup writer always writes a uid, so this only matters if someone writes `''` by hand.

**Interface changes and decisions to confirm.**
- The localStorage scope fix from the B5 brief moved into B3 (Steps 7-8), because B3 already changes the stats cache shape. B5 cross-references it.
- `useNewsArticles().stats` changed shape to `ThreatIntelStats` (adds `medium`, `low`, `info`, `unconfirmed`; drops `aiSummarized` and `web3Incidents`, which nothing read). A new `statsSource: 'server' | 'page'` lets the UI label tiles "in this view" or "on this page". Section C should read both.
- The B2 brief listed only the exports `NEWS_ARTICLE_COLUMNS`, `mapNewsArticleRow` and `isPublishable`. This plan also adds `mapPublishableNewsArticleRows`, `getDuplicateOfUid` and `PUBLISHABLE_POSTGREST_FILTER`. B1 adds `NEWS_CATEGORY_CONFIG`, `getSeverityStyle`, `isNewsCategory` and `isSeverityLevel` beyond the requested exports. All requested names are unchanged.
- Bug fix not in the brief (B2 Step 12): the deep-link effect depended on `dbArticles`, so cache hydration or a feed refresh during the single-row fetch cancelled it and the `deepLinkLoaded` guard blocked the retry, leaving `/threat-intel/<id>` on the feed for articles not on the loaded page. The effect now reads the list through a ref and restarts only on route change.
- New behaviour not in the brief: a deep link to a merged duplicate redirects to the primary incident (looked up by `news_articles.uid`) instead of showing "not found". It keeps old shared links and emails working after the backfill in spec 5.1. Drop B2 Step 12's redirect block if product prefers "not found".
- `newsCategoryConfig` stays exported from `src/data/newsData.ts` as an alias, so `EmailPreview.tsx` and `ManageSubscription.tsx` (Workstream D) need no change now. D can switch to `NEWS_CATEGORY_CONFIG` later.
- The hooks keep the existing `useState`/`useEffect` pattern rather than React Query, so the existing page tests need no `QueryClientProvider`. Spec 7.1 moves data access to React Query; Section C can wrap these hooks when it splits `News.tsx`.

**Spec items not covered here.**
- `threat-intel-api/index.ts:220` and `send-digest-emails/index.ts:61-68` still carry their own category lists. They are not in the drift test's file list; add them to `EDGE_FUNCTIONS_WITH_CATEGORY_ALLOWLIST` when their owners import the shared module.
- `threat-intel-api`, `send-critical-alerts` and the digest functions do not yet exclude `duplicate_of_uid` rows (Workstreams A and D).
- Filters for verification, chain, attack type and source (spec 7.2) are not in the URL or the RPCs yet. `ThreatIntelFilters` and the SQL predicate are where they would go. `threat_intel_stats.unconfirmed` is already returned for a verification tile.
- The route split, mobile bottom sheet, real `<a>` cards, methodology page and dead-code removal (`ThreatStatsDashboard.tsx`, `data/currentNewsData.ts`, `mockNewsArticles`) belong to Section C.
- The `docs/LOVABLE_<PHASE>_RELEASE.md` note for this phase (migration to apply, sanity SQL, functions to redeploy: `submit-form` and `update-subscription`) is not written here.

---

## Section C: Threat Intel page UI (tasks C1 to C6)

These tasks run after sections A and B have merged. They change only frontend code under `src/`, plus `public/sitemap.xml`.

**Before you start**

- Section A must have added `supabase/functions/_shared/incident-fields.ts` exporting `readIncidentFields` and the `IncidentFields` / `IncidentSource` types.
- Section B must have added `src/lib/threatIntel/taxonomy.ts` (`DEFAULT_SCOPE`, `parseScope`, `getCategoryConfig`, and the rest) and `src/lib/threatIntel/articleRow.ts` (`NEWS_ARTICLE_COLUMNS`, `mapNewsArticleRow`, `isPublishable`).
- Check both with `ls supabase/functions/_shared/incident-fields.ts src/lib/threatIntel/taxonomy.ts src/lib/threatIntel/articleRow.ts`. All three paths must print.

**Commands**

- One test file: `rtk proxy npx vitest run <file>`. Plain `npx vitest` output is swallowed by the rtk hook, so always use `rtk proxy`.
- Full suite: `rtk proxy npx vitest run`
- Typecheck: `npx tsc --noEmit -p tsconfig.app.json`
- Lint: `npx eslint <files>`

**Test conventions in this repo:** there is no global test setup and no jest-dom. Component tests start with `// @vitest-environment jsdom`, call `afterEach(cleanup)` themselves, and assert with `.not.toBeNull()` and `getAttribute(...)`. Tests import shared edge-function code by relative path (`'../../../supabase/functions/_shared/...'`).

**Copy rules for every string in this section:** name the source; use the source's own status words (confirmed, unconfirmed, revised); never say "verified by Digibastion"; no hype words.

---

### Task C1: Incident display model

One function turns a `NewsArticle` into everything a card, alert row or incident page needs to show: verification label and tooltip text, incident date, date added, loss label, funds-returned flag, named sources with deep links, and an honest summary label. Every later task reads from it, so the rules live in one tested place.

**Files:**
- Create: `src/lib/threatIntel/officialLinks.ts`
- Create: `src/lib/threatIntel/incidentDisplay.ts`
- Modify: `src/types/news.ts` (the `NewsArticle` interface, the `publishedAt: Date;` line, about line 26)
- Modify, only if section B did not already do it: `src/pages/News.tsx` (two inline row mappings, about lines 235 and 323) and `src/hooks/useNewsArticles.ts` (about lines 77-118)
- Test: `src/utils/__tests__/incidentDisplay.test.ts`

**Interfaces:**
- Consumes:
  - `readIncidentFields(metadata: unknown): IncidentFields` and `type IncidentFields` from `supabase/functions/_shared/incident-fields.ts` (section A)
  - `getNewsSourceLinks(article: NewsArticle, omittedUrl?: string | null): NewsSourceLink[]` from `src/utils/newsSources.ts`
  - `isPreliminaryQuillMonitorArticle`, `isQuillMonitorArticle`, `isSlowMistArticle`, `SLOWMIST_ATTRIBUTION_URL` from `src/utils/newsIncident.ts`
  - `safeExternalUrl(value: unknown): string | null` from `src/utils/safeUrl.ts`
- Produces:
  - `type VerificationDisplay = 'confirmed' | 'unconfirmed'`
  - `type SummaryLabel = 'AI summary' | 'Excerpt' | 'Provider summary'`
  - `interface IncidentSourceLink { label: string; url: string | null }`
  - `interface IncidentDisplay { verification: VerificationDisplay | null; verificationHelp: string; incidentDateLabel: string | null; addedDateLabel: string; lossLabel: string | null; fundsReturned: boolean; sources: IncidentSourceLink[]; summaryLabel: SummaryLabel | null }`
  - `interface IncidentDisplayOptions { now?: Date; timeZone?: string }`
  - `getIncidentDisplay(article: NewsArticle, options?: IncidentDisplayOptions): IncidentDisplay`
  - `getProviderLabel(article: NewsArticle): string | null`
  - `getIncidentDate(article: NewsArticle, fields?: IncidentFields): Date | null`
  - `NewsArticle.createdAt?: Date`
  - Constants in `officialLinks.ts`: `SITE_URL`, `TELEGRAM_CHANNEL_URL`, `TELEGRAM_CHANNEL_HANDLE`, `TELEGRAM_COMMUNITY_URL`, `ALERTS_SENDER_EMAIL`, `CORRECTIONS_EMAIL`, `METHODOLOGY_PATH`, `QUILLMONITOR_DATABASE_URL`, `WEB3_IS_GOING_GREAT_URL`, `REVOKE_CASH_URL`, `CHAINABUSE_URL`, `SEAL_911_URL`, `NVD_URL`, `CISA_KEV_URL`

Rules the function applies:

| Field | Rule |
|---|---|
| `verification` | `fields.verification` from section A; otherwise legacy `metadata.verification_status`. `verified` becomes `confirmed`, `unverified` becomes `unconfirmed`, anything else `null`. |
| `verificationHelp` | Names the provider. Confirmed: "QuillMonitor lists this incident as verified. Digibastion shows the source's status and does not verify incidents itself." Unconfirmed: "QuillMonitor has not verified this report yet. Details and the loss figure may change." Empty string when `verification` is null. |
| `incidentDateLabel` | `Exploited Sep 30, 2026`, formatted in UTC because the incident date is a calendar day. `null` when `incident_date_unknown` is true or the date is not `YYYY-MM-DD`. |
| `addedDateLabel` | `Added Oct 9` from `createdAt` (falls back to `publishedAt`), in the viewer's time zone. Adds the year when it differs from the current year. |
| `lossLabel` | `$3.8M` when `amount_status` is `confirmed`, or when it is missing and the incident is confirmed. `$3.8M (revised)` when `revised`. Otherwise `~$3.8M reported`. `null` with no amount. |
| `sources` | Section A's `metadata.sources` first, then the provider entry (QuillMonitor links `reference_url` when present, else the QuillMonitor database page; SlowMist links its attribution page; web3isgoinggreat records get a named link to the site unless a source with that name exists), then the record's own links. Deduplicated by URL. Unsafe URLs are never returned. If nothing has a link, the provider or publisher is still named with `url: null`, so every card names a source. |
| `summaryLabel` | `null` for empty or "Summary pending" summaries. Otherwise from `fields.summaryOrigin` (`ai` gives `AI summary`, `publisher` gives `Excerpt`, `provider` gives `Provider summary`), falling back to legacy `metadata.summary_origin`. Unknown origin gives `null`. That is the fix for publisher excerpts labelled "AI Summary". |

- [ ] **Step 1: Confirm section B maps `created_at`**

Run: `rtk proxy grep -n "created_at\|createdAt" src/lib/threatIntel/articleRow.ts src/hooks/useNewsArticles.ts`

Expected: `NEWS_ARTICLE_COLUMNS` in `articleRow.ts` contains `created_at`, `mapNewsArticleRow` sets `createdAt`, and `useNewsArticles.ts` imports both from `articleRow.ts`.

If `useNewsArticles.ts` still defines its own `NEWS_ARTICLE_COLUMNS` and `toNewsArticle` (lines 77-118), make these three edits in that file:

Before:
```ts
const NEWS_ARTICLE_COLUMNS = 'id,title,summary,content,category,severity,tags,affected_technologies,link,source_url,source_name,author,cve_id,published_at,is_processed,metadata' as const;
```
After:
```ts
const NEWS_ARTICLE_COLUMNS = 'id,title,summary,content,category,severity,tags,affected_technologies,link,source_url,source_name,author,cve_id,published_at,created_at,is_processed,metadata' as const;
```

Before:
```ts
  | 'published_at'
  | 'is_processed'
```
After:
```ts
  | 'published_at'
  | 'created_at'
  | 'is_processed'
```

Before:
```ts
  publishedAt: new Date(row.published_at),
  affectedTechnologies: row.affected_technologies || [],
```
After:
```ts
  publishedAt: new Date(row.published_at),
  createdAt: row.created_at ? new Date(row.created_at) : undefined,
  affectedTechnologies: row.affected_technologies || [],
```

If `articleRow.ts` exists but leaves out `created_at`, stop and ask the section B owner to add it. Do not fork the mapping.

- [ ] **Step 2: Add `createdAt` to `NewsArticle`**

Skip if `rtk proxy grep -n "createdAt?: Date" src/types/news.ts` already prints a match inside `NewsArticle`.

In `src/types/news.ts`:

Before:
```ts
  publishedAt: Date;
  affectedTechnologies?: string[];
```
After:
```ts
  publishedAt: Date;
  /** When Digibastion stored the record (news_articles.created_at). */
  createdAt?: Date;
  affectedTechnologies?: string[];
```

If `src/pages/News.tsx` still builds articles inline from `select('*')` rows (section B did not switch it to `mapNewsArticleRow`), add `createdAt` to both mappings.

Deep-link mapping, about line 323:

Before:
```ts
          publishedAt: new Date(data.published_at),
          isProcessed: data.is_processed ?? false,
```
After:
```ts
          publishedAt: new Date(data.published_at),
          createdAt: data.created_at ? new Date(data.created_at) : undefined,
          isProcessed: data.is_processed ?? false,
```

Active-alerts mapping, about line 235:

Before:
```ts
      publishedAt: new Date(row.published_at),
      isProcessed: row.is_processed ?? false,
```
After:
```ts
      publishedAt: new Date(row.published_at),
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      isProcessed: row.is_processed ?? false,
```

- [ ] **Step 3: Write the failing test**

Create `src/utils/__tests__/incidentDisplay.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { NewsArticle } from '@/types/news';
import { getIncidentDisplay } from '@/lib/threatIntel/incidentDisplay';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const OPTIONS = { now: NOW, timeZone: 'UTC' } as const;
const QM_DATABASE = 'https://www.quillaudits.com/web3-hacks-database';
const QM_REFERENCE = 'https://x.com/peckshield/status/1975000000000000001';

const base = (overrides: Partial<NewsArticle> = {}): NewsArticle => ({
  id: 'article-1',
  title: 'Incident',
  content: 'Details',
  summary: 'Summary',
  category: 'defi-exploits',
  tags: [],
  severity: 'high',
  publishedAt: new Date('2026-09-30T00:00:00.000Z'),
  ...overrides,
});

const quillMonitor = (
  metadata: NonNullable<NewsArticle['metadata']>,
  overrides: Partial<NewsArticle> = {},
): NewsArticle => base({
  id: 'quillmonitor:near-intents',
  title: 'NEAR Intents: Bridge exploit ($3.8M loss)',
  summary: 'Summary pending',
  sourceName: 'QuillMonitor',
  author: 'QuillAudits',
  isProcessed: true,
  createdAt: new Date('2026-10-09T14:05:00.000Z'),
  link: QM_REFERENCE,
  sourceUrl: JSON.stringify([
    { url: QM_REFERENCE, label: 'Incident reference' },
    { url: QM_DATABASE, label: 'QuillMonitor database' },
  ]),
  ...overrides,
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    incident_date: '2026-09-30',
    amount_lost_usd: 3_800_000,
    amount_display: '$3.8M',
    reference_url: QM_REFERENCE,
    attribution_url: QM_DATABASE,
    summary_origin: 'provider',
    ...metadata,
  },
});

describe('getIncidentDisplay', () => {
  it('labels an unverified QuillMonitor record as unconfirmed with a reported loss and its reference link', () => {
    const display = getIncidentDisplay(quillMonitor({ verification_status: 'unverified' }), OPTIONS);

    expect(display.verification).toBe('unconfirmed');
    expect(display.verificationHelp).toBe(
      'QuillMonitor has not verified this report yet. Details and the loss figure may change.',
    );
    expect(display.incidentDateLabel).toBe('Exploited Sep 30, 2026');
    expect(display.addedDateLabel).toBe('Added Oct 9');
    expect(display.lossLabel).toBe('~$3.8M reported');
    expect(display.fundsReturned).toBe(false);
    expect(display.sources).toEqual([{ label: 'QuillMonitor', url: QM_REFERENCE }]);
    expect(display.summaryLabel).toBeNull();
  });

  it('labels a verified QuillMonitor record as confirmed and links the database page when there is no reference', () => {
    const display = getIncidentDisplay(quillMonitor(
      { verification_status: 'verified', reference_url: null, funds_returned: true },
      {
        summary: 'The bridge relayer key was compromised and funds were moved to a new address.',
        link: QM_DATABASE,
        sourceUrl: JSON.stringify([{ url: QM_DATABASE, label: 'QuillMonitor database' }]),
      },
    ), OPTIONS);

    expect(display.verification).toBe('confirmed');
    expect(display.verificationHelp).toBe(
      "QuillMonitor lists this incident as verified. Digibastion shows the source's status and does not verify incidents itself.",
    );
    expect(display.lossLabel).toBe('$3.8M');
    expect(display.fundsReturned).toBe(true);
    expect(display.sources).toEqual([{ label: 'QuillMonitor', url: QM_DATABASE }]);
    expect(display.summaryLabel).toBe('Provider summary');
  });

  it('follows the stored amount status over the verification status', () => {
    expect(getIncidentDisplay(
      quillMonitor({ verification_status: 'verified', amount_status: 'revised' }),
      OPTIONS,
    ).lossLabel).toBe('$3.8M (revised)');
    expect(getIncidentDisplay(
      quillMonitor({ verification_status: 'verified', amount_status: 'reported' }),
      OPTIONS,
    ).lossLabel).toBe('~$3.8M reported');
  });

  it('hides implausible legacy amounts instead of showing a wrong loss', () => {
    // The old web3-incidents importer stored "$3,800,000" as 3.8e12 USD with
    // the display text "$3800000M". Those rows are still in the database.
    expect(getIncidentDisplay(
      quillMonitor({ provider: 'web3-incidents', amount_lost_usd: 3_800_000_000_000, amount_display: '$3800000M' }),
      OPTIONS,
    ).lossLabel).toBeNull();
  });

  it('lists every merged source for a web3-incidents record', () => {
    const display = getIncidentDisplay(base({
      id: 'web3-incidents:meter',
      title: 'Meter bridge exploit',
      summary: 'Meter said an attacker drained about $1.2M from its bridge on October 1 before the contracts were paused.',
      link: 'https://x.com/meter_io/status/1975100000000000000',
      sourceUrl: JSON.stringify([
        { url: 'https://x.com/meter_io/status/1975100000000000000', label: 'Meter statement' },
      ]),
      createdAt: new Date('2026-10-02T09:00:00.000Z'),
      metadata: {
        provider: 'web3-incidents',
        data_source: 'feed-1',
        is_web3_incident: true,
        incident_date: '2026-10-01',
        amount_lost_usd: 1_200_000,
        amount_display: '$1.2M',
        amount_status: 'reported',
        summary_origin: 'publisher',
        sources: [
          { provider: 'quillmonitor', url: QM_REFERENCE, label: 'QuillMonitor', amount_usd: 1_200_000 },
          {
            provider: 'web3-incidents',
            url: 'https://www.web3isgoinggreat.com/single/meter-bridge',
            label: 'Web3 Is Going Just Great',
            amount_usd: 1_200_000,
          },
        ],
      },
    }), OPTIONS);

    expect(display.sources).toEqual([
      { label: 'QuillMonitor', url: QM_REFERENCE },
      { label: 'Web3 Is Going Just Great', url: 'https://www.web3isgoinggreat.com/single/meter-bridge' },
      { label: 'Meter statement', url: 'https://x.com/meter_io/status/1975100000000000000' },
    ]);
    expect(display.verification).toBeNull();
    expect(display.verificationHelp).toBe('');
    expect(display.incidentDateLabel).toBe('Exploited Oct 1, 2026');
    expect(display.addedDateLabel).toBe('Added Oct 2');
    expect(display.lossLabel).toBe('~$1.2M reported');
    expect(display.summaryLabel).toBe('Excerpt');
  });

  it('names the publisher and labels only AI-written summaries for RSS items', () => {
    const rss = base({
      id: 'rss-1',
      category: 'vulnerability-disclosure',
      severity: 'critical',
      title: 'Vendor patches actively exploited VPN flaw',
      summary: 'The vendor released fixes for a remote code execution flaw that attackers are already using against exposed gateways.',
      sourceName: 'BleepingComputer',
      link: 'https://www.bleepingcomputer.com/news/security/vendor-patches-vpn-flaw/',
      sourceUrl: 'https://www.bleepingcomputer.com/feed/',
      publishedAt: new Date('2025-12-30T10:00:00.000Z'),
      isProcessed: true,
    });

    const legacy = getIncidentDisplay(rss, OPTIONS);
    expect(legacy.sources).toEqual([
      { label: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/news/security/vendor-patches-vpn-flaw/' },
    ]);
    expect(legacy.summaryLabel).toBeNull();
    expect(legacy.verification).toBeNull();
    expect(legacy.incidentDateLabel).toBeNull();
    expect(legacy.lossLabel).toBeNull();
    expect(legacy.addedDateLabel).toBe('Added Dec 30, 2025');

    expect(getIncidentDisplay({ ...rss, metadata: { summary_origin: 'ai' } }, OPTIONS).summaryLabel).toBe('AI summary');
  });

  it('returns no incident date when the source date is unknown or malformed', () => {
    expect(getIncidentDisplay(base({
      metadata: {
        provider: 'web3-incidents',
        data_source: 'feed-1',
        is_web3_incident: true,
        incident_date: '2026-10-01',
        incident_date_unknown: true,
      },
    }), OPTIONS).incidentDateLabel).toBeNull();
    expect(getIncidentDisplay(base({
      metadata: { is_web3_incident: true, incident_date: 'last week' },
    }), OPTIONS).incidentDateLabel).toBeNull();
  });

  it('always names at least one source, even without a link', () => {
    const display = getIncidentDisplay(base({
      link: '',
      metadata: { provider: 'web3-incidents', data_source: 'feed-2', is_web3_incident: true },
    }), OPTIONS);
    expect(display.sources).toEqual([{ label: 'QuillAudits hacks list', url: null }]);
  });

  it('never returns an unsafe source URL', () => {
    const display = getIncidentDisplay(base({
      sourceName: 'Example Tracker',
      metadata: {
        is_web3_incident: true,
        sources: [{ provider: 'other', url: 'javascript:alert(1)', label: 'Bad link', amount_usd: null }],
      },
    }), OPTIONS);
    expect(display.sources.length).toBeGreaterThan(0);
    expect(display.sources.every((source) => source.url === null || source.url.startsWith('https://'))).toBe(true);
  });
});
```

- [ ] **Step 4: Run the test to see it fail**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDisplay.test.ts`

Expected: FAIL with `Failed to resolve import "@/lib/threatIntel/incidentDisplay"`.

- [ ] **Step 5: Create the shared links module**

Create `src/lib/threatIntel/officialLinks.ts`:

```ts
/** Official Digibastion channels and the outside services Threat Intel pages link to. */

export const SITE_URL = 'https://www.digibastion.com';
export const TELEGRAM_CHANNEL_URL = 'https://t.me/digibastion';
export const TELEGRAM_CHANNEL_HANDLE = '@digibastion';
export const TELEGRAM_COMMUNITY_URL = 'https://t.me/digibastion_chat';
export const ALERTS_SENDER_EMAIL = 'alerts@digibastion.com';
/** Reply-to address used by the alert and digest emails. */
export const CORRECTIONS_EMAIL = 'support@digibastion.com';
export const METHODOLOGY_PATH = '/threat-intel/methodology';

export const QUILLMONITOR_DATABASE_URL = 'https://www.quillaudits.com/web3-hacks-database';
export const WEB3_IS_GOING_GREAT_URL = 'https://www.web3isgoinggreat.com/';

export const REVOKE_CASH_URL = 'https://revoke.cash';
export const CHAINABUSE_URL = 'https://www.chainabuse.com';
export const SEAL_911_URL = 'https://securityalliance.org/seal-911';
export const NVD_URL = 'https://nvd.nist.gov';
export const CISA_KEV_URL = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';
```

- [ ] **Step 6: Create the display model**

Create `src/lib/threatIntel/incidentDisplay.ts`:

```ts
import type { NewsArticle } from '@/types/news';
import { getNewsSourceLinks } from '@/utils/newsSources';
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
  isSlowMistArticle,
  SLOWMIST_ATTRIBUTION_URL,
} from '@/utils/newsIncident';
import { safeExternalUrl } from '@/utils/safeUrl';
import { readIncidentFields, type IncidentFields } from '../../../supabase/functions/_shared/incident-fields';
import { QUILLMONITOR_DATABASE_URL, WEB3_IS_GOING_GREAT_URL } from './officialLinks';

export type VerificationDisplay = 'confirmed' | 'unconfirmed';
export type SummaryLabel = 'AI summary' | 'Excerpt' | 'Provider summary';

export interface IncidentSourceLink {
  label: string;
  /** Null only when a record names its source but carries no safe link. */
  url: string | null;
}

export interface IncidentDisplay {
  verification: VerificationDisplay | null;
  /** Tooltip text for the verification badge. Empty when there is no status. */
  verificationHelp: string;
  /** "Exploited Sep 30, 2026", or null when the source gave no usable date. */
  incidentDateLabel: string | null;
  /** "Added Oct 9": when Digibastion stored the record. */
  addedDateLabel: string;
  /** "$3.8M" when confirmed, "~$3.8M reported" otherwise, null with no amount. */
  lossLabel: string | null;
  fundsReturned: boolean;
  /** At least one entry whenever the record names a provider or publisher. */
  sources: IncidentSourceLink[];
  summaryLabel: SummaryLabel | null;
}

export interface IncidentDisplayOptions {
  /** Reference time for deciding whether to print the year. Defaults to now. */
  now?: Date;
  /** IANA zone for the "Added" date. Defaults to the viewer's zone. */
  timeZone?: string;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const PENDING_SUMMARY = /^summary pending\.?$/i;

export const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatDay = (date: Date, timeZone: string | undefined, withYear: boolean): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
    timeZone,
  }).format(date);

const yearOf = (date: Date, timeZone: string | undefined): string =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone }).format(date);

const formatUsd = (amount: number): string => {
  const compact = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 1 });
  if (amount >= 1_000_000_000) return `$${compact(amount / 1_000_000_000)}B`;
  if (amount >= 1_000_000) return `$${compact(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `$${compact(amount / 1_000)}K`;
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/** Name of the tracker or publisher that supplied the record. */
export function getProviderLabel(article: NewsArticle): string | null {
  if (isQuillMonitorArticle(article)) return 'QuillMonitor';
  if (isSlowMistArticle(article)) return 'SlowMist Hacked';
  const provider = article.metadata?.provider;
  if (provider === 'web3-incidents' || provider === 'web3') {
    return article.metadata?.data_source === 'feed-2' ? 'QuillAudits hacks list' : 'Web3 Is Going Just Great';
  }
  return article.sourceName?.trim() || null;
}

export function resolveVerification(article: NewsArticle, fields: IncidentFields): VerificationDisplay | null {
  const status = fields.verification
    ?? (isPreliminaryQuillMonitorArticle(article) ? 'unverified' : article.metadata?.verification_status ?? null);
  if (status === 'verified') return 'confirmed';
  if (status === 'unverified') return 'unconfirmed';
  return null;
}

function getVerificationHelp(verification: VerificationDisplay | null, providerLabel: string | null): string {
  const source = providerLabel ?? 'The source';
  if (verification === 'confirmed') {
    return `${source} lists this incident as verified. Digibastion shows the source's status and does not verify incidents itself.`;
  }
  if (verification === 'unconfirmed') {
    return `${source} has not verified this report yet. Details and the loss figure may change.`;
  }
  return '';
}

/** The calendar day the incident happened, as midnight UTC, or null when unknown. */
export function getIncidentDate(
  article: NewsArticle,
  fields: IncidentFields = readIncidentFields(article.metadata),
): Date | null {
  if (fields.incidentDateUnknown || article.metadata?.incident_date_unknown === true) return null;
  const raw = fields.incidentDate
    ?? (typeof article.metadata?.incident_date === 'string' ? article.metadata.incident_date : null);
  const day = raw?.trim().slice(0, 10) ?? '';
  if (!ISO_DAY.test(day)) return null;
  const date = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

// The largest crypto theft on record is about $1.5B (Bybit, 2025). Anything
// above $100B is a parsing error from the old web3-incidents importer, so the
// card shows no figure rather than a wrong one.
const MAX_PLAUSIBLE_LOSS_USD = 100_000_000_000;

function getLossLabel(
  article: NewsArticle,
  fields: IncidentFields,
  verification: VerificationDisplay | null,
): string | null {
  const metadata = article.metadata;
  const rawAmount = metadata?.amount_lost_usd;
  if (typeof rawAmount === 'number' && rawAmount > MAX_PLAUSIBLE_LOSS_USD) return null;
  const amount = typeof rawAmount === 'number' && Number.isFinite(rawAmount) && rawAmount > 0 ? rawAmount : null;
  const rawDisplay = typeof metadata?.amount_display === 'string'
    ? metadata.amount_display.trim().replace(/^~\s*/, '')
    : '';
  const display = /\d/.test(rawDisplay) ? rawDisplay : amount !== null ? formatUsd(amount) : null;
  if (!display) return null;
  if (fields.amountStatus === 'revised') return `${display} (revised)`;
  const confirmed = fields.amountStatus === 'confirmed'
    || (fields.amountStatus === null && verification === 'confirmed');
  return confirmed ? display : `~${display} reported`;
}

function getSources(article: NewsArticle, fields: IncidentFields, providerLabel: string | null): IncidentSourceLink[] {
  const metadata = article.metadata;
  const quillMonitor = isQuillMonitorArticle(article);
  const slowMist = isSlowMistArticle(article);
  // Generic provider pages (database home pages) are attribution, not evidence.
  const providerPage = quillMonitor
    ? safeExternalUrl(metadata?.attribution_url) ?? QUILLMONITOR_DATABASE_URL
    : slowMist
      ? safeExternalUrl(metadata?.attribution_url) ?? SLOWMIST_ATTRIBUTION_URL
      : null;

  const linked: IncidentSourceLink[] = [];
  const unlinked: string[] = [];
  const seenUrls = new Set<string>();
  const seenLabels = new Set<string>();
  const add = (label: unknown, url: unknown) => {
    const name = typeof label === 'string' ? label.trim() : '';
    if (!name) return;
    const safe = safeExternalUrl(url);
    if (!safe) {
      unlinked.push(name);
      return;
    }
    if (seenUrls.has(safe)) return;
    seenUrls.add(safe);
    seenLabels.add(name.toLowerCase());
    linked.push({ label: name, url: safe });
  };

  for (const source of fields.sources) add(source.label || source.provider, source.url);

  if (quillMonitor) {
    add('QuillMonitor', safeExternalUrl(metadata?.reference_url) ?? providerPage);
  } else if (slowMist) {
    add('SlowMist Hacked', providerPage);
  } else if (providerLabel === 'Web3 Is Going Just Great' && !seenLabels.has(providerLabel.toLowerCase())) {
    add(providerLabel, WEB3_IS_GOING_GREAT_URL);
  }

  for (const link of getNewsSourceLinks(article, providerPage)) add(link.label, link.url);

  const result = [...linked];
  for (const name of unlinked) {
    if (seenLabels.has(name.toLowerCase())) continue;
    seenLabels.add(name.toLowerCase());
    result.push({ label: name, url: null });
  }
  if (result.length === 0 && providerLabel) result.push({ label: providerLabel, url: null });
  return result;
}

function getSummaryLabel(article: NewsArticle, fields: IncidentFields): SummaryLabel | null {
  const summary = article.summary?.trim() ?? '';
  if (!summary || PENDING_SUMMARY.test(summary)) return null;
  const legacy = article.metadata?.summary_origin;
  const origin = fields.summaryOrigin
    ?? (legacy === 'ai' ? 'ai' : legacy === 'provider' || legacy === 'provider-template' ? 'provider' : null);
  if (origin === 'ai') return 'AI summary';
  if (origin === 'publisher') return 'Excerpt';
  if (origin === 'provider') return 'Provider summary';
  return null;
}

export function getIncidentDisplay(article: NewsArticle, options: IncidentDisplayOptions = {}): IncidentDisplay {
  const fields = readIncidentFields(article.metadata);
  const now = options.now ?? new Date();
  const providerLabel = getProviderLabel(article);
  const verification = resolveVerification(article, fields);
  const incidentDate = getIncidentDate(article, fields);
  const added = toDate(article.createdAt) ?? toDate(article.publishedAt) ?? now;
  const addedWithYear = yearOf(added, options.timeZone) !== yearOf(now, options.timeZone);

  return {
    verification,
    verificationHelp: getVerificationHelp(verification, providerLabel),
    incidentDateLabel: incidentDate ? `Exploited ${formatDay(incidentDate, 'UTC', true)}` : null,
    addedDateLabel: `Added ${formatDay(added, options.timeZone, addedWithYear)}`,
    lossLabel: getLossLabel(article, fields, verification),
    fundsReturned: fields.fundsReturned === true,
    sources: getSources(article, fields, providerLabel),
    summaryLabel: getSummaryLabel(article, fields),
  };
}
```

- [ ] **Step 7: Run the test to see it pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/incidentDisplay.test.ts`

Expected: PASS, 9 tests. If the merged-sources, funds-returned or summary-source cases fail, print `readIncidentFields` output for that fixture. Section A reads `sources`, `summary_origin`, `amount_status`, `funds_returned`, `incident_date_unknown`, `incident_date` and `verification_status`. Fix the fixture keys to match section A rather than changing section A.

Then run `npx tsc --noEmit -p tsconfig.app.json` (expected: no errors) and `npx eslint src/lib/threatIntel/officialLinks.ts src/lib/threatIntel/incidentDisplay.ts src/utils/__tests__/incidentDisplay.test.ts src/types/news.ts` (expected: no errors).

- [ ] **Step 8: Commit**

```bash
git add src/lib/threatIntel/officialLinks.ts src/lib/threatIntel/incidentDisplay.ts src/utils/__tests__/incidentDisplay.test.ts src/types/news.ts
# add these two only if Step 1 or Step 2 changed them:
git add src/hooks/useNewsArticles.ts src/pages/News.tsx
git commit -m "feat(threat-intel): add incident display model" -m "One function decides the verification label, incident and added dates, loss wording, named sources and summary label for every card and incident page."
```

---
### Task C2: Incident cards

Cards become real links to `/threat-intel/:id`, so crawlers can follow them, people can open them in a new tab, and keyboards reach them without custom handlers. Each card shows a verification badge with an explanation, the incident date and the date added, the loss wording from C1, a "Funds returned" badge, and named sources with deep links.

**The stretched-link pattern.** An `<a>` may not contain another `<a>` or a `<button>`, and the card has both: external source links and the verification badge. So the card itself is not a link. The title is the only link to the incident page. Its `::after` pseudo-element is absolutely positioned over the whole card (`after:absolute after:inset-0`), and the card is the positioning context (`relative`). A click anywhere on the card lands on that overlay and follows the title link. The source links and the badge button are siblings of the title, not children, and carry `relative z-10` so they sit above the overlay and receive their own clicks. There is no `stopPropagation` anywhere, and screen readers hear one link per card, named by the title. The focus ring is drawn on the overlay (`focus-visible:after:ring-2`) so it outlines the whole card.

`onClick` stays as an optional prop. On a plain left click the card calls it and cancels the default navigation, so `News.tsx` keeps opening the article in place with the current filters in the query string. Ctrl, Cmd, Shift and middle clicks fall through to the browser and open the canonical URL.

**Files:**
- Create: `src/components/news/VerificationBadge.tsx`
- Modify: `src/components/news/NewsCard.tsx` (whole file, lines 1-212)
- Test: `src/components/news/__tests__/NewsCard.test.tsx` (whole file, lines 1-81)

**Interfaces:**
- Consumes: `getIncidentDisplay`, `VerificationDisplay` (C1); `getCategoryConfig(category: string): { name: string; color: string; description?: string }` from `src/lib/threatIntel/taxonomy.ts` (section B, returns a fallback for unknown categories); `isWeb3Incident`, `isSlowMistArticle` from `src/utils/newsIncident.ts`; `Tooltip`, `TooltipContent`, `TooltipProvider`, `TooltipTrigger` from `src/components/ui/tooltip.tsx`.
- Produces:
  - `VerificationBadge(props: { verification: VerificationDisplay; help: string; className?: string }): JSX.Element`. It renders a focusable `<button type="button">` named "Confirmed" or "Unconfirmed" followed by the help text (screen-reader only), with the help also in a tooltip. It brings its own `TooltipProvider`, so it works outside `App`.
  - `NewsCard(props: { article: NewsArticle; onClick?: () => void; href?: string })`. Same props as before plus an optional `href`.
  - `getArticleHref(articleId: string): string`, which returns `/threat-intel/${encodeURIComponent(articleId)}`.

- [ ] **Step 1: Write the failing tests**

Replace all of `src/components/news/__tests__/NewsCard.test.tsx` with:

```tsx
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsCard } from '@/components/news/NewsCard';
import type { NewsArticle } from '@/types/news';

const QM_DATABASE = 'https://www.quillaudits.com/web3-hacks-database';

const preliminaryArticle: NewsArticle = {
  id: 'quill-1',
  title: 'Example Bridge incident',
  summary: 'Summary pending',
  content: 'Incident details',
  category: 'defi-exploits',
  tags: ['quillmonitor'],
  severity: 'high',
  publishedAt: new Date('2026-09-29T00:00:00.000Z'),
  sourceName: 'QuillMonitor',
  isProcessed: true,
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    verification_status: 'unverified',
    summary_origin: 'provider',
    attribution_url: QM_DATABASE,
  },
};

const renderCard = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

afterEach(cleanup);

describe('NewsCard navigation', () => {
  it('renders the title as a crawlable link and opens it in place on a plain click', () => {
    const onClick = vi.fn();
    renderCard(<NewsCard article={preliminaryArticle} onClick={onClick} />);

    const title = screen.getByRole('link', { name: preliminaryArticle.title });
    expect(title.getAttribute('href')).toBe('/threat-intel/quill-1');

    fireEvent.click(title);
    expect(onClick).toHaveBeenCalledTimes(1);

    fireEvent.click(title, { ctrlKey: true });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps source links outside the card link', () => {
    const onClick = vi.fn();
    renderCard(<NewsCard article={preliminaryArticle} onClick={onClick} />);

    const source = screen.getByRole('link', { name: 'QuillMonitor' });
    expect(source.getAttribute('href')).toBe(QM_DATABASE);
    expect(source.getAttribute('target')).toBe('_blank');
    expect(source.closest('a[href="/threat-intel/quill-1"]')).toBeNull();

    fireEvent.click(source);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('NewsCard incident presentation', () => {
  it('labels unconfirmed records and keeps pending summaries unlabelled', () => {
    renderCard(<NewsCard article={preliminaryArticle} />);

    expect(screen.getByRole('button', { name: /^Unconfirmed/ })).not.toBeNull();
    expect(screen.getByText('Summary pending')).not.toBeNull();
    expect(screen.queryByText('AI summary')).toBeNull();
    expect(screen.queryByText('Preliminary')).toBeNull();
  });

  it('links the QuillMonitor reference instead of the database page when one exists', () => {
    renderCard(<NewsCard article={{
      ...preliminaryArticle,
      metadata: { ...preliminaryArticle.metadata, reference_url: 'https://x.com/peckshield/status/1975000000000000001' },
    }} />);

    expect(screen.getByRole('link', { name: 'QuillMonitor' }).getAttribute('href'))
      .toBe('https://x.com/peckshield/status/1975000000000000001');
  });

  it('shows confirmed status, both dates, the loss and funds returned', () => {
    renderCard(<NewsCard article={{
      ...preliminaryArticle,
      title: 'NEAR Intents: Bridge exploit ($3.8M loss)',
      createdAt: new Date('2026-10-09T12:00:00.000Z'),
      metadata: {
        ...preliminaryArticle.metadata,
        verification_status: 'verified',
        incident_date: '2026-09-30',
        project_name: 'NEAR Intents',
        amount_lost_usd: 3_800_000,
        amount_display: '$3.8M',
        funds_returned: true,
      },
    }} />);

    expect(screen.getByRole('button', { name: /^Confirmed/ })).not.toBeNull();
    expect(screen.queryByRole('button', { name: /^Unconfirmed/ })).toBeNull();
    expect(screen.getByText('Exploited Sep 30, 2026')).not.toBeNull();
    expect(screen.getByText(/^Added Oct 9/)).not.toBeNull();
    expect(screen.getByText('$3.8M')).not.toBeNull();
    expect(screen.getByText('Funds returned')).not.toBeNull();
  });

  it('shows the AI summary label only when the summary source is AI', () => {
    const rss: NewsArticle = {
      id: 'rss-1',
      title: 'Vendor patches actively exploited VPN flaw',
      summary: 'The vendor released fixes for a remote code execution flaw that attackers are already using.',
      content: 'Details',
      category: 'vulnerability-disclosure',
      tags: [],
      severity: 'critical',
      publishedAt: new Date('2026-10-08T10:00:00.000Z'),
      sourceName: 'BleepingComputer',
      link: 'https://www.bleepingcomputer.com/news/security/vendor-patches-vpn-flaw/',
      isProcessed: true,
    };

    renderCard(<NewsCard article={rss} />);
    expect(screen.queryByText('AI summary')).toBeNull();
    expect(screen.getByRole('link', { name: 'BleepingComputer' })).not.toBeNull();
    cleanup();

    renderCard(<NewsCard article={{ ...rss, metadata: { summary_origin: 'ai' } }} />);
    expect(screen.getByText('AI summary')).not.toBeNull();
  });

  it('renders a record whose category is no longer configured', () => {
    renderCard(<NewsCard article={{ ...preliminaryArticle, category: 'retired-category' as unknown as NewsArticle['category'] }} />);
    expect(screen.getByRole('link', { name: preliminaryArticle.title })).not.toBeNull();
  });
});

describe('NewsCard SlowMist presentation', () => {
  it('names SlowMist as the source without repeating it as the author', () => {
    renderCard(<NewsCard article={{
      ...preliminaryArticle,
      id: 'slowmist:1',
      sourceName: 'SlowMist Hacked',
      author: 'SlowMist',
      isProcessed: true,
      metadata: {
        provider: 'slowmist',
        is_web3_incident: true,
        summary_origin: 'provider-template',
        attribution_url: 'https://hacked.slowmist.io/en/',
      },
    }} />);

    const source = screen.getByRole('link', { name: 'SlowMist Hacked' });
    expect(source.getAttribute('href')).toBe('https://hacked.slowmist.io/en/');
    expect(screen.queryByText('by SlowMist')).toBeNull();
    expect(screen.queryByRole('link', { name: 'QuillMonitor' })).toBeNull();
    expect(screen.queryByText('AI summary')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `rtk proxy npx vitest run src/components/news/__tests__/NewsCard.test.tsx`

Expected: FAIL. The first test reports `Unable to find an accessible element with the role "link" and name "Example Bridge incident"`, because the title is still a `<button>`. The badge and source tests fail on the missing "Unconfirmed" button and the missing "QuillMonitor" link.

- [ ] **Step 3: Create the verification badge**

Create `src/components/news/VerificationBadge.tsx`:

```tsx
import { ShieldAlert, ShieldCheck, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { VerificationDisplay } from '@/lib/threatIntel/incidentDisplay';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  verification: VerificationDisplay;
  /** Explanation shown in the tooltip and read by screen readers. */
  help: string;
  className?: string;
}

const STYLES: Record<VerificationDisplay, { label: string; className: string; icon: LucideIcon }> = {
  confirmed: {
    label: 'Confirmed',
    className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    icon: ShieldCheck,
  },
  unconfirmed: {
    label: 'Unconfirmed',
    className: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    icon: ShieldAlert,
  },
};

export function VerificationBadge({ verification, help, className }: VerificationBadgeProps) {
  const style = STYLES[verification];
  const Icon = style.icon;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              style.className,
              className,
            )}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            {style.label}
            {help && <span className="sr-only">. {help}</span>}
          </button>
        </TooltipTrigger>
        {help && <TooltipContent className="max-w-xs text-xs leading-5">{help}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
```

- [ ] **Step 4: Rewrite the card**

Replace all of `src/components/news/NewsCard.tsx` with:

```tsx
import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { NewsArticle } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, ExternalLink, Info, RadioTower, Sparkles, Undo2, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerificationBadge } from '@/components/news/VerificationBadge';
import { getIncidentDisplay } from '@/lib/threatIntel/incidentDisplay';
import { getCategoryConfig } from '@/lib/threatIntel/taxonomy';
import { isSlowMistArticle, isWeb3Incident } from '@/utils/newsIncident';

interface NewsCardProps {
  article: NewsArticle;
  /**
   * Opens the article inside the current page on a plain left click.
   * Modified clicks (new tab, new window) fall through to the browser.
   */
  onClick?: () => void;
  /** Defaults to the canonical incident URL. */
  href?: string;
}

const MAX_CARD_SOURCES = 3;

export const getArticleHref = (articleId: string) => `/threat-intel/${encodeURIComponent(articleId)}`;

const isPlainLeftClick = (event: MouseEvent<HTMLAnchorElement>) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />;
    case 'high':
      return <Zap className="w-4 h-4 text-orange-500" aria-hidden="true" />;
    case 'medium':
      return <Info className="w-4 h-4 text-yellow-500" aria-hidden="true" />;
    default:
      return <Info className="w-4 h-4 text-blue-500" aria-hidden="true" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'high':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
};

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'severity-critical';
    case 'high':
      return 'severity-high';
    case 'medium':
      return 'severity-medium';
    case 'low':
      return 'severity-low';
    default:
      return 'glass-card';
  }
};

export const NewsCard = ({ article, onClick, href }: NewsCardProps) => {
  const categoryInfo = getCategoryConfig(article.category);
  const web3Incident = isWeb3Incident(article);
  const display = getIncidentDisplay(article);
  const unconfirmed = display.verification === 'unconfirmed';
  const duplicateProviderAuthor = isSlowMistArticle(article) && article.author?.toLowerCase().includes('slowmist');
  const visibleSources = display.sources.slice(0, MAX_CARD_SOURCES);
  const hiddenSourceCount = display.sources.length - visibleSources.length;
  const metadata = article.metadata;

  const handleTitleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onClick || !isPlainLeftClick(event)) return;
    event.preventDefault();
    onClick();
  };

  // Stretched link: the title link's ::after overlay covers the card, so the
  // whole card is clickable while the DOM holds one link to the incident page.
  // The verification badge and the source links are siblings of the title and
  // sit above the overlay (relative z-10), so they keep their own clicks.
  // Unconfirmed items drop the severity glow so they do not read as confirmed.
  return (
    <Card
      className={`news-card group relative ${
        unconfirmed ? 'glass-card border-dashed border-amber-500/40' : getSeverityClass(article.severity)
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={categoryInfo.color}>
            {categoryInfo.name}
          </Badge>
          <Badge
            variant="outline"
            className={`${getSeverityColor(article.severity)} ${unconfirmed ? 'border-dashed' : ''}`}
          >
            {getSeverityIcon(article.severity)}
            <span className="ml-1 capitalize">{article.severity}</span>
          </Badge>
          {web3Incident && (
            <Badge variant="secondary" className="gap-1">
              <RadioTower className="w-3 h-3" aria-hidden="true" />
              Web3 Incident
            </Badge>
          )}
          {display.verification && (
            <VerificationBadge
              verification={display.verification}
              help={display.verificationHelp}
              className="relative z-10"
            />
          )}
          {display.fundsReturned && (
            <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
              <Undo2 className="h-3 w-3" aria-hidden="true" />
              Funds returned
            </Badge>
          )}
        </div>

        <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
          <Link
            to={href ?? getArticleHref(article.id)}
            onClick={handleTitleClick}
            className="text-inherit after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
          >
            {article.title}
          </Link>
        </CardTitle>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {web3Incident
              ? (display.incidentDateLabel ?? 'Incident date unknown')
              : `Published ${formatDistanceToNow(article.publishedAt, { addSuffix: true })}`}
          </span>
          {web3Incident && <span>{display.addedDateLabel}</span>}
          {article.author && !duplicateProviderAuthor && (
            <span>by {article.author}</span>
          )}
        </div>

        {visibleSources.length > 0 && (
          <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span>{visibleSources.length > 1 ? 'Sources:' : visibleSources[0].label === 'QuillMonitor' ? 'Powered by' : 'Source:'}</span>
            {visibleSources.map((source) => (source.url ? (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-sm underline decoration-primary/50 underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {source.label}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : (
              <span key={`label:${source.label}`}>{source.label}</span>
            )))}
            {hiddenSourceCount > 0 && <span>+{hiddenSourceCount} more</span>}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-3">
          {display.summaryLabel && (
            <Badge
              variant="outline"
              className={`mb-2 text-xs ${
                display.summaryLabel === 'AI summary'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-muted/40 text-muted-foreground'
              }`}
            >
              {display.summaryLabel === 'AI summary' && <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />}
              {display.summaryLabel}
            </Badge>
          )}
          <CardDescription className="text-sm text-foreground/70 leading-relaxed">
            {article.summary}
          </CardDescription>
        </div>

        {article.affectedTechnologies && article.affectedTechnologies.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-muted-foreground mb-1">Affected Technologies:</div>
            <div className="flex flex-wrap gap-1">
              {article.affectedTechnologies.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs px-2 py-1">
                  {tech}
                </Badge>
              ))}
              {article.affectedTechnologies.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{article.affectedTechnologies.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {web3Incident && (metadata?.project_name || metadata?.chain || metadata?.attack_type || display.lossLabel) && (
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            {metadata?.project_name && <div><span className="text-muted-foreground">Project</span><div className="font-medium truncate">{metadata.project_name}</div></div>}
            {metadata?.chain && <div><span className="text-muted-foreground">Chain</span><div className="font-medium truncate">{metadata.chain}</div></div>}
            {metadata?.attack_type && <div><span className="text-muted-foreground">Attack</span><div className="font-medium truncate">{metadata.attack_type}</div></div>}
            {display.lossLabel && <div><span className="text-muted-foreground">Loss</span><div className="font-medium">{display.lossLabel}</div></div>}
          </div>
        )}

        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {article.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs px-2 py-1 bg-muted/50">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

- [ ] **Step 5: Run the tests to see them pass**

Run: `rtk proxy npx vitest run src/components/news/__tests__/NewsCard.test.tsx`

Expected: PASS, 8 tests.

Run: `rtk proxy npx vitest run src/pages/__tests__/News.navigation.test.tsx`

Expected: PASS, 2 tests. The page renders the real `NewsCard` inside `RouterProvider`, so the `Link` has router context.

Then run `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint src/components/news/NewsCard.tsx src/components/news/VerificationBadge.tsx src/components/news/__tests__/NewsCard.test.tsx`. Expected: no errors.

- [ ] **Step 6: Check the card by hand**

Run `npm run dev`, open `http://127.0.0.1:8080/threat-intel` at 390px wide and at desktop width, and check:
- clicking empty card space opens the incident;
- Cmd or Ctrl-click opens `/threat-intel/<id>` in a new tab;
- a source link opens the source in a new tab and does not open the incident;
- Tab moves focus to the badge, then the title (ring around the whole card), then each source link;
- hovering or focusing the badge shows the tooltip text.

- [ ] **Step 7: Commit**

```bash
git add src/components/news/NewsCard.tsx src/components/news/VerificationBadge.tsx src/components/news/__tests__/NewsCard.test.tsx
git commit -m "feat(threat-intel): make incident cards real links with sources and status" -m "Cards use a stretched title link, so they are crawlable and open in new tabs. Source links and the verification badge sit above the overlay instead of inside the link. Cards show confirmed/unconfirmed, incident and added dates, loss wording, funds returned and named sources, and only label AI-written summaries as AI."
```

---
### Task C3: Incident page

The incident page gets the same display model as the cards. The generic "Immediate Action Required" list, which told readers of every critical item to "update affected software immediately", becomes a "What should I do?" block with specific places to go. The page also gains a status history, a "Get alerts like this" card that opens the subscribe form pre-filled with this incident's category and scope, and a Telegram button.

`SubscriptionForm` cannot read URL parameters today: it starts with no categories and scope `all`. This task adds two optional props, `initialCategories` and `initialScope`. `News.tsx` already parses `?categories=` and `?scope=` from the URL, so it passes them in when the subscribe tab mounts. The form does not need router access.

**Files:**
- Modify: `src/lib/threatIntel/officialLinks.ts` (append two functions)
- Modify: `src/lib/threatIntel/incidentDisplay.ts` (imports; append `getStatusHistory`)
- Modify: `src/utils/__tests__/incidentDisplay.test.ts` (import line; append a `describe`)
- Create test: `src/utils/__tests__/officialLinks.test.ts`
- Modify: `src/components/news/NewsDetail.tsx` (lines 6-7, 14-21, 36-49, 193-197, 211-228, 241, 248, 254, 315-339, 379-381, 408, 436-438)
- Modify: `src/components/news/__tests__/NewsDetail.test.tsx` (whole file)
- Modify: `src/components/news/SubscriptionForm.tsx` (lines 34-38)
- Create test: `src/components/news/__tests__/SubscriptionForm.test.tsx`
- Modify: `src/pages/News.tsx` (the `<SubscriptionForm />` line, about line 1168)

**Interfaces:**
- Consumes: C1 exports (`getIncidentDisplay`, `getProviderLabel`, `getIncidentDate`, `resolveVerification`, `toDate`, `formatDay`, the link constants); C2 `VerificationBadge`; `getCategoryConfig` (section B); `isWeb3Incident`, `isWeb3SecurityDomain` from `src/utils/newsIncident.ts`.
- Produces:
  - `nvdCveUrl(cveId?: string | null): string`. NVD detail URL for a well-formed CVE id, otherwise the NVD home page.
  - `buildSubscribeHref(options?: { categories?: readonly string[]; scope?: ThreatIntelScope }): string`. Returns `/threat-intel?tab=subscribe[&categories=a,b][&scope=x]`.
  - `interface StatusHistoryEntry { label: string; detail: string }`
  - `getStatusHistory(article: NewsArticle, options?: { timeZone?: string }): StatusHistoryEntry[]`. Empty for ordinary news items.
  - `SubscriptionForm(props: { initialCategories?: NewsCategory[]; initialScope?: ThreatIntelScope })`

- [ ] **Step 1: Write the failing helper tests**

Create `src/utils/__tests__/officialLinks.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildSubscribeHref, nvdCveUrl } from '@/lib/threatIntel/officialLinks';

describe('nvdCveUrl', () => {
  it('links straight to a well-formed CVE record', () => {
    expect(nvdCveUrl('CVE-2026-12345')).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-12345');
    expect(nvdCveUrl(' cve-2026-12345 ')).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-12345');
  });

  it('falls back to the NVD home page for anything else', () => {
    expect(nvdCveUrl('not-a-cve')).toBe('https://nvd.nist.gov');
    expect(nvdCveUrl(undefined)).toBe('https://nvd.nist.gov');
  });
});

describe('buildSubscribeHref', () => {
  it('opens the subscribe tab with the category and scope pre-selected', () => {
    expect(buildSubscribeHref({ categories: ['defi-exploits'], scope: 'web3-incidents' }))
      .toBe('/threat-intel?tab=subscribe&categories=defi-exploits&scope=web3-incidents');
    expect(buildSubscribeHref({ categories: ['web3-security', 'defi-exploits'] }))
      .toBe('/threat-intel?tab=subscribe&categories=web3-security%2Cdefi-exploits');
    expect(buildSubscribeHref()).toBe('/threat-intel?tab=subscribe');
  });
});
```

In `src/utils/__tests__/incidentDisplay.test.ts`:

Before:
```ts
import { getIncidentDisplay } from '@/lib/threatIntel/incidentDisplay';
```
After:
```ts
import { getIncidentDisplay, getStatusHistory } from '@/lib/threatIntel/incidentDisplay';
```

Append to the end of the same file:

```ts
describe('getStatusHistory', () => {
  it('lists the incident date, the first report and the verification for a verified incident', () => {
    expect(getStatusHistory(
      quillMonitor({ verification_status: 'verified', provider_updated_at: '2026-10-01T08:30:00.000Z' }),
      { timeZone: 'UTC' },
    )).toEqual([
      { label: 'Incident date', detail: 'Sep 30, 2026' },
      { label: 'First reported on Digibastion', detail: 'Oct 9, 2026, 2:05 PM UTC' },
      { label: 'Verified by QuillMonitor', detail: 'Status as of Oct 1, 2026, 8:30 AM UTC' },
    ]);
  });

  it('says when an incident is still waiting for verification or has no date', () => {
    expect(getStatusHistory(
      quillMonitor({ verification_status: 'unverified', incident_date_unknown: true }),
      { timeZone: 'UTC' },
    )).toEqual([
      { label: 'Incident date', detail: 'Not given by the source' },
      { label: 'First reported on Digibastion', detail: 'Oct 9, 2026, 2:05 PM UTC' },
      { label: 'Awaiting verification', detail: 'QuillMonitor has not verified this report yet' },
    ]);
  });

  it('returns nothing for ordinary news items', () => {
    expect(getStatusHistory(base({ category: 'vulnerability-disclosure', sourceName: 'BleepingComputer' }))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the helper tests to see them fail**

Run: `rtk proxy npx vitest run src/utils/__tests__/officialLinks.test.ts src/utils/__tests__/incidentDisplay.test.ts`

Expected: FAIL. `officialLinks.test.ts` fails with `buildSubscribeHref is not a function` (or `nvdCveUrl is not a function`). `incidentDisplay.test.ts` fails with `getStatusHistory is not a function`.

- [ ] **Step 3: Add the helpers**

Append to `src/lib/threatIntel/officialLinks.ts`:

```ts

const CVE_ID = /^CVE-\d{4}-\d{4,}$/i;

/** NVD record for a well-formed CVE id, otherwise the NVD home page. */
export function nvdCveUrl(cveId?: string | null): string {
  const id = cveId?.trim() ?? '';
  return CVE_ID.test(id) ? `${NVD_URL}/vuln/detail/${id.toUpperCase()}` : NVD_URL;
}

/** Link to the subscribe tab with categories and scope pre-selected. */
export function buildSubscribeHref(
  { categories = [], scope }: { categories?: readonly string[]; scope?: 'all' | 'web3-incidents' } = {},
): string {
  const params = new URLSearchParams({ tab: 'subscribe' });
  if (categories.length > 0) params.set('categories', categories.join(','));
  if (scope) params.set('scope', scope);
  return `/threat-intel?${params.toString()}`;
}
```

In `src/lib/threatIntel/incidentDisplay.ts`:

Before:
```ts
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
  isSlowMistArticle,
  SLOWMIST_ATTRIBUTION_URL,
} from '@/utils/newsIncident';
```
After:
```ts
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
  isSlowMistArticle,
  isWeb3Incident,
  SLOWMIST_ATTRIBUTION_URL,
} from '@/utils/newsIncident';
```

Append to the end of `src/lib/threatIntel/incidentDisplay.ts`:

```ts

export interface StatusHistoryEntry {
  label: string;
  detail: string;
}

const formatDateTime = (date: Date, timeZone: string | undefined): string =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'short',
  })
    .format(date)
    // Newer ICU builds put a narrow no-break space before AM/PM.
    .replace(/ /g, ' ');

/** Incident timeline for the incident page. Empty for ordinary news items. */
export function getStatusHistory(
  article: NewsArticle,
  options: Pick<IncidentDisplayOptions, 'timeZone'> = {},
): StatusHistoryEntry[] {
  const fields = readIncidentFields(article.metadata);
  const verification = resolveVerification(article, fields);
  if (!isWeb3Incident(article) && verification === null) return [];

  const provider = getProviderLabel(article) ?? 'The source';
  const entries: StatusHistoryEntry[] = [];

  const incidentDate = getIncidentDate(article, fields);
  entries.push({
    label: 'Incident date',
    detail: incidentDate ? formatDay(incidentDate, 'UTC', true) : 'Not given by the source',
  });

  const firstReported = toDate(article.createdAt) ?? toDate(article.publishedAt);
  if (firstReported) {
    entries.push({ label: 'First reported on Digibastion', detail: formatDateTime(firstReported, options.timeZone) });
  }

  if (verification === 'confirmed') {
    const updated = toDate(article.metadata?.provider_updated_at);
    entries.push({
      label: `Verified by ${provider}`,
      detail: updated ? `Status as of ${formatDateTime(updated, options.timeZone)}` : 'Date not provided',
    });
  } else if (verification === 'unconfirmed') {
    entries.push({ label: 'Awaiting verification', detail: `${provider} has not verified this report yet` });
  }

  return entries;
}
```

- [ ] **Step 4: Run the helper tests to see them pass**

Run: `rtk proxy npx vitest run src/utils/__tests__/officialLinks.test.ts src/utils/__tests__/incidentDisplay.test.ts`

Expected: PASS (3 + 11 tests).

- [ ] **Step 5: Write the failing component tests**

Replace all of `src/components/news/__tests__/NewsDetail.test.tsx` with:

```tsx
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsDetail } from '@/components/news/NewsDetail';
import type { NewsArticle } from '@/types/news';

vi.mock('@/hooks/useRelatedArticles', () => ({
  useRelatedArticles: () => ({ relatedArticles: [], isLoading: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const slowMistArticle: NewsArticle = {
  id: 'slowmist:1',
  title: 'Example protocol incident',
  summary: 'SlowMist incident summary',
  content: 'SlowMist incident details',
  category: 'web3-security',
  tags: ['slowmist'],
  severity: 'high',
  publishedAt: new Date('2026-09-29T00:00:00Z'),
  sourceName: 'SlowMist Hacked',
  author: 'SlowMist',
  link: 'https://example.com/reference',
  sourceUrl: JSON.stringify([
    { url: 'https://example.com/reference', label: 'Incident reference' },
    { url: 'https://hacked.slowmist.io/en/', label: 'SlowMist Hacked database' },
  ]),
  metadata: {
    provider: 'slowmist',
    is_web3_incident: true,
    attribution_url: 'https://hacked.slowmist.io/en/',
  },
};

const quillArticle: NewsArticle = {
  id: 'quillmonitor:near-intents',
  title: 'NEAR Intents: Bridge exploit ($3.8M loss)',
  summary: 'Summary pending',
  content: 'Affected project: NEAR Intents',
  category: 'defi-exploits',
  tags: ['quillmonitor'],
  severity: 'critical',
  publishedAt: new Date('2026-09-30T00:00:00.000Z'),
  createdAt: new Date('2026-10-09T14:05:00.000Z'),
  sourceName: 'QuillMonitor',
  author: 'QuillAudits',
  link: 'https://x.com/peckshield/status/1975000000000000001',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    verification_status: 'unverified',
    incident_date: '2026-09-30',
    amount_lost_usd: 3_800_000,
    amount_display: '$3.8M',
    reference_url: 'https://x.com/peckshield/status/1975000000000000001',
    attribution_url: 'https://www.quillaudits.com/web3-hacks-database',
    summary_origin: 'provider',
  },
};

const vulnerabilityArticle: NewsArticle = {
  id: 'rss-1',
  title: 'Vendor patches actively exploited VPN flaw',
  summary: 'The vendor released fixes for a remote code execution flaw that attackers are already using.',
  content: 'Details',
  category: 'vulnerability-disclosure',
  tags: [],
  severity: 'critical',
  publishedAt: new Date('2026-10-08T10:00:00.000Z'),
  sourceName: 'BleepingComputer',
  link: 'https://www.bleepingcomputer.com/news/security/vendor-patches-vpn-flaw/',
  cveId: 'CVE-2026-12345',
};

const renderDetail = (article: NewsArticle) => render(
  <MemoryRouter>
    <NewsDetail article={article} onBack={vi.fn()} />
  </MemoryRouter>,
);

afterEach(cleanup);

describe('NewsDetail SlowMist attribution', () => {
  it('separates provider attribution from de-duplicated original sources', () => {
    renderDetail(slowMistArticle);

    expect(screen.getByText('Threat intelligence provided by')).not.toBeNull();
    const provider = screen.getByRole('link', { name: 'SlowMist Hacked' });
    expect(provider.getAttribute('href')).toBe('https://hacked.slowmist.io/en/');
    expect(screen.queryByText('by SlowMist')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Original Source' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Incident reference' })).not.toBeNull();
    expect(screen.getAllByText('SlowMist Hacked')).toHaveLength(1);
  });

  it('renders a record whose category is no longer configured', () => {
    renderDetail({ ...slowMistArticle, category: 'retired-category' as unknown as NewsArticle['category'] });
    expect(screen.getByRole('heading', { level: 1, name: slowMistArticle.title })).not.toBeNull();
  });
});

describe('NewsDetail next steps', () => {
  it('gives specific next steps for a Web3 incident instead of a generic action list', () => {
    renderDetail(quillArticle);

    expect(screen.queryByText('Immediate Action Required')).toBeNull();
    expect(screen.getByRole('heading', { name: 'What should I do?' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Revoke.cash' }).getAttribute('href')).toBe('https://revoke.cash');
    expect(screen.getByRole('link', { name: 'Chainabuse' }).getAttribute('href')).toBe('https://www.chainabuse.com');
    expect(screen.getByRole('link', { name: 'SEAL 911' }).getAttribute('href')).toBe('https://securityalliance.org/seal-911');
    expect(screen.getByRole('heading', { name: 'Unconfirmed report' })).not.toBeNull();
    expect(screen.getByRole('button', { name: /^Unconfirmed/ })).not.toBeNull();
    expect(screen.getByText('~$3.8M reported')).not.toBeNull();
    expect(screen.getByText('Exploited Sep 30, 2026')).not.toBeNull();
  });

  it('points vulnerability items to the vendor advisory, NVD and CISA KEV', () => {
    renderDetail(vulnerabilityArticle);

    expect(screen.queryByText('Immediate Action Required')).toBeNull();
    expect(screen.getByRole('link', { name: 'NVD' }).getAttribute('href'))
      .toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-12345');
    expect(screen.getByRole('link', { name: 'CISA Known Exploited Vulnerabilities catalog' }).getAttribute('href'))
      .toBe('https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
    expect(screen.queryByRole('link', { name: 'Revoke.cash' })).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Status history' })).toBeNull();
  });
});

describe('NewsDetail status and alerts', () => {
  it('shows a status history for a verified incident', () => {
    renderDetail({
      ...quillArticle,
      metadata: { ...quillArticle.metadata, verification_status: 'verified', provider_updated_at: '2026-10-01T08:30:00.000Z' },
    });

    expect(screen.getByRole('heading', { name: 'Status history' })).not.toBeNull();
    expect(screen.getByText('Incident date')).not.toBeNull();
    expect(screen.getByText('First reported on Digibastion')).not.toBeNull();
    expect(screen.getByText('Verified by QuillMonitor')).not.toBeNull();
    expect(screen.queryByRole('heading', { name: 'Unconfirmed report' })).toBeNull();
  });

  it('links to pre-filled email alerts and the Telegram channel', () => {
    renderDetail(quillArticle);

    expect(screen.getByRole('heading', { name: 'Get alerts like this' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Get email alerts' }).getAttribute('href'))
      .toBe('/threat-intel?tab=subscribe&categories=defi-exploits&scope=web3-incidents');
    expect(screen.getByRole('link', { name: 'Join @digibastion on Telegram' }).getAttribute('href'))
      .toBe('https://t.me/digibastion');
  });
});
```

Create `src/components/news/__tests__/SubscriptionForm.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock('@/hooks/useSubscriberCount', () => ({
  useSubscriberCount: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

afterEach(cleanup);

describe('SubscriptionForm pre-fill', () => {
  it('starts with the categories and scope it was opened with', () => {
    render(<SubscriptionForm initialCategories={['defi-exploits']} initialScope="web3-incidents" />);

    expect(document.getElementById('category-defi-exploits')?.getAttribute('aria-checked')).toBe('true');
    expect(document.getElementById('category-supply-chain')?.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('button', { name: 'Web3 Incidents' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps the old defaults when opened without a view', () => {
    render(<SubscriptionForm />);

    expect(document.getElementById('category-defi-exploits')?.getAttribute('aria-checked')).toBe('false');
    expect(screen.getByRole('button', { name: 'All Intelligence' }).getAttribute('aria-pressed')).toBe('true');
  });
});
```

- [ ] **Step 6: Run the component tests to see them fail**

Run: `rtk proxy npx vitest run src/components/news/__tests__/NewsDetail.test.tsx src/components/news/__tests__/SubscriptionForm.test.tsx`

Expected: FAIL. `NewsDetail` fails on the missing "What should I do?" heading and the missing alert links. The unknown-category test throws `Cannot read properties of undefined (reading 'color')`. `SubscriptionForm` fails the first case because `category-defi-exploits` reports `aria-checked="false"`.

- [ ] **Step 7: Update the incident page**

All edits are in `src/components/news/NewsDetail.tsx`.

7a. Icons and category config (lines 6-7).

Before:
```tsx
import { ArrowLeft, ExternalLink, Clock, AlertTriangle, Info, Zap, Share, Bookmark, Home, Newspaper, ChevronRight, Loader2, RadioTower } from 'lucide-react';
import { newsCategoryConfig } from '@/data/newsData';
```
After:
```tsx
import { ArrowLeft, ExternalLink, Clock, AlertTriangle, Info, Zap, Share, Bookmark, Home, Newspaper, ChevronRight, Loader2, RadioTower, LifeBuoy, History, BellRing, Send, Undo2 } from 'lucide-react';
import { getCategoryConfig } from '@/lib/threatIntel/taxonomy';
```

7b. Display-model imports (lines 14-21).

Before:
```tsx
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
  isSlowMistArticle,
  isWeb3Incident,
  SLOWMIST_ATTRIBUTION_URL,
} from '@/utils/newsIncident';
import { getNewsSourceLinks } from '@/utils/newsSources';
```
After:
```tsx
import {
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
  isSlowMistArticle,
  isWeb3Incident,
  isWeb3SecurityDomain,
  SLOWMIST_ATTRIBUTION_URL,
} from '@/utils/newsIncident';
import { getNewsSourceLinks } from '@/utils/newsSources';
import { getIncidentDisplay, getProviderLabel, getStatusHistory } from '@/lib/threatIntel/incidentDisplay';
import {
  buildSubscribeHref,
  CHAINABUSE_URL,
  CISA_KEV_URL,
  nvdCveUrl,
  REVOKE_CASH_URL,
  SEAL_911_URL,
  TELEGRAM_CHANNEL_URL,
} from '@/lib/threatIntel/officialLinks';
import { VerificationBadge } from '@/components/news/VerificationBadge';
```

7c. Derived values (lines 36-49).

Before:
```tsx
  const categoryInfo = newsCategoryConfig[article.category];
  const isQuillMonitor = isQuillMonitorArticle(article);
  const isSlowMist = isSlowMistArticle(article);
  const isPreliminary = isPreliminaryQuillMonitorArticle(article);
  const web3Incident = isWeb3Incident(article);
  const slowMistAttributionUrl = isSlowMist
    ? safeExternalUrl(article.metadata?.attribution_url) || SLOWMIST_ATTRIBUTION_URL
    : null;
  const originalSources = getNewsSourceLinks(article, slowMistAttributionUrl);
  const duplicateProviderAuthor = isSlowMist && article.author?.toLowerCase().includes('slowmist');
  const providerIncidentDate = isQuillMonitor && /^\d{4}-\d{2}-\d{2}$/.test(article.metadata?.incident_date || '')
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' })
        .format(new Date(`${article.metadata?.incident_date}T00:00:00.000Z`))
    : null;
```
After:
```tsx
  const categoryInfo = getCategoryConfig(article.category);
  const isQuillMonitor = isQuillMonitorArticle(article);
  const isSlowMist = isSlowMistArticle(article);
  const web3Incident = isWeb3Incident(article);
  const display = getIncidentDisplay(article);
  const statusHistory = getStatusHistory(article);
  const isUnconfirmed = display.verification === 'unconfirmed';
  const providerLabel = getProviderLabel(article) ?? 'The source';
  const slowMistAttributionUrl = isSlowMist
    ? safeExternalUrl(article.metadata?.attribution_url) || SLOWMIST_ATTRIBUTION_URL
    : null;
  const originalSources = getNewsSourceLinks(article, slowMistAttributionUrl);
  const duplicateProviderAuthor = isSlowMist && article.author?.toLowerCase().includes('slowmist');
  const showWeb3Actions = web3Incident || isWeb3SecurityDomain(article);
  const showVulnerabilityActions = Boolean(article.cveId) || article.category === 'vulnerability-disclosure';
  const subscribeHref = buildSubscribeHref({
    categories: [article.category],
    scope: web3Incident ? 'web3-incidents' : 'all',
  });
```

7d. Header badges (lines 193-197).

Before:
```tsx
            {isPreliminary && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                Preliminary
              </Badge>
            )}
            {article.cveId && (
```
After:
```tsx
            {display.verification && (
              <VerificationBadge verification={display.verification} help={display.verificationHelp} />
            )}
            {display.fundsReturned && (
              <Badge variant="outline" className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                <Undo2 className="h-3 w-3" aria-hidden="true" />
                Funds returned
              </Badge>
            )}
            {article.cveId && (
```

7e. Dates (lines 212-217). Only the first branch changes; keep the `) : (` branch with the "Published" lines as it is.

Before:
```tsx
            {providerIncidentDate ? (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Incident date {providerIncidentDate}</span>
              </div>
            ) : (
```
After:
```tsx
            {web3Incident ? (
              <>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>{display.incidentDateLabel ?? 'Incident date unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span aria-hidden="true">•</span>
                  <span>{display.addedDateLabel}</span>
                </div>
              </>
            ) : (
```

7f. Summary heading (line 241).

Before:
```tsx
            <h3 className="font-semibold mb-2">Summary</h3>
```
After:
```tsx
            <h3 className="font-semibold mb-2">{display.summaryLabel ?? 'Summary'}</h3>
```

7g. Loss in the incident grid (lines 248 and 254).

Before:
```tsx
          {web3Incident && (article.metadata?.project_name || article.metadata?.chain || article.metadata?.attack_type || article.metadata?.amount_display) && (
```
After:
```tsx
          {web3Incident && (article.metadata?.project_name || article.metadata?.chain || article.metadata?.attack_type || display.lossLabel) && (
```

Before:
```tsx
                {article.metadata?.amount_display && <div><div className="text-xs text-muted-foreground">Reported loss</div><div className="font-medium">{article.metadata.amount_display}</div></div>}
```
After:
```tsx
                {display.lossLabel && <div><div className="text-xs text-muted-foreground">Loss</div><div className="font-medium">{display.lossLabel}</div></div>}
```

7h. Replace the action block (lines 315-339, from `{/* Action Items */}` through the `) : null}` line).

Before:
```tsx
          {/* Action Items */}
          {isPreliminary ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                Preliminary report
              </h3>
              <p className="text-sm text-foreground/80">
                QuillMonitor verification is pending. Details, incident date, and reported loss may change; verify against the linked source before acting.
              </p>
            </div>
          ) : article.severity === 'critical' && !isQuillMonitor ? (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Immediate Action Required
              </h3>
              <ul className="text-sm text-foreground/80 space-y-1 ml-4">
                <li>• Update affected software immediately</li>
                <li>• Review your systems for potential compromise</li>
                <li>• Monitor for unusual activity</li>
                <li>• Consider temporary isolation of affected systems</li>
              </ul>
            </div>
          ) : null}
```
After:
```tsx
          {/* Verification notice */}
          {isUnconfirmed && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                Unconfirmed report
              </h3>
              <p className="text-sm text-foreground/80">
                {providerLabel} has not verified this incident yet. The details, incident date and loss figure may change, and some reports are withdrawn. Check the linked source before acting.
              </p>
            </div>
          )}

          {/* Next steps */}
          {(showWeb3Actions || showVulnerabilityActions) && (
            <section aria-labelledby="what-should-i-do" className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 id="what-should-i-do" className="mb-3 flex items-center gap-2 font-semibold">
                <LifeBuoy className="h-4 w-4 text-primary" aria-hidden="true" />
                What should I do?
              </h3>
              {showWeb3Actions && (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground/80">
                  <li>
                    Review your token approvals and revoke the ones you no longer use on{' '}
                    <a href={REVOKE_CASH_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Revoke.cash</a>.
                  </li>
                  <li>
                    Check an address before you send funds to it, or report a scam address, on{' '}
                    <a href={CHAINABUSE_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Chainabuse</a>.
                  </li>
                  <li>
                    If your team is under active attack, contact{' '}
                    <a href={SEAL_911_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">SEAL 911</a>.
                  </li>
                </ul>
              )}
              {showVulnerabilityActions && (
                <p className={`text-sm text-foreground/80 ${showWeb3Actions ? 'mt-3' : ''}`}>
                  For a software vulnerability, read the vendor&apos;s advisory first, then check the record on{' '}
                  <a href={nvdCveUrl(article.cveId)} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">NVD</a>{' '}
                  and whether it is listed in the{' '}
                  <a href={CISA_KEV_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">CISA Known Exploited Vulnerabilities catalog</a>.
                </p>
              )}
            </section>
          )}

          {/* Status history */}
          {statusHistory.length > 0 && (
            <section aria-labelledby="status-history">
              <h3 id="status-history" className="mb-3 flex items-center gap-2 font-semibold">
                <History className="h-4 w-4 text-primary" aria-hidden="true" />
                Status history
              </h3>
              <ol className="space-y-2 border-l border-border pl-4 text-sm">
                {statusHistory.map((entry) => (
                  <li key={entry.label}>
                    <span className="font-medium text-foreground">{entry.label}</span>
                    <span className="text-muted-foreground"> · {entry.detail}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
```

7i. Alerts card after the main card (lines 379-381).

Before:
```tsx
      </Card>

      {/* Related Articles Section */}
```
After:
```tsx
      </Card>

      {/* Alerts like this */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary" aria-hidden="true" />
            Get alerts like this
          </CardTitle>
          <CardDescription>
            Email alerts for {categoryInfo.name} {web3Incident ? 'incidents' : 'items'}, as often as you choose. The Telegram channel posts new high and critical Web3 incidents.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to={subscribeHref}>
              <BellRing className="w-4 h-4 mr-2" aria-hidden="true" />
              Get email alerts
            </Link>
          </Button>
          <Button asChild variant="outline">
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              <Send className="w-4 h-4 mr-2" aria-hidden="true" />
              Join @digibastion on Telegram
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Related Articles Section */}
```

7j. Related list (lines 408 and 436-438).

Before:
```tsx
                const relatedCategoryInfo = newsCategoryConfig[related.category];
```
After:
```tsx
                const relatedCategoryInfo = getCategoryConfig(related.category);
```

Before:
```tsx
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                              Preliminary
                            </Badge>
```
After:
```tsx
                            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300">
                              Unconfirmed
                            </Badge>
```

`isQuillMonitor` is still used by the "Incident data provided by" block, and `isPreliminaryQuillMonitorArticle` by the related list, so both imports stay.

- [ ] **Step 8: Let the subscribe form start from a view**

In `src/components/news/SubscriptionForm.tsx` (lines 34-38):

Before:
```tsx
export const SubscriptionForm = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>([]);
  const [contentScope, setContentScope] = useState<ThreatIntelScope>('all');
```
After:
```tsx
interface SubscriptionFormProps {
  /** Pre-selected categories, e.g. from `?categories=` when opened from an incident page. */
  initialCategories?: NewsCategory[];
  /** Pre-selected content scope, e.g. from `?scope=`. */
  initialScope?: ThreatIntelScope;
}

export const SubscriptionForm = ({ initialCategories, initialScope = 'all' }: SubscriptionFormProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<NewsCategory[]>(() => [...(initialCategories ?? [])]);
  const [contentScope, setContentScope] = useState<ThreatIntelScope>(initialScope);
```

The reset after a successful submit still clears to `[]` and `'all'`. Leave it.

In `src/pages/News.tsx` (about line 1168):

Before:
```tsx
                <SubscriptionForm />
```
After:
```tsx
                <SubscriptionForm
                  initialCategories={selectedCategories}
                  initialScope={searchParams.has('scope') ? feedView : undefined}
                />
```

`selectedCategories` is already parsed and filtered against the known categories at the top of `News`, so an unknown value in `?categories=` is dropped. Without `?scope=` the form keeps its old default of `all`.

- [ ] **Step 9: Run the tests to see them pass**

Run: `rtk proxy npx vitest run src/components/news/__tests__/NewsDetail.test.tsx src/components/news/__tests__/SubscriptionForm.test.tsx src/utils/__tests__/officialLinks.test.ts src/utils/__tests__/incidentDisplay.test.ts src/pages/__tests__/News.navigation.test.tsx`

Expected: PASS (6 + 2 + 3 + 11 + 2 tests).

Then `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint src/components/news/NewsDetail.tsx src/components/news/SubscriptionForm.tsx src/lib/threatIntel src/pages/News.tsx src/components/news/__tests__ src/utils/__tests__/officialLinks.test.ts src/utils/__tests__/incidentDisplay.test.ts`. Expected: no errors.

Manual check: open an incident from the feed, click "Get email alerts", and confirm the subscribe tab opens with that category ticked and the scope selected.

- [ ] **Step 10: Commit**

```bash
git add src/lib/threatIntel/officialLinks.ts src/lib/threatIntel/incidentDisplay.ts src/utils/__tests__/officialLinks.test.ts src/utils/__tests__/incidentDisplay.test.ts src/components/news/NewsDetail.tsx src/components/news/__tests__/NewsDetail.test.tsx src/components/news/SubscriptionForm.tsx src/components/news/__tests__/SubscriptionForm.test.tsx src/pages/News.tsx
git commit -m "feat(threat-intel): add next steps, status history and alert links to incident pages" -m "Replace the generic critical-item checklist with links to Revoke.cash, Chainabuse and SEAL 911 for Web3 incidents, and to the vendor advisory, NVD and CISA KEV for vulnerabilities. Add a status history, a pre-filled email alert link and a Telegram button. SubscriptionForm accepts initial categories and scope."
```

---
### Task C4: Mobile layout and hero copy

On a 390px phone the first card starts about 1,340px down the page: hero, a 2x2 stat grid, tabs, search, scope toggle, two selects and the full filter panel all come first. This task moves date, sort, category and severity behind a "Filters (n)" button that opens a bottom sheet below the `md` breakpoint. The stat tiles become one row, the tabs fit without clipping, the "Live" label shows on phones, and the hero says what the page is. The target is the first card above the fold at 390x844.

The toolbar is created as its own component, `FeedToolbar`, in this task rather than in C6, because the mobile sheet means rewriting that markup anyway. C6 then only extracts the alerts tab.

Default view: the feed opens on Web3 incidents. `parseScope` and `DEFAULT_SCOPE` from section B decide the scope. The URL leaves `scope` out for the default, and choosing "All Intelligence" writes `scope=all`.

**Files:**
- Create: `src/components/news/FeedToolbar.tsx`
- Create: `src/components/news/InlineSubscribeCard.tsx`
- Modify: `src/pages/News.tsx` (imports lines 1-42; line 150; after line 153; MetaTags 524-529; tabs data 425-430; hero and stats 536-578; tabs 580-608; toolbar 618-662; line 666; line 765; results 793-800)
- Modify: `src/components/news/RealtimeStatusIndicator.tsx` (the "Live" label line)
- Modify: `src/pages/__tests__/News.navigation.test.tsx` (lines 115-117 and 143)
- Test: create `src/pages/__tests__/News.hero.test.tsx`

**Interfaces:**
- Consumes: `DEFAULT_SCOPE: ThreatIntelScope` and `parseScope(value: string | null): ThreatIntelScope` from `src/lib/threatIntel/taxonomy.ts` (section B; `parseScope` returns `DEFAULT_SCOPE` for a missing or unknown value). `TELEGRAM_CHANNEL_URL` (C1). `NewsFilters`, `ContentScopeSelector`, and the shadcn `Sheet` in `src/components/ui/sheet.tsx`.
- Produces:
  - `type FeedDateFilter = 'all' | '7d' | '30d' | '90d'` and `type FeedSort = 'date' | 'severity'`
  - `interface FeedToolbarProps { searchQuery: string; onSearchChange(value: string): void; scope: ThreatIntelScope; onScopeChange(value: ThreatIntelScope): void; dateFilter: FeedDateFilter; onDateFilterChange(value: FeedDateFilter): void; sortBy: FeedSort; onSortChange(value: FeedSort): void; selectedCategories: NewsCategory[]; selectedSeverities: SeverityLevel[]; onCategoryToggle(category: NewsCategory): void; onSeverityToggle(severity: SeverityLevel): void; onClearFilters(): void }`
  - `countActiveFilters(filters: Pick<FeedToolbarProps, 'selectedCategories' | 'selectedSeverities' | 'dateFilter' | 'sortBy'>): number`
  - `FeedToolbar(props: FeedToolbarProps)`
  - `InlineSubscribeCard(props: { subscribeHref: string })`. Its root carries `data-testid="inline-subscribe-card"`.

- [ ] **Step 1: Write the failing page test**

Create `src/pages/__tests__/News.hero.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewsArticle } from '@/types/news';
import News from '@/pages/News';
import { countActiveFilters } from '@/components/news/FeedToolbar';

const makeArticle = (index: number): NewsArticle => ({
  id: `report-${index}`,
  title: `Report ${index}`,
  summary: `Summary for report ${index}.`,
  content: 'Details.',
  category: 'web3-security',
  severity: 'high',
  tags: [],
  publishedAt: new Date('2026-10-09T08:00:00Z'),
  sourceName: 'Test Source',
  link: `https://example.com/reports/${index}`,
});

const feed = vi.hoisted(() => ({ articles: [] as NewsArticle[] }));
const useNewsArticlesMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useNewsArticles', () => ({
  useNewsArticles: (options: unknown) => {
    useNewsArticlesMock(options);
    return {
      articles: feed.articles,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      refreshFromRSS: vi.fn(),
      refreshWeb3Incidents: vi.fn(),
      summarizeArticles: vi.fn(),
      isRefreshing: false,
      isRefreshingWeb3: false,
      isSummarizing: false,
      feedStatus: {
        source: 'live',
        isStale: false,
        checkedAt: new Date('2026-10-09T08:00:00Z'),
        activeFeedCount: 1,
        checkedFeedCount: 1,
        pipelineCheckedAt: new Date('2026-10-09T08:00:00Z'),
        pipelineIsStale: false,
        newestPublishedAt: new Date('2026-10-09T08:00:00Z'),
      },
      stats: { total: feed.articles.length, critical: 0, high: feed.articles.length, medium: 0, low: 0, info: 0, supplyChain: 0, unconfirmed: 0 },
      statsSource: 'server',
      pagination: { currentPage: 1, totalPages: 1, totalCount: feed.articles.length, hasNextPage: false, hasPrevPage: false },
    };
  },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));
vi.mock('@/components/news/RealtimeAlertListener', () => ({ RealtimeAlertListener: () => null }));
vi.mock('@/components/news/RealtimeStatusIndicator', () => ({ RealtimeStatusIndicator: () => null }));
vi.mock('@/components/mobile/PullToRefresh', () => ({ PullToRefresh: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/mobile/SwipeableTabs', () => ({ SwipeableTabs: ({ children }: { children: React.ReactNode }) => children }));

const renderAt = (url: string) => {
  const router = createMemoryRouter(
    [
      { path: '/threat-intel', element: <News /> },
      { path: '/threat-intel/:articleId', element: <News /> },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
};

describe('threat-intel hero and mobile filters', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    feed.articles = [makeArticle(1)];
  });

  it('leads the default Web3 view with the incident hero and both alert channels', async () => {
    renderAt('/threat-intel?categories=web3-security&severities=critical&date=30d');

    expect(await screen.findByRole('heading', { level: 1, name: 'Crypto and Web3 security incidents, as they happen' })).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Join on Telegram' }).getAttribute('href')).toBe('https://t.me/digibastion');
    const emailHref = screen.getByRole('link', { name: 'Get email alerts' }).getAttribute('href') ?? '';
    expect(emailHref).toContain('tab=subscribe');
    expect(emailHref).toContain('categories=web3-security');
    expect(emailHref).toContain('scope=web3-incidents');
    expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'web3-incidents' }));
  });

  it('shows the active filter count on the mobile trigger and opens the filter sheet', async () => {
    renderAt('/threat-intel?categories=web3-security&severities=critical&date=30d');

    fireEvent.click(await screen.findByRole('button', { name: 'Filters (3)' }));
    const sheet = await screen.findByRole('dialog', { name: 'Filter feed' });
    expect(within(sheet).getByRole('button', { name: 'Web3 Security' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('uses the broader hero for the all-news scope', async () => {
    renderAt('/threat-intel?scope=all');

    expect(await screen.findByRole('heading', { level: 1, name: 'Security news and incident alerts' })).not.toBeNull();
    expect(useNewsArticlesMock).toHaveBeenLastCalledWith(expect.objectContaining({ view: 'all' }));
  });

  it('inserts one subscribe card after the fifth result', async () => {
    feed.articles = Array.from({ length: 6 }, (_, index) => makeArticle(index + 1));
    renderAt('/threat-intel');

    const cards = await screen.findAllByTestId('inline-subscribe-card');
    expect(cards).toHaveLength(1);
    const fifth = screen.getByRole('link', { name: 'Report 5' });
    const sixth = screen.getByRole('link', { name: 'Report 6' });
    expect(fifth.compareDocumentPosition(cards[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cards[0].compareDocumentPosition(sixth) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('counts every narrowing filter once', () => {
    expect(countActiveFilters({ selectedCategories: [], selectedSeverities: [], dateFilter: 'all', sortBy: 'date' })).toBe(0);
    expect(countActiveFilters({
      selectedCategories: ['web3-security'],
      selectedSeverities: ['critical', 'high'],
      dateFilter: '7d',
      sortBy: 'severity',
    })).toBe(5);
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

Run: `rtk proxy npx vitest run src/pages/__tests__/News.hero.test.tsx`

Expected: FAIL with `Failed to resolve import "@/components/news/FeedToolbar"`.

- [ ] **Step 3: Create the toolbar**

Create `src/components/news/FeedToolbar.tsx`:

```tsx
import { Calendar, Search, SlidersHorizontal } from 'lucide-react';
import { ContentScopeSelector } from '@/components/news/ContentScopeSelector';
import { NewsFilters } from '@/components/news/NewsFilters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import type { NewsCategory, SeverityLevel, ThreatIntelScope } from '@/types/news';

export type FeedDateFilter = 'all' | '7d' | '30d' | '90d';
export type FeedSort = 'date' | 'severity';

export interface FeedToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  scope: ThreatIntelScope;
  onScopeChange: (value: ThreatIntelScope) => void;
  dateFilter: FeedDateFilter;
  onDateFilterChange: (value: FeedDateFilter) => void;
  sortBy: FeedSort;
  onSortChange: (value: FeedSort) => void;
  selectedCategories: NewsCategory[];
  selectedSeverities: SeverityLevel[];
  onCategoryToggle: (category: NewsCategory) => void;
  onSeverityToggle: (severity: SeverityLevel) => void;
  onClearFilters: () => void;
}

/** Filters that live behind the mobile "Filters (n)" button. Search and scope stay visible. */
export function countActiveFilters({
  selectedCategories,
  selectedSeverities,
  dateFilter,
  sortBy,
}: Pick<FeedToolbarProps, 'selectedCategories' | 'selectedSeverities' | 'dateFilter' | 'sortBy'>): number {
  return selectedCategories.length
    + selectedSeverities.length
    + (dateFilter === 'all' ? 0 : 1)
    + (sortBy === 'date' ? 0 : 1);
}

function DateSelect({ value, onChange }: { value: FeedDateFilter; onChange: (value: FeedDateFilter) => void }) {
  return (
    <Select value={value} onValueChange={(next: FeedDateFilter) => onChange(next)}>
      <SelectTrigger className="w-full md:w-32" aria-label="Date range">
        <Calendar className="w-4 h-4 mr-2" aria-hidden="true" />
        <SelectValue placeholder="Date" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Time</SelectItem>
        <SelectItem value="7d">Last 7 Days</SelectItem>
        <SelectItem value="30d">Last 30 Days</SelectItem>
        <SelectItem value="90d">Last 90 Days</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SortSelect({ value, onChange }: { value: FeedSort; onChange: (value: FeedSort) => void }) {
  return (
    <Select value={value} onValueChange={(next: FeedSort) => onChange(next)}>
      <SelectTrigger className="w-full md:w-32" aria-label="Sort order">
        <SelectValue placeholder="Sort" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="date">Latest First</SelectItem>
        <SelectItem value="severity">By Severity</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function FeedToolbar(props: FeedToolbarProps) {
  const {
    searchQuery,
    onSearchChange,
    scope,
    onScopeChange,
    dateFilter,
    onDateFilterChange,
    sortBy,
    onSortChange,
    selectedCategories,
    selectedSeverities,
    onCategoryToggle,
    onSeverityToggle,
    onClearFilters,
  } = props;
  const activeCount = countActiveFilters(props);

  return (
    <Card className="glass-card">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="flex gap-2 md:flex-1">
            <div className="relative flex-1">
              <label htmlFor="threat-intel-search" className="sr-only">Search threat intelligence</label>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="threat-intel-search"
                placeholder="Search articles, technologies, tags..."
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-10"
              />
            </div>

            {/* Below md, date, sort, category and severity live in a bottom sheet. */}
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" className="shrink-0 gap-2 md:hidden">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filters ({activeCount})
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
                <SheetHeader>
                  <SheetTitle>Filter feed</SheetTitle>
                  <SheetDescription>Narrow the feed by date, sort order, category and severity.</SheetDescription>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <DateSelect value={dateFilter} onChange={onDateFilterChange} />
                    <SortSelect value={sortBy} onChange={onSortChange} />
                  </div>
                  <NewsFilters
                    selectedCategories={selectedCategories}
                    selectedSeverities={selectedSeverities}
                    onCategoryToggle={onCategoryToggle}
                    onSeverityToggle={onSeverityToggle}
                    onClearFilters={onClearFilters}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-wrap gap-2">
            <ContentScopeSelector
              value={scope}
              onChange={onScopeChange}
              label="Choose intelligence scope"
              idPrefix="feed-scope"
            />
            <div className="hidden gap-2 md:flex">
              <DateSelect value={dateFilter} onChange={onDateFilterChange} />
              <SortSelect value={sortBy} onChange={onSortChange} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create the inline subscribe card**

Create `src/components/news/InlineSubscribeCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { BellRing, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';

interface InlineSubscribeCardProps {
  /** Subscribe tab URL carrying the current filters. */
  subscribeHref: string;
}

export function InlineSubscribeCard({ subscribeHref }: InlineSubscribeCardProps) {
  return (
    <Card className="glass-card border-primary/30" data-testid="inline-subscribe-card">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-foreground">Get these alerts as they happen</p>
          <p className="text-sm text-muted-foreground">
            Telegram posts new high and critical Web3 incidents. Email alerts follow the filters you pick.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" className="gap-2">
            <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              <Send className="h-4 w-4" aria-hidden="true" />
              Telegram
            </a>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to={subscribeHref}>
              <BellRing className="h-4 w-4" aria-hidden="true" />
              Email alerts
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Rework the page**

All edits are in `src/pages/News.tsx`.

5a. Imports (lines 1-42). If section B already edited this block, apply the same changes to the current version instead: add `Fragment`, `Link`, `FeedToolbar`, `InlineSubscribeCard`, `DEFAULT_SCOPE`, `parseScope`, `TELEGRAM_CHANNEL_URL`, `BellRing` and `Send`; remove `ContentScopeSelector`, `Input`, `AlertListSkeleton`, `StatsSkeleton`, `Search` and `Calendar`.

Before:
```tsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsFilters } from '@/components/news/NewsFilters';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';
import { NewsDetail } from '@/components/news/NewsDetail';
import { ContentScopeSelector } from '@/components/news/ContentScopeSelector';
import { RealtimeAlertListener } from '@/components/news/RealtimeAlertListener';
import { RealtimeStatusIndicator } from '@/components/news/RealtimeStatusIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeableTabs } from '@/components/mobile/SwipeableTabs';
import { NewsListSkeleton, AlertListSkeleton, StatsSkeleton } from '@/components/news/NewsCardSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCategory, SeverityLevel, NewsArticle, ThreatIntelScope } from '@/types/news';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { serializeJsonLd } from '@/utils/jsonLd';
import {
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isClassificationRelevant,
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
} from '@/utils/newsIncident';
import { safeExternalUrl } from '@/utils/safeUrl';
import {
  buildNewsArticleSchema,
  buildNewsBreadcrumbSchema,
  buildThreatIntelCollectionSchema,
} from '@/utils/seo';
import { 
  Newspaper, Shield, AlertTriangle, Bell,
  Search, Calendar, Clock, ChevronRight, RefreshCw, Loader2, Database, Sparkles, Home, ArrowLeft, Flame, RadioTower
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
```
After:
```tsx
import { Fragment, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { NewsCard } from '@/components/news/NewsCard';
import { NewsFilters } from '@/components/news/NewsFilters';
import { SubscriptionForm } from '@/components/news/SubscriptionForm';
import { NewsDetail } from '@/components/news/NewsDetail';
import { FeedToolbar } from '@/components/news/FeedToolbar';
import { InlineSubscribeCard } from '@/components/news/InlineSubscribeCard';
import { RealtimeAlertListener } from '@/components/news/RealtimeAlertListener';
import { RealtimeStatusIndicator } from '@/components/news/RealtimeStatusIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeableTabs } from '@/components/mobile/SwipeableTabs';
import { NewsListSkeleton } from '@/components/news/NewsCardSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NewsCategory, SeverityLevel, NewsArticle, ThreatIntelScope } from '@/types/news';
import { useNewsArticles } from '@/hooks/useNewsArticles';
import { DEFAULT_SCOPE, parseScope } from '@/lib/threatIntel/taxonomy';
import { TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';
import { serializeJsonLd } from '@/utils/jsonLd';
import {
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isClassificationRelevant,
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
} from '@/utils/newsIncident';
import { safeExternalUrl } from '@/utils/safeUrl';
import {
  buildNewsArticleSchema,
  buildNewsBreadcrumbSchema,
  buildThreatIntelCollectionSchema,
} from '@/utils/seo';
import { 
  Newspaper, Shield, AlertTriangle, Bell, BellRing, Send,
  Clock, ChevronRight, RefreshCw, Loader2, Database, Sparkles, Home, ArrowLeft, Flame, RadioTower
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
```

Also add one module constant directly below the `AUTO_REFRESH_OPTIONS` array (after line 49):

```tsx

/** The inline subscribe card follows this many results. */
const INLINE_SUBSCRIBE_AFTER = 5;
```

5b. Default scope (line 150). Skip if section B already replaced this line with `parseScope`.

Before:
```tsx
  const feedView: ThreatIntelScope = searchParams.get('scope') === 'web3-incidents' ? 'web3-incidents' : 'all';
```
After:
```tsx
  const feedView: ThreatIntelScope = parseScope(searchParams.get('scope'));
```

5c. Subscribe link for this view (after line 153).

Before:
```tsx
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = 20;
```
After:
```tsx
  const currentPage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize = 20;
  // "Get email alerts" carries the current view so the form opens pre-filled.
  const subscribeHref = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    ['page', 'q', 'article', 'sort', 'date'].forEach((key) => next.delete(key));
    next.set('scope', feedView);
    next.set('tab', 'subscribe');
    return `/threat-intel?${next.toString()}`;
  }, [searchParams, feedView]);
```

5d. Tab labels and hero copy (lines 425-430).

Before:
```tsx
  const tabs = [
    { id: 'feed', label: 'News Feed', icon: Newspaper, count: stats.total },
    { id: 'alerts', label: 'Active Alerts', icon: AlertTriangle, count: activeAlertCount || actionRequiredAlerts.length },
    { id: 'subscribe', label: 'Subscribe', icon: Bell },
  ];
```
After:
```tsx
  const tabs = [
    { id: 'feed', label: 'News Feed', shortLabel: 'Feed', icon: Newspaper, count: stats.total },
    { id: 'alerts', label: 'Active Alerts', shortLabel: 'Alerts', icon: AlertTriangle, count: activeAlertCount || actionRequiredAlerts.length },
    { id: 'subscribe', label: 'Subscribe', shortLabel: 'Subscribe', icon: Bell },
  ];

  const isIncidentView = feedView === 'web3-incidents';
  const heroTitle = isIncidentView
    ? 'Crypto and Web3 security incidents, as they happen'
    : 'Security news and incident alerts';
  const heroIntro = isIncidentView
    ? 'Hacks, exploits, phishing and supply-chain attacks, collected from QuillMonitor and other incident trackers, merged into one record per incident, and labelled confirmed or unconfirmed. Free alerts on Telegram and by email.'
    : 'Security news, vulnerability advisories and Web3 incidents from QuillMonitor, other incident trackers and security publishers, each linked to its source. Free alerts on Telegram and by email.';

  // statsCaption comes from task B3: "in this view" when threat_intel_stats
  // counted the whole filtered result, "on this page" when it fell back to
  // counting the loaded page.
  const statTiles = [
    { label: 'Critical', value: stats.critical, color: 'text-red-400', border: 'border-red-500/20', scope: statsCaption },
    { label: 'High', value: stats.high, color: 'text-orange-400', border: 'border-orange-500/20', scope: statsCaption },
    { label: 'Supply chain', value: stats.supplyChain, color: 'text-purple-400', border: 'border-purple-500/20', scope: statsCaption },
    { label: 'Total', value: stats.total, color: 'text-blue-400', border: 'border-blue-500/20', scope: statsCaption },
  ];
```

5e. Page metadata (lines 524-529). The first line has a trailing space after `<MetaTags`.

Before:
```tsx
      <MetaTags 
        title="Crypto Threat Intelligence Feed — Real-Time Web3 Security Alerts | Digibastion"
        description="Stay ahead of crypto threats with real-time security alerts. Track DeFi exploits, wallet drainers, phishing attacks, and supply chain vulnerabilities. Free email alerts for critical threats."
        keywords="crypto security alerts, web3 threat intelligence, defi exploits, phishing detection, wallet drainer alerts, supply chain attacks, blockchain security news"
        image="https://www.digibastion.com/og-threat-intel.png"
      />
```
After:
```tsx
      <MetaTags
        title="Crypto and Web3 Security Incidents, As They Happen | Digibastion"
        description="Crypto and Web3 hacks, exploits, phishing and supply-chain attacks from QuillMonitor and other trackers, one record per incident, labelled confirmed or unconfirmed. Free alerts on Telegram and email."
        keywords="crypto hacks, web3 security incidents, defi exploits, crypto phishing, supply chain attacks, crypto security alerts, telegram security alerts"
        image="https://www.digibastion.com/og-threat-intel.png"
      />
```

5f. Hero and stat tiles (lines 536-578).

Before:
```tsx
          {/* Hero Section - Compact */}
          <div className="text-center mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3">
              <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Threat Intelligence Feed</h1>
              <RealtimeStatusIndicator />
            </div>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Real-time security intelligence covering Web3, DeFi, and supply chain threats.
            </p>
          </div>

          {/* Quick Stats Banner - Compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
            <Card className="glass-card border-red-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-red-400">{stats.critical}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Critical <span className="hidden sm:inline">Severity</span></div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">current view</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-orange-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-orange-400">{stats.high}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">High <span className="hidden sm:inline">Severity</span></div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">current view</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-purple-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-purple-400">{stats.supplyChain}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Supply Chain</div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">current view</div>
              </CardContent>
            </Card>
            <Card className="glass-card border-blue-500/20">
              <CardContent className="p-2 sm:p-3 text-center">
                <div className="text-lg sm:text-xl font-bold text-blue-400">{stats.total}</div>
                <div className="text-[10px] sm:text-xs text-muted-foreground">Total Articles</div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-0.5">all time</div>
              </CardContent>
            </Card>
          </div>
```
After:
```tsx
          {/* Hero */}
          <section className="mb-4 text-center sm:mb-6" aria-labelledby="threat-intel-heading">
            <div className="mb-2 flex items-center justify-center gap-2">
              <Shield className="h-5 w-5 text-primary sm:h-6 sm:w-6" aria-hidden="true" />
              <RealtimeStatusIndicator />
            </div>
            <h1
              id="threat-intel-heading"
              className="mx-auto max-w-3xl text-balance text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl"
            >
              {heroTitle}
            </h1>
            <p className="mx-auto mt-2 max-w-2xl px-2 text-sm text-muted-foreground sm:text-base">
              {heroIntro}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="sm" className="gap-2">
                <a href={TELEGRAM_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Join on Telegram
                </a>
              </Button>
              <Button asChild size="sm" variant="outline" className="gap-2">
                <Link to={subscribeHref}>
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  Get email alerts
                </Link>
              </Button>
            </div>
          </section>

          {/* Stat tiles: one row on every screen size */}
          <div className="mb-4 grid grid-cols-4 gap-1.5 sm:mb-6 sm:gap-2">
            {statTiles.map((tile) => (
              <Card key={tile.label} className={`glass-card ${tile.border}`}>
                <CardContent className="p-1.5 text-center sm:p-3">
                  <div className={`text-base font-bold sm:text-xl ${tile.color}`}>{tile.value}</div>
                  <div className="text-[10px] leading-tight text-muted-foreground sm:text-xs">{tile.label}</div>
                  <div className="mt-0.5 text-[9px] leading-tight text-muted-foreground/60 sm:text-[10px]">{tile.scope}</div>
                </CardContent>
              </Card>
            ))}
          </div>
```

5g. Tabs (lines 580-608). Three equal columns on phones with short labels, so "Subscribe" no longer clips. Adds `tablist`, `tab` and `aria-selected` (spec 7.6).

Before:
```tsx
          {/* Enhanced Tab Navigation - More Visible */}
          <div className="mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex gap-1.5 sm:gap-2 p-1.5 bg-card/80 rounded-xl border border-border shadow-lg min-w-max sm:min-w-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                    selectedTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-lg scale-[1.02]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <Badge 
                      variant={selectedTab === tab.id ? "secondary" : "outline"} 
                      className={`ml-0.5 sm:ml-1 h-5 min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs ${
                        tab.id === 'alerts' && tab.count > 0 ? 'bg-red-500 text-white border-0' : ''
                      }`}
                    >
                      {tab.count}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
```
After:
```tsx
          {/* Section tabs */}
          <div className="mb-4 sm:mb-6">
            <div
              role="tablist"
              aria-label="Threat intelligence sections"
              className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card/80 p-1 shadow-lg sm:flex sm:gap-2 sm:p-1.5"
            >
              {tabs.map((tab) => {
                const selected = selectedTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-label={tab.label}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex min-w-0 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium transition-all sm:gap-2 sm:px-4 sm:py-3 sm:text-sm ${
                      selected
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate sm:hidden">{tab.shortLabel}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <Badge
                        variant={selected ? 'secondary' : 'outline'}
                        className={`h-5 min-w-5 px-1 text-[10px] sm:ml-1 sm:px-1.5 sm:text-xs ${
                          tab.id === 'alerts' ? 'bg-red-500 text-white border-0' : ''
                        }`}
                      >
                        {tab.count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
```

5h. Toolbar (lines 618-662).

Before:
```tsx
              {/* Search and Sort Bar */}
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search articles, technologies, tags..."
                        value={searchQuery}
                        onChange={(event) => updateFeedParam('q', event.target.value || null, true)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <ContentScopeSelector
                        value={feedView}
                        onChange={(value) => updateFeedParam('scope', value === 'all' ? null : value)}
                        label="Choose intelligence scope"
                        idPrefix="feed-scope"
                      />
                      <Select value={dateFilter} onValueChange={(value: 'all' | '7d' | '30d' | '90d') => updateFeedParam('date', value === 'all' ? null : value)}>
                        <SelectTrigger className="w-32">
                          <Calendar className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Date" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="7d">Last 7 Days</SelectItem>
                          <SelectItem value="30d">Last 30 Days</SelectItem>
                          <SelectItem value="90d">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={(value: 'date' | 'severity') => updateFeedParam('sort', value === 'date' ? null : value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date">Latest First</SelectItem>
                          <SelectItem value="severity">By Severity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
```
After:
```tsx
              <FeedToolbar
                searchQuery={searchQuery}
                onSearchChange={(value) => updateFeedParam('q', value || null, true)}
                scope={feedView}
                onScopeChange={(value) => updateFeedParam('scope', value === DEFAULT_SCOPE ? null : value)}
                dateFilter={dateFilter}
                onDateFilterChange={(value) => updateFeedParam('date', value === 'all' ? null : value)}
                sortBy={sortBy}
                onSortChange={(value) => updateFeedParam('sort', value === 'date' ? null : value)}
                selectedCategories={selectedCategories}
                selectedSeverities={selectedSeverities}
                onCategoryToggle={handleCategoryToggle}
                onSeverityToggle={handleSeverityToggle}
                onClearFilters={handleClearFilters}
              />
```

5i. Hide the filter sidebar below `md` (line 666). The sheet replaces it there.

Before:
```tsx
                <div className="lg:col-span-1">
```
After:
```tsx
                <div className="hidden md:block lg:col-span-1">
```

5j. "Clear filters" counts a non-default scope as a filter (line 765).

Before:
```tsx
                      {(selectedCategories.length > 0 || selectedSeverities.length > 0 || searchQuery || feedView !== 'all') && (
```
After:
```tsx
                      {(selectedCategories.length > 0 || selectedSeverities.length > 0 || searchQuery || feedView !== DEFAULT_SCOPE) && (
```

5k. Inline subscribe card after the fifth result (lines 793-800). Two lines carry trailing spaces: `<NewsCard ` and `key={article.id} `.

Before:
```tsx
                  ) : filteredArticles.length > 0 ? (
                    filteredArticles.map((article) => (
                      <NewsCard 
                        key={article.id} 
                        article={article}
                        onClick={() => handleArticleClick(article)}
                      />
                    ))
```
After:
```tsx
                  ) : filteredArticles.length > 0 ? (
                    filteredArticles.map((article, index) => (
                      <Fragment key={article.id}>
                        <NewsCard
                          article={article}
                          onClick={() => handleArticleClick(article)}
                        />
                        {index === INLINE_SUBSCRIBE_AFTER - 1 && (
                          <InlineSubscribeCard subscribeHref={subscribeHref} />
                        )}
                      </Fragment>
                    ))
```

- [ ] **Step 6: Show "Live" on phones**

In `src/components/news/RealtimeStatusIndicator.tsx`:

Before:
```tsx
          <span className="hidden sm:inline">{status === 'connected' ? 'Live' : config.label}</span>
```
After:
```tsx
          <span>{status === 'connected' ? 'Live' : config.label}</span>
```

- [ ] **Step 7: Update the navigation test for the new default and heading**

In `src/pages/__tests__/News.navigation.test.tsx`:

Before:
```tsx
    fireEvent.click(screen.getByRole('button', { name: 'All Intelligence' }));
    await waitFor(() => {
      expect(router.state.location.search).not.toContain('scope=');
```
After:
```tsx
    fireEvent.click(screen.getByRole('button', { name: 'All Intelligence' }));
    await waitFor(() => {
      expect(router.state.location.search).toContain('scope=all');
```

Before:
```tsx
    expect(screen.getByRole('heading', { name: 'Threat Intelligence Feed' })).not.toBeNull();
```
After:
```tsx
    expect(screen.getByRole('heading', { level: 1, name: 'Crypto and Web3 security incidents, as they happen' })).not.toBeNull();
```

- [ ] **Step 8: Run the tests to see them pass**

Run: `rtk proxy npx vitest run src/pages/__tests__/News.hero.test.tsx src/pages/__tests__/News.navigation.test.tsx src/components/news/__tests__/ContentScopeSelector.test.tsx`

Expected: PASS (5 + 2 + existing). The navigation test still finds a single "Web3 Security" and "DeFi Exploits" button, because the sheet's copy of `NewsFilters` only mounts while the sheet is open.

Then `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint src/pages/News.tsx src/components/news/FeedToolbar.tsx src/components/news/InlineSubscribeCard.tsx src/components/news/RealtimeStatusIndicator.tsx src/pages/__tests__`. Expected: no errors.

- [ ] **Step 9: Measure on a phone viewport**

Run `npm run dev` and open `http://127.0.0.1:8080/threat-intel` in Chrome DevTools at 390x844 (iPhone 12 Pro). Check:
- the top of the first card is above 844px (in the console, `document.querySelector('.news-card').getBoundingClientRect().top` prints a value below 844);
- the tab row shows "Feed", "Alerts" and "Subscribe" in full, with no horizontal scroll;
- "Live" shows next to the shield once the realtime channel connects;
- "Filters (n)" opens a bottom sheet, and toggling a category there updates the feed and the count;
- at 1280px the sheet button is hidden and the sidebar and the date and sort selects show inline.

If the first card is still below the fold, shorten the hero intro on mobile only (for example, `hidden sm:block` on the last sentence) rather than dropping the CTAs.

- [ ] **Step 10: Commit**

```bash
git add src/components/news/FeedToolbar.tsx src/components/news/InlineSubscribeCard.tsx src/pages/News.tsx src/components/news/RealtimeStatusIndicator.tsx src/pages/__tests__/News.hero.test.tsx src/pages/__tests__/News.navigation.test.tsx
git commit -m "feat(threat-intel): rework the feed for phones and lead with incident copy" -m "Default to the Web3 incidents view. Move date, sort, category and severity into a Filters (n) bottom sheet below md, put the stat tiles in one row, fit the tabs without clipping and keep the Live label visible. New hero copy with Telegram and email CTAs, an inline subscribe card after the fifth result, and updated page metadata."
```

---
### Task C5: Methodology page

A new page at `/threat-intel/methodology` explains where records come from, how severity is set, what confirmed and unconfirmed mean, how duplicates are merged, how to report a mistake, and which channels are official. It follows the layout of `src/pages/About.tsx` (`MetaTags`, `Navbar`, a `main` with `pt-24 sm:pt-28`, `Footer`) and uses stacked lists rather than tables so nothing scrolls sideways at 390px.

Facts on the page come from the code:
- The severity thresholds are copied from `mapQuillMonitorSeverity` in `supabase/functions/_shared/quillmonitor.ts:216-226`.
- The 30-minute QuillMonitor polling is the `fetch-quillmonitor-incidents-30min` cron (`'17,47 * * * *'`) in `supabase/migrations/20260929153000_schedule_quillmonitor_incremental_sync.sql`.
- The news-severity examples ("zero-day", "actively exploited", "remote code execution") come from `determineRssSeverity` in `supabase/functions/_shared/rss-classifier.ts`.
- The starting RSS list is the seed in `supabase/migrations/20251226091811_378204dc-d844-42e1-87c9-facba66b0d61.sql:90-97`.
- `support@digibastion.com` is already the `reply_to` address in `send-critical-alerts`, `send-digest-emails` and `submit-form`.
- `alerts@digibastion.com` is the sender in the same functions.
- `https://t.me/digibastion_chat` is the community link in `src/components/Footer.tsx:85`.

The route is registered before `/threat-intel/:articleId`. React Router already ranks a static segment above a dynamic one, but the order makes the intent obvious to readers. Without the route, `methodology` would pass the article-id check in `News.tsx` (`/^[A-Za-z0-9._:-]{1,128}$/`) and show "article not found".

**Files:**
- Create: `src/pages/ThreatIntelMethodology.tsx`
- Test: create `src/pages/__tests__/ThreatIntelMethodology.test.tsx`
- Modify: `src/App.tsx` (after line 28; between lines 76 and 77)
- Modify: `src/pages/News.tsx` (the `officialLinks` import from C4; the "sources checked" badge, about lines 688-707; the end of the container after `</SwipeableTabs>`)
- Modify: `src/pages/__tests__/News.hero.test.tsx` (append one test)
- Modify: `public/sitemap.xml` (after the `/threat-intel` entry)

**Interfaces:**
- Consumes: C1 constants (`METHODOLOGY_PATH`, `TELEGRAM_CHANNEL_URL`, `TELEGRAM_COMMUNITY_URL`, `ALERTS_SENDER_EMAIL`, `CORRECTIONS_EMAIL`, `SITE_URL`, `QUILLMONITOR_DATABASE_URL`, `WEB3_IS_GOING_GREAT_URL`, `REVOKE_CASH_URL`, `CHAINABUSE_URL`, `SEAL_911_URL`, `NVD_URL`, `CISA_KEV_URL`); `SLOWMIST_ATTRIBUTION_URL` from `src/utils/newsIncident.ts`.
- Produces: default export `ThreatIntelMethodology` (a page component). Section ids for deep links: `sources`, `severity`, `verification`, `duplicates`, `dates`, `corrections`, `official-channels`, `references`.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/__tests__/ThreatIntelMethodology.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThreatIntelMethodology from '@/pages/ThreatIntelMethodology';

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/threat-intel/methodology']}>
    <ThreatIntelMethodology />
  </MemoryRouter>,
);

afterEach(cleanup);

describe('ThreatIntelMethodology', () => {
  it('covers every methodology section', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'How we track security incidents' })).not.toBeNull();
    for (const heading of [
      'Sources',
      'Severity',
      'Confirmed and unconfirmed',
      'How duplicates are merged',
      'Dates',
      'Corrections',
      'Official channels',
      'References',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).not.toBeNull();
    }
  });

  it('states the source list, the SlowMist status and the severity thresholds', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'QuillMonitor' })).not.toBeNull();
    expect(screen.getByText('Pending permission')).not.toBeNull();
    expect(screen.getByText(/The Hacker News, BleepingComputer, SecurityWeek/)).not.toBeNull();
    expect(screen.getByText('Reported loss of $50M or more.')).not.toBeNull();
    expect(screen.getByText('Reported loss from $10M up to $50M.')).not.toBeNull();
    expect(screen.getByText('Reported loss from $1M up to $10M.')).not.toBeNull();
    expect(screen.getByText('No loss disclosed and none of the attack types above.')).not.toBeNull();
  });

  it('lists the corrections address, the official channels and the anti-impersonation note', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'support@digibastion.com' }).getAttribute('href'))
      .toBe('mailto:support@digibastion.com');
    expect(screen.getByRole('link', { name: 't.me/digibastion' }).getAttribute('href')).toBe('https://t.me/digibastion');
    expect(screen.getByText('alerts@digibastion.com')).not.toBeNull();
    expect(screen.getByText(/never ask you to connect a wallet/)).not.toBeNull();
  });

  it('links the reference sources', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'SEAL 911' }).getAttribute('href')).toBe('https://securityalliance.org/seal-911');
    expect(screen.getByRole('link', { name: 'OWASP Smart Contract Top 10' }).getAttribute('href'))
      .toBe('https://owasp.org/www-project-smart-contract-top-10/');
    expect(screen.getByRole('link', { name: 'CISA Known Exploited Vulnerabilities catalog' }).getAttribute('href'))
      .toBe('https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
    expect(screen.getByRole('link', { name: 'ScamSniffer' }).getAttribute('href')).toBe('https://drops.scamsniffer.io/');
  });
});
```

Append to `src/pages/__tests__/News.hero.test.tsx`, inside the existing `describe` block, after the last `it`:

```tsx

  it('links the sources chip and the page footer to the methodology page', async () => {
    renderAt('/threat-intel');

    const chip = await screen.findByRole('link', { name: /sources checked/ });
    expect(chip.getAttribute('href')).toBe('/threat-intel/methodology#sources');
    expect(screen.getByRole('link', { name: 'sources and methodology' }).getAttribute('href'))
      .toBe('/threat-intel/methodology');
  });
```

- [ ] **Step 2: Run the tests to see them fail**

Run: `rtk proxy npx vitest run src/pages/__tests__/ThreatIntelMethodology.test.tsx src/pages/__tests__/News.hero.test.tsx`

Expected: FAIL. The methodology test reports `Failed to resolve import "@/pages/ThreatIntelMethodology"`. The new hero test fails because there is no link named `/sources checked/`.

- [ ] **Step 3: Create the page**

Create `src/pages/ThreatIntelMethodology.tsx`:

```tsx
import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ExternalLink, ShieldAlert } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { Navbar } from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import {
  ALERTS_SENDER_EMAIL,
  CHAINABUSE_URL,
  CISA_KEV_URL,
  CORRECTIONS_EMAIL,
  NVD_URL,
  QUILLMONITOR_DATABASE_URL,
  REVOKE_CASH_URL,
  SEAL_911_URL,
  SITE_URL,
  TELEGRAM_CHANNEL_URL,
  TELEGRAM_COMMUNITY_URL,
  WEB3_IS_GOING_GREAT_URL,
} from '@/lib/threatIntel/officialLinks';
import { SLOWMIST_ATTRIBUTION_URL } from '@/utils/newsIncident';

const ExternalAnchor = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
    {children}
  </a>
);

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28 space-y-4">
    <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
    {children}
  </section>
);

const severityRubric = [
  { level: 'Critical', rule: 'Reported loss of $50M or more.' },
  { level: 'High', rule: 'Reported loss from $10M up to $50M.' },
  { level: 'Medium', rule: 'Reported loss from $1M up to $10M.' },
  {
    level: 'High',
    rule: 'Loss under $1M or not disclosed, when the attack is a private-key compromise, an access-control flaw, oracle manipulation, reentrancy or a flash-loan attack.',
  },
  { level: 'Medium', rule: 'Any other disclosed loss under $1M.' },
  { level: 'Low', rule: 'No loss disclosed and none of the attack types above.' },
];

const references = [
  { name: 'CISA Known Exploited Vulnerabilities catalog', href: CISA_KEV_URL, use: 'Which CVEs attackers are exploiting now.' },
  { name: 'NVD', href: NVD_URL, use: 'CVE records and severity scores.' },
  { name: 'OWASP Smart Contract Top 10', href: 'https://owasp.org/www-project-smart-contract-top-10/', use: 'Names for smart-contract attack types.' },
  { name: 'SEAL 911', href: SEAL_911_URL, use: 'Emergency help for teams under active attack.' },
  { name: 'Chainabuse', href: CHAINABUSE_URL, use: 'Check or report a scam address.' },
  { name: 'Revoke.cash', href: REVOKE_CASH_URL, use: 'Review and revoke token approvals.' },
  { name: 'Chainalysis: crypto hacking and stolen funds', href: 'https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/', use: 'Yearly loss figures.' },
  { name: 'TRM Labs 2026 Crypto Crime Report', href: 'https://www.trmlabs.com/reports-and-whitepapers/2026-crypto-crime-report', use: 'Yearly loss figures.' },
  { name: 'Immunefi research', href: 'https://immunefi.com/blog/research/', use: 'Quarterly loss reports.' },
  { name: 'ScamSniffer', href: 'https://drops.scamsniffer.io/', use: 'Wallet drainer and phishing trends.' },
];

const ThreatIntelMethodology = () => {
  const location = useLocation();

  // React Router does not scroll to #hash targets on its own.
  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!id) return;
    document.getElementById(id)?.scrollIntoView?.({ block: 'start' });
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MetaTags
        title="Threat Intel Methodology: Sources, Severity and Corrections | Digibastion"
        description="Where Digibastion's security incident records come from, how severity is set, what confirmed and unconfirmed mean, how duplicates are merged and how to report a mistake."
        keywords="threat intelligence methodology, crypto incident sources, QuillMonitor, severity rubric, confirmed incidents"
      />
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-3xl space-y-12">
          <header className="space-y-4">
            <Link to="/threat-intel" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Threat Intel
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">How we track security incidents</h1>
            <p className="leading-7 text-muted-foreground">
              Digibastion collects security incidents and news from the sources below, merges reports of the same incident into one record, and shows the status each source gives. We do not investigate or verify incidents ourselves, so every record links back to where it came from.
            </p>
          </header>

          <Section id="sources" title="Sources">
            <ul className="space-y-4">
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">
                    <ExternalAnchor href={QUILLMONITOR_DATABASE_URL}>QuillMonitor</ExternalAnchor>
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    The QuillAudits partner API for Web3 hacks and exploits. We check it every 30 minutes. Each record carries QuillMonitor&apos;s own verification status.
                  </p>
                </Card>
              </li>
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">
                    <ExternalAnchor href={SLOWMIST_ATTRIBUTION_URL}>SlowMist Hacked</ExternalAnchor>
                  </p>
                  <p className="mt-1 text-sm font-medium text-amber-300">Pending permission</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    SlowMist&apos;s public incident list. We are waiting for SlowMist to confirm that we may reuse its records.
                  </p>
                </Card>
              </li>
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">
                    <ExternalAnchor href={WEB3_IS_GOING_GREAT_URL}>Web3 Is Going Just Great</ExternalAnchor>
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Molly White&apos;s timeline of crypto hacks, scams and failures. We read new entries from the site.
                  </p>
                </Card>
              </li>
              <li>
                <Card className="p-4">
                  <p className="font-semibold text-foreground">Security news feeds (RSS)</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Sources include The Hacker News, BleepingComputer, SecurityWeek, CISA Alerts, Dark Reading and Krebs on Security.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Administrators add and retire feeds over time, so the current list can differ. A classifier keeps items about incidents, vulnerabilities and attacks, and hides the rest.
                  </p>
                </Card>
              </li>
            </ul>
          </Section>

          <Section id="severity" title="Severity">
            <p className="leading-7 text-muted-foreground">
              Web3 incidents are rated by reported loss. Some attack types are rated High even when the loss is small. The rules are checked in this order, and the first match wins:
            </p>
            <dl className="divide-y divide-border rounded-lg border border-border">
              {severityRubric.map((row) => (
                <div key={row.rule} className="grid gap-1 p-3 sm:grid-cols-[7rem_1fr] sm:gap-4">
                  <dt className="font-semibold text-foreground">{row.level}</dt>
                  <dd className="text-sm leading-6 text-muted-foreground">{row.rule}</dd>
                </div>
              ))}
            </dl>
            <p className="leading-7 text-muted-foreground">
              Security news items get their severity from words in the headline and the matched keywords. For example, &quot;zero-day&quot;, &quot;actively exploited&quot; and &quot;remote code execution&quot; make an item Critical. Treat it as a rough guide, not a CVSS score. Severity describes the size of an incident, not how much it affects you.
            </p>
          </Section>

          <Section id="verification" title="Confirmed and unconfirmed">
            <p className="leading-7 text-muted-foreground">
              <strong className="text-foreground">Unconfirmed</strong> means the source has reported the incident but has not verified it. The details, the date and the loss figure may change, and some reports are withdrawn.
            </p>
            <p className="leading-7 text-muted-foreground">
              <strong className="text-foreground">Confirmed</strong> means the source has marked the incident as verified. Digibastion shows that status as the source gives it. Items with neither label come from sources that do not publish a verification status.
            </p>
            <p className="leading-7 text-muted-foreground">
              Loss figures follow the same idea. &quot;~$3.8M reported&quot; is a figure nobody has confirmed yet, &quot;$3.8M&quot; is confirmed, and &quot;(revised)&quot; means the source changed it after the first report.
            </p>
          </Section>

          <Section id="duplicates" title="How duplicates are merged">
            <p className="leading-7 text-muted-foreground">
              Several trackers often report the same incident. We treat two reports as one incident when the project name matches and either the incident dates are the same day, or they are within two days of each other and the reports agree on the loss amount, the attack method or a reference link.
            </p>
            <p className="leading-7 text-muted-foreground">
              Each incident keeps one record, and every report we merged into it is listed as a source on that record. When sources disagree, QuillMonitor comes first, then the other incident trackers, then SlowMist.
            </p>
          </Section>

          <Section id="dates" title="Dates">
            <p className="leading-7 text-muted-foreground">
              Each incident shows two dates: when it happened, as the source reports it, and when we added it. When a source gives no usable date, the record says the date is unknown rather than guessing.
            </p>
          </Section>

          <Section id="corrections" title="Corrections">
            <p className="leading-7 text-muted-foreground">
              If something is wrong, email{' '}
              <a href={`mailto:${CORRECTIONS_EMAIL}`} className="font-medium text-primary underline-offset-2 hover:underline">{CORRECTIONS_EMAIL}</a>{' '}
              with the incident link, what is wrong, and a public source for the correct information. We fix our own errors. When the error comes from a source, we tell that source and update the record when they correct it.
            </p>
          </Section>

          <Section id="official-channels" title="Official channels">
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-muted-foreground">Website</dt>
                <dd><ExternalAnchor href={SITE_URL}>www.digibastion.com</ExternalAnchor></dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Telegram alerts channel (@digibastion)</dt>
                <dd><ExternalAnchor href={TELEGRAM_CHANNEL_URL}>t.me/digibastion</ExternalAnchor></dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Telegram community chat</dt>
                <dd><ExternalAnchor href={TELEGRAM_COMMUNITY_URL}>t.me/digibastion_chat</ExternalAnchor></dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email alerts are sent from</dt>
                <dd className="font-medium text-foreground">{ALERTS_SENDER_EMAIL}</dd>
              </div>
            </dl>
            <Card className="flex gap-3 border-amber-500/30 bg-amber-500/5 p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <p className="text-sm leading-6 text-foreground/80">
                Digibastion will never ask you to connect a wallet, sign a transaction, share a seed phrase or private key, or send funds. Any account or message that asks for these is not us, even if it uses our name or logo.
              </p>
            </Card>
          </Section>

          <Section id="references" title="References">
            <p className="leading-7 text-muted-foreground">Outside sources we link from incident pages and use for context:</p>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {references.map((reference) => (
                <li key={reference.href} className="p-3">
                  <a
                    href={reference.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {reference.name}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <p className="text-sm text-muted-foreground">{reference.use}</p>
                </li>
              ))}
            </ul>
          </Section>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ThreatIntelMethodology;
```

- [ ] **Step 4: Register the route**

In `src/App.tsx`:

Before:
```tsx
const News = React.lazy(() => import("./pages/News"));
```
After:
```tsx
const News = React.lazy(() => import("./pages/News"));
const ThreatIntelMethodology = React.lazy(() => import("./pages/ThreatIntelMethodology"));
```

Before:
```tsx
                    <Route path="/threat-intel" element={<><MetaTags /><News /></>} />
                    <Route path="/threat-intel/:articleId" element={<><MetaTags /><News /></>} />
```
After:
```tsx
                    <Route path="/threat-intel" element={<><MetaTags /><News /></>} />
                    {/* Keep before :articleId so "methodology" is never read as an article id. */}
                    <Route path="/threat-intel/methodology" element={<><MetaTags /><ThreatIntelMethodology /></>} />
                    <Route path="/threat-intel/:articleId" element={<><MetaTags /><News /></>} />
```

- [ ] **Step 5: Link the page from the feed**

In `src/pages/News.tsx`:

Before (the import added in C4):
```tsx
import { TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';
```
After:
```tsx
import { METHODOLOGY_PATH, TELEGRAM_CHANNEL_URL } from '@/lib/threatIntel/officialLinks';
```

The "sources checked" badge (about lines 688-707):

Before:
```tsx
                      {pagination.totalCount > 0 && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            feedStatus.source === 'cache' || feedStatus.pipelineIsStale
                              ? 'border-yellow-500/40 text-yellow-500'
                              : 'border-emerald-500/40 text-emerald-400'
                          }`}
                          title={feedStatus.pipelineCheckedAt
                            ? `All active RSS sources checked by ${format(feedStatus.pipelineCheckedAt, 'PPpp')}`
                            : (feedStatus.checkedAt ? `Database checked ${format(feedStatus.checkedAt, 'PPpp')}` : undefined)}
                        >
                          <Database className="w-3 h-3 mr-1" />
                          {feedStatus.source === 'cache'
                            ? (feedStatus.isStale ? 'Cached · stale' : 'Cached')
                            : feedStatus.pipelineCheckedAt
                              ? `${feedStatus.checkedFeedCount}/${feedStatus.activeFeedCount} sources checked ${formatDistanceToNow(feedStatus.pipelineCheckedAt, { addSuffix: true })}`
                              : 'Live database'}
                        </Badge>
                      )}
```
After:
```tsx
                      {pagination.totalCount > 0 && (
                        <Link
                          to={`${METHODOLOGY_PATH}#sources`}
                          className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <Badge
                            variant="outline"
                            className={`text-xs hover:border-primary/60 ${
                              feedStatus.source === 'cache' || feedStatus.pipelineIsStale
                                ? 'border-yellow-500/40 text-yellow-500'
                                : 'border-emerald-500/40 text-emerald-400'
                            }`}
                            title={feedStatus.pipelineCheckedAt
                              ? `All active RSS sources checked by ${format(feedStatus.pipelineCheckedAt, 'PPpp')}`
                              : (feedStatus.checkedAt ? `Database checked ${format(feedStatus.checkedAt, 'PPpp')}` : undefined)}
                          >
                            <Database className="w-3 h-3 mr-1" aria-hidden="true" />
                            {feedStatus.source === 'cache'
                              ? (feedStatus.isStale ? 'Cached · stale' : 'Cached')
                              : feedStatus.pipelineCheckedAt
                                ? `${feedStatus.checkedFeedCount}/${feedStatus.activeFeedCount} sources checked ${formatDistanceToNow(feedStatus.pipelineCheckedAt, { addSuffix: true })}`
                                : 'Live database'}
                          </Badge>
                        </Link>
                      )}
```

The footer area at the end of the page container:

Before:
```tsx
          </SwipeableTabs>
        </div>
      </main>
```
After:
```tsx
          </SwipeableTabs>

          <p className="mt-10 border-t border-border/60 pt-6 text-center text-sm text-muted-foreground">
            Where these records come from, how severity is set and how to report a mistake:{' '}
            <Link to={METHODOLOGY_PATH} className="font-medium text-primary underline-offset-2 hover:underline">
              sources and methodology
            </Link>
            .
          </p>
        </div>
      </main>
```

- [ ] **Step 6: Add the page to the static sitemap**

In `public/sitemap.xml`:

Before:
```xml
    <image:caption>Threat Intelligence Feed - Web3 Security Alerts</image:caption>
  </image:image>
</url>
```
After:
```xml
    <image:caption>Threat Intelligence Feed - Web3 Security Alerts</image:caption>
  </image:image>
</url>
<url>
  <loc>https://www.digibastion.com/threat-intel/methodology</loc>
  <lastmod>2026-10-10</lastmod>
  <priority>0.6</priority>
  <changefreq>monthly</changefreq>
</url>
```

Run `xmllint --noout public/sitemap.xml`. Expected: no output (well-formed).

- [ ] **Step 7: Run the tests to see them pass**

Run: `rtk proxy npx vitest run src/pages/__tests__/ThreatIntelMethodology.test.tsx src/pages/__tests__/News.hero.test.tsx src/pages/__tests__/News.navigation.test.tsx`

Expected: PASS (4 + 6 + 2 tests).

Then `npx tsc --noEmit -p tsconfig.app.json` and `npx eslint src/pages/ThreatIntelMethodology.tsx src/App.tsx src/pages/News.tsx src/pages/__tests__`. Expected: no errors.

Manual check: with `npm run dev`, open `/threat-intel/methodology` directly, then `/threat-intel/methodology#severity` (the page scrolls to Severity), then click the "sources checked" chip on `/threat-intel`. At 390px, confirm nothing scrolls sideways.

- [ ] **Step 8: Commit**

```bash
git add src/pages/ThreatIntelMethodology.tsx src/pages/__tests__/ThreatIntelMethodology.test.tsx src/App.tsx src/pages/News.tsx src/pages/__tests__/News.hero.test.tsx public/sitemap.xml
git commit -m "feat(threat-intel): add a sources and methodology page" -m "New /threat-intel/methodology page covering sources, the loss-based severity rubric, confirmed vs unconfirmed, duplicate merging, dates, corrections, official channels and references. Linked from the sources chip and the feed footer, and listed in the static sitemap."
```

---
### Task C6: Alerts panel extraction, dead code and homepage fixes

`src/pages/News.tsx` started at 1,182 lines. C4 moved the toolbar out. This task moves the Active Alerts tab into `AlertsPanel`, deletes three pieces of dead code, and fixes two homepage problems: latest-alert rows all open `?tab=alerts` instead of the incident, and subscribe sits next to the weak "(10+ security professionals)" count.

The alerts panel is presentational. Fetching, the auto-refresh timer and the tab count stay in `News.tsx`, because the realtime listener and the admin "Web3 Incidents" button also call `fetchActiveAlerts`. Behaviour stays the same, with three deliberate changes:
- a skeleton shows while the first load runs (spec 7.6: "the Alerts tab shows nothing while loading");
- the "Preliminary" / "Action Required" badges become the C2 verification badge, so a preliminary critical no longer looks like a confirmed one;
- the date column uses the incident date label from C1.

**Files:**
- Create: `src/components/news/AlertsPanel.tsx`
- Test: create `src/components/news/__tests__/AlertsPanel.test.tsx`
- Modify: `src/pages/News.tsx` (imports; `AUTO_REFRESH_OPTIONS`, lines 44-49; alert memos, lines 391-401; the tabs `count`; the alerts block, lines 915-1141; the subscribe breadcrumb, line 1160)
- Delete: `src/components/news/ThreatStatsDashboard.tsx`, `src/data/currentNewsData.ts`
- Modify: `src/data/newsData.ts` (lines 1-70)
- Modify: `src/components/news/EmailPreview.tsx` (imports; props interface, lines 8-17; signature, lines 122-131; trigger, lines 214-219)
- Modify: `src/components/newsletter/QuickSubscribeCard.tsx` (lines 6-9, 24, 52, 154-163)
- Test: create `src/components/newsletter/__tests__/QuickSubscribeCard.test.tsx`
- Modify: `src/components/news/SubscriptionForm.tsx` (lines 8-9, 14, 49, 236-241)
- Modify: `src/pages/Index.tsx` (lines 2, 19, 74, 279-283, 293-299)

**Interfaces:**
- Consumes: `getIncidentDisplay` (C1), `VerificationBadge` (C2), `QUILLMONITOR_DATABASE_URL` (C1), `AlertListSkeleton` from `src/components/news/NewsCardSkeleton.tsx`.
- Produces:
  - `AUTO_REFRESH_OPTIONS: { value: string; label: string }[]` (moved from `News.tsx`)
  - `interface AlertsPanelProps { alerts: NewsArticle[]; loading: boolean; error: string | null; autoRefreshInterval: number; onAutoRefreshIntervalChange(seconds: number): void; onRefresh(): void; onSelectAlert(alert: NewsArticle): void; onNavigateHome(): void; onNavigateFeed(): void }`
  - `AlertsPanel(props: AlertsPanelProps)`
  - `EmailPreview` gains optional `triggerLabel?: string` (default `'Preview Email'`), `triggerVariant?: ButtonProps['variant']` (default `'outline'`) and `triggerClassName?: string`.

- [ ] **Step 1: List every use of the dead code**

Run: `rtk proxy grep -rn "ThreatStatsDashboard\|currentNewsData\|currentNewsArticles\|currentSecurityAlerts\|mockNewsArticles\|mockSecurityAlerts" src supabase api public`

Expected output (as of commit `be5d978`):
```
src/components/news/ThreatStatsDashboard.tsx:62:export const ThreatStatsDashboard = () => {
src/data/newsData.ts:2:import { currentNewsArticles, currentSecurityAlerts } from './currentNewsData';
src/data/newsData.ts:5:export const mockNewsArticles: NewsArticle[] = [
src/data/newsData.ts:6:  ...currentNewsArticles,
src/data/newsData.ts:46:export const mockSecurityAlerts: SecurityAlert[] = [
src/data/newsData.ts:47:  ...currentSecurityAlerts,
```

So nothing imports `ThreatStatsDashboard`, and nothing imports `mockNewsArticles` or `mockSecurityAlerts`. The only import to remove is `src/data/newsData.ts:2`, the import of `currentNewsData`. If the command prints any other file, remove that import as part of Step 7 and add the path to the Step 9 commit.

- [ ] **Step 2: Write the failing tests**

Create `src/components/news/__tests__/AlertsPanel.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertsPanel, type AlertsPanelProps } from '@/components/news/AlertsPanel';
import type { NewsArticle } from '@/types/news';

const unconfirmedCritical: NewsArticle = {
  id: 'quillmonitor:ledger',
  title: 'Ledger: Security incident ($86M loss)',
  summary: 'Summary pending',
  content: '',
  category: 'web3-security',
  tags: [],
  severity: 'critical',
  publishedAt: new Date('2026-10-08T00:00:00.000Z'),
  sourceName: 'QuillMonitor',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    verification_status: 'unverified',
    incident_date: '2026-10-08',
    attribution_url: 'https://www.quillaudits.com/web3-hacks-database',
  },
};

const highNews: NewsArticle = {
  id: 'rss-1',
  title: 'Vendor patches VPN flaw',
  summary: 'Fixes are out for a flaw attackers are using.',
  content: '',
  category: 'vulnerability-disclosure',
  tags: [],
  severity: 'high',
  publishedAt: new Date('2026-10-07T10:00:00.000Z'),
  sourceName: 'BleepingComputer',
};

const makeProps = (overrides: Partial<AlertsPanelProps> = {}): AlertsPanelProps => ({
  alerts: [unconfirmedCritical, highNews],
  loading: false,
  error: null,
  autoRefreshInterval: 0,
  onAutoRefreshIntervalChange: vi.fn(),
  onRefresh: vi.fn(),
  onSelectAlert: vi.fn(),
  onNavigateHome: vi.fn(),
  onNavigateFeed: vi.fn(),
  ...overrides,
});

afterEach(cleanup);

describe('AlertsPanel', () => {
  it('groups alerts by severity and labels unconfirmed incidents', () => {
    const props = makeProps();
    render(<AlertsPanel {...props} />);

    expect(screen.getByText('Critical Alerts (1)')).not.toBeNull();
    expect(screen.getByText('High Priority Alerts (1)')).not.toBeNull();
    expect(screen.getByText('Exploited Oct 8, 2026')).not.toBeNull();
    expect(screen.queryByText('Action Required')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Unconfirmed/ }));
    expect(props.onSelectAlert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: unconfirmedCritical.title }));
    expect(props.onSelectAlert).toHaveBeenCalledWith(unconfirmedCritical);
  });

  it('shows a skeleton instead of the empty state during the first load', () => {
    render(<AlertsPanel {...makeProps({ alerts: [], loading: true })} />);

    expect(screen.getByTestId('alerts-loading')).not.toBeNull();
    expect(screen.queryByText('No alerts available')).toBeNull();
  });

  it('reports a load error and retries', () => {
    const props = makeProps({ alerts: [], error: 'Active alerts could not be loaded.' });
    render(<AlertsPanel {...props} />);

    expect(screen.getByText('Active alerts could not be loaded.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('navigates through the breadcrumb', () => {
    const props = makeProps();
    render(<AlertsPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Threat Intel' }));
    expect(props.onNavigateHome).toHaveBeenCalledTimes(1);
    expect(props.onNavigateFeed).toHaveBeenCalledTimes(1);
  });
});
```

Create `src/components/newsletter/__tests__/QuickSubscribeCard.test.tsx`:

```tsx
// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickSubscribeCard } from '@/components/newsletter/QuickSubscribeCard';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    rpc: vi.fn().mockResolvedValue({ data: { count: 10, label: '10+ security professionals' }, error: null }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

afterEach(cleanup);

describe('QuickSubscribeCard', () => {
  it('offers a sample email instead of a subscriber count', async () => {
    render(<MemoryRouter><QuickSubscribeCard /></MemoryRouter>);

    expect(screen.queryByText(/security professionals/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'See a sample email' }));
    expect(await screen.findByRole('dialog', { name: 'Email Preview' })).not.toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `rtk proxy npx vitest run src/components/news/__tests__/AlertsPanel.test.tsx src/components/newsletter/__tests__/QuickSubscribeCard.test.tsx`

Expected: FAIL. `AlertsPanel.test.tsx` reports `Failed to resolve import "@/components/news/AlertsPanel"`. `QuickSubscribeCard.test.tsx` reports `Unable to find an accessible element with the role "button" and name "See a sample email"`.

- [ ] **Step 4: Create the alerts panel**

Create `src/components/news/AlertsPanel.tsx`:

```tsx
import { useMemo } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Clock, Home, Loader2, RefreshCw, Shield } from 'lucide-react';
import { AlertListSkeleton } from '@/components/news/NewsCardSkeleton';
import { VerificationBadge } from '@/components/news/VerificationBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getIncidentDisplay } from '@/lib/threatIntel/incidentDisplay';
import { QUILLMONITOR_DATABASE_URL } from '@/lib/threatIntel/officialLinks';
import type { NewsArticle } from '@/types/news';
import { isQuillMonitorArticle } from '@/utils/newsIncident';
import { safeExternalUrl } from '@/utils/safeUrl';

export const AUTO_REFRESH_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '30', label: '30s' },
  { value: '60', label: '1m' },
  { value: '300', label: '5m' },
];

export interface AlertsPanelProps {
  alerts: NewsArticle[];
  loading: boolean;
  error: string | null;
  /** Seconds between automatic refreshes; 0 turns it off. */
  autoRefreshInterval: number;
  onAutoRefreshIntervalChange: (seconds: number) => void;
  onRefresh: () => void;
  onSelectAlert: (alert: NewsArticle) => void;
  onNavigateHome: () => void;
  onNavigateFeed: () => void;
}

interface AlertRowProps {
  alert: NewsArticle;
  severityLabel: 'CRITICAL' | 'HIGH';
  severityBadgeClass: string;
  rowClass: string;
  showCve: boolean;
  onSelect: (alert: NewsArticle) => void;
}

function AlertRow({ alert, severityLabel, severityBadgeClass, rowClass, showCve, onSelect }: AlertRowProps) {
  const display = getIncidentDisplay(alert);

  return (
    <div
      className={`p-4 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer ${rowClass}`}
      onClick={() => onSelect(alert)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={severityBadgeClass}>{severityLabel}</Badge>
            {isQuillMonitorArticle(alert) && (
              <a
                href={safeExternalUrl(alert.metadata?.attribution_url) || QUILLMONITOR_DATABASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline underline-offset-2"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                Powered by QuillMonitor
              </a>
            )}
            {display.verification && (
              // The row is clickable; keep badge clicks from opening the alert.
              <span
                className="inline-flex"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <VerificationBadge verification={display.verification} help={display.verificationHelp} />
              </span>
            )}
            {showCve && alert.cveId && (
              <Badge variant="secondary">{alert.cveId}</Badge>
            )}
          </div>
          <h3 className="font-medium mb-1">
            <button
              type="button"
              className="text-left"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(alert);
              }}
            >
              {alert.title}
            </button>
          </h3>
          <p className="text-sm text-muted-foreground mb-3">{alert.summary}</p>
          <div className="flex flex-wrap gap-1">
            {alert.affectedTechnologies?.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {display.incidentDateLabel ?? format(new Date(alert.publishedAt), 'MMM d, yyyy')}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AlertsPanel({
  alerts,
  loading,
  error,
  autoRefreshInterval,
  onAutoRefreshIntervalChange,
  onRefresh,
  onSelectAlert,
  onNavigateHome,
  onNavigateFeed,
}: AlertsPanelProps) {
  const criticalAlerts = useMemo(() => alerts.filter((alert) => alert.severity === 'critical'), [alerts]);
  const highAlerts = useMemo(() => alerts.filter((alert) => alert.severity === 'high'), [alerts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateHome}
            className="h-auto p-1 hover:text-foreground"
            aria-label="Home"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
          </Button>
          <span aria-hidden="true">/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateFeed}
            className="h-auto p-1 hover:text-foreground"
          >
            Threat Intel
          </Button>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Active Alerts</span>
        </nav>
        <div className="flex items-center gap-2">
          <Select
            value={autoRefreshInterval.toString()}
            onValueChange={(value) => onAutoRefreshIntervalChange(Number.parseInt(value, 10))}
          >
            <SelectTrigger className="w-24 h-8 text-xs" aria-label="Auto-refresh interval">
              <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              {AUTO_REFRESH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {autoRefreshInterval > 0 && (
            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
              Auto-refresh: {AUTO_REFRESH_OPTIONS.find((option) => option.value === autoRefreshInterval.toString())?.label}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {loading && alerts.length === 0 && (
        <div data-testid="alerts-loading" aria-busy="true">
          <AlertListSkeleton count={3} />
        </div>
      )}

      {criticalAlerts.length > 0 && (
        <Card className="glass-card border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              Critical Alerts ({criticalAlerts.length})
            </CardTitle>
            <CardDescription>
              Critical-severity threats and published incident reports requiring prompt review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                severityLabel="CRITICAL"
                severityBadgeClass="bg-red-500 text-white"
                rowClass="border border-red-500/20 bg-background/50"
                showCve
                onSelect={onSelectAlert}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {highAlerts.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" aria-hidden="true" />
              High Priority Alerts ({highAlerts.length})
            </CardTitle>
            <CardDescription>Important security alerts requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {highAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                severityLabel="HIGH"
                severityBadgeClass="bg-orange-500 text-white"
                rowClass="border bg-card"
                showCve={false}
                onSelect={onSelectAlert}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && alerts.length === 0 && (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium mb-2">No alerts available</h3>
            <p className="text-muted-foreground mb-4">{error || 'No critical or high priority alerts are active.'}</p>
            <Button onClick={onRefresh}>Try Again</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Use the panel in the page**

All edits are in `src/pages/News.tsx`. Line numbers are from the original file; earlier tasks have shifted them, so search for the quoted text.

5a. Imports. If section B rewrote the `newsIncident` import, remove `isPreliminaryQuillMonitorArticle`, `isQuillMonitorArticle` and the `safeExternalUrl` import from whatever is there now.

Before:
```tsx
import { InlineSubscribeCard } from '@/components/news/InlineSubscribeCard';
```
After:
```tsx
import { InlineSubscribeCard } from '@/components/news/InlineSubscribeCard';
import { AlertsPanel } from '@/components/news/AlertsPanel';
```

Before:
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
```
After:
```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
```

Before:
```tsx
import {
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isClassificationRelevant,
  isPreliminaryQuillMonitorArticle,
  isQuillMonitorArticle,
} from '@/utils/newsIncident';
import { safeExternalUrl } from '@/utils/safeUrl';
```
After:
```tsx
import {
  CLASSIFICATION_RELEVANCE_POSTGREST_FILTER,
  isClassificationRelevant,
} from '@/utils/newsIncident';
```

5b. Delete the `AUTO_REFRESH_OPTIONS` array (original lines 44-49) and the blank line after it. It now lives in `AlertsPanel.tsx`.

```tsx
const AUTO_REFRESH_OPTIONS = [
  { value: '0', label: 'Off' },
  { value: '30', label: '30s' },
  { value: '60', label: '1m' },
  { value: '300', label: '5m' },
];

```

5c. Delete the three alert memos (original lines 391-401) and the blank line after them:

```tsx
  const criticalAlerts = useMemo(() => {
    return activeAlerts.filter(article => article.severity === 'critical');
  }, [activeAlerts]);

  const highAlerts = useMemo(() => {
    return activeAlerts.filter(article => article.severity === 'high');
  }, [activeAlerts]);

  const actionRequiredAlerts = useMemo(() => {
    return activeAlerts;
  }, [activeAlerts]);

```

5d. Tab count.

Before:
```tsx
    { id: 'alerts', label: 'Active Alerts', shortLabel: 'Alerts', icon: AlertTriangle, count: activeAlertCount || actionRequiredAlerts.length },
```
After:
```tsx
    { id: 'alerts', label: 'Active Alerts', shortLabel: 'Alerts', icon: AlertTriangle, count: activeAlertCount || activeAlerts.length },
```

5e. Replace the whole alerts block. It starts at the line `          {selectedTab === 'alerts' && (` (original line 915) and ends at the `          )}` directly above the blank line before `          {selectedTab === 'subscribe' && (` (original line 1141). Its last lines are:

```tsx
              </div>
            </ErrorBoundary>
          )}
```

Replace that whole block with:

```tsx
          {selectedTab === 'alerts' && (
            <ErrorBoundary>
              <AlertsPanel
                alerts={activeAlerts}
                loading={alertsLoading}
                error={alertsError}
                autoRefreshInterval={autoRefreshInterval}
                onAutoRefreshIntervalChange={setAutoRefreshInterval}
                onRefresh={() => void fetchActiveAlerts()}
                onSelectAlert={handleArticleClick}
                onNavigateHome={() => navigate('/')}
                onNavigateFeed={() => handleTabChange('feed')}
              />
            </ErrorBoundary>
          )}
```

5f. The subscribe breadcrumb left `tab=subscribe` in the URL (spec 7.6, original line 1160).

Before:
```tsx
                    onClick={() => setSelectedTab('feed')}
```
After:
```tsx
                    onClick={() => handleTabChange('feed')}
```

Check the result: `wc -l src/pages/News.tsx` should print well under 900 lines. Run `rtk proxy grep -n "criticalAlerts\|highAlerts\|actionRequiredAlerts\|AUTO_REFRESH_OPTIONS\|SelectTrigger" src/pages/News.tsx`. Expected: no matches.

- [ ] **Step 6: Homepage and subscribe copy**

6a. `src/components/news/EmailPreview.tsx`: let callers relabel the trigger.

Before:
```tsx
import { Button } from '@/components/ui/button';
```
After:
```tsx
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```

Before:
```tsx
  preferredDay?: number;
}

interface PreviewArticle {
```
After:
```tsx
  preferredDay?: number;
  /** Text on the button that opens the preview. */
  triggerLabel?: string;
  triggerVariant?: ButtonProps['variant'];
  triggerClassName?: string;
}

interface PreviewArticle {
```

Before:
```tsx
  preferredDay = 0
}: EmailPreviewProps) => {
```
After:
```tsx
  preferredDay = 0,
  triggerLabel = 'Preview Email',
  triggerVariant = 'outline',
  triggerClassName,
}: EmailPreviewProps) => {
```

Before:
```tsx
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="w-4 h-4" />
          Preview Email
        </Button>
```
After:
```tsx
        <Button type="button" variant={triggerVariant} size="sm" className={cn('gap-2', triggerClassName)}>
          <Eye className="w-4 h-4" aria-hidden="true" />
          {triggerLabel}
        </Button>
```

6b. `src/components/newsletter/QuickSubscribeCard.tsx`: replace the subscriber count with a sample email.

Before:
```tsx
import { Badge } from '@/components/ui/badge';
import { Bell, Users, Loader2, CheckCircle, Mail, Shield, User, Settings, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscriberCount } from '@/hooks/useSubscriberCount';
```
After:
```tsx
import { Bell, Loader2, CheckCircle, Mail, Shield, User, Settings, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmailPreview } from '@/components/news/EmailPreview';
import type { NewsCategory } from '@/types/news';
```

Before:
```tsx
interface QuickSubscribeCardProps {
```
After:
```tsx
const QUICK_SUBSCRIBE_CATEGORIES: NewsCategory[] = ['web3-security', 'defi-exploits', 'vulnerability-disclosure'];

interface QuickSubscribeCardProps {
```

Before:
```tsx
  const { toast } = useToast();
  const { data: subscriberCount } = useSubscriberCount();
```
After:
```tsx
  const { toast } = useToast();
```

Before:
```tsx
            categories: ['web3-security', 'defi-exploits', 'vulnerability-disclosure'],
```
After:
```tsx
            categories: QUICK_SUBSCRIBE_CATEGORIES,
```

Before:
```tsx
                {subscriberCount && subscriberCount.count > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-0.5">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] sm:text-xs">{subscriberCount.label}</span>
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Daily digest of critical crypto security threats at <span className="font-medium text-foreground">{deliveryTimeDisplay}</span>
              </p>
```
After:
```tsx
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Daily digest of high and critical crypto security threats at <span className="font-medium text-foreground">{deliveryTimeDisplay}</span>.{' '}
                <EmailPreview
                  categories={QUICK_SUBSCRIBE_CATEGORIES}
                  frequency="daily"
                  severity="high"
                  preferredHour={preferredHour}
                  timezoneOffset={timezoneOffset}
                  triggerLabel="See a sample email"
                  triggerVariant="link"
                  triggerClassName="h-auto p-0 text-xs sm:text-sm"
                />
              </p>
```

The digest copy now says "high and critical" because the request already sends `severity: 'high'`.

6c. `src/components/news/SubscriptionForm.tsx`: drop the same count from the full form. It already has a "Preview Email" button.

Before:
```tsx
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2, Clock, Users } from 'lucide-react';
```
After:
```tsx
import { Bell, Mail, Shield, Zap, CheckCircle, Loader2, Clock } from 'lucide-react';
```

Before:
```tsx
import { useSubscriberCount } from '@/hooks/useSubscriberCount';
```
After: delete the line.

Before:
```tsx
  const { data: subscriberCount } = useSubscriberCount();
```
After: delete the line.

Before:
```tsx
          {subscriberCount && subscriberCount.count > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs">{subscriberCount.label}</span>
            </Badge>
          )}
```
After: delete these six lines.

Then run `rtk proxy grep -n "Badge\|Users\|subscriberCount" src/components/news/SubscriptionForm.tsx`. Expected: no matches. If `Badge` still appears, section D has added a use of it: put the `Badge` import back.

6d. `src/pages/Index.tsx`: alert rows open the incident, and subscribe loses the count.

Before:
```tsx
import { useLocation, useNavigate } from 'react-router-dom';
```
After:
```tsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
```

Before:
```tsx
import { useSubscriberCount } from '@/hooks/useSubscriberCount';
```
After: delete the line.

Before:
```tsx
  const { data: subscriberCount } = useSubscriberCount();
```
After: delete the line.

Before:
```tsx
                <Button onClick={() => navigate('/threat-intel?tab=alerts')} className="w-full gap-2 sm:w-auto"><Newspaper className="h-4 w-4" /> View threat feed</Button>
                <Button onClick={() => navigate('/threat-intel?tab=subscribe')} variant="outline" className="w-full gap-2 sm:w-auto">
                  <Bell className="h-4 w-4" /> Subscribe
                  {subscriberCount && subscriberCount.count > 0 && <span className="text-xs">({subscriberCount.label})</span>}
                </Button>
```
After:
```tsx
                <Button onClick={() => navigate('/threat-intel')} className="w-full gap-2 sm:w-auto"><Newspaper className="h-4 w-4" /> View threat feed</Button>
                <Button onClick={() => navigate('/threat-intel?tab=subscribe')} variant="outline" className="w-full gap-2 sm:w-auto">
                  <Bell className="h-4 w-4" /> Subscribe
                </Button>
```

Before:
```tsx
                  <button key={alert.id} type="button" onClick={() => navigate('/threat-intel?tab=alerts')} className="flex w-full items-start gap-3 rounded-xl border border-transparent bg-background/70 p-3 text-left transition-colors hover:border-border">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.severity === 'critical' ? 'bg-destructive' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{alert.title}</span>
                      <span className="mt-1 block text-xs capitalize text-muted-foreground">{alert.severity} · {formatDistanceToNow(new Date(alert.published_at), { addSuffix: true })}</span>
                    </span>
                  </button>
```
After:
```tsx
                  <Link key={alert.id} to={`/threat-intel/${encodeURIComponent(alert.id)}`} className="flex w-full items-start gap-3 rounded-xl border border-transparent bg-background/70 p-3 text-left transition-colors hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${alert.severity === 'critical' ? 'bg-destructive' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{alert.title}</span>
                      <span className="mt-1 block text-xs capitalize text-muted-foreground">{alert.severity} · {formatDistanceToNow(new Date(alert.published_at), { addSuffix: true })}</span>
                    </span>
                  </Link>
```

"View all" (line 289) still goes to `?tab=alerts`, which is right for that label. "View threat feed" now opens the feed instead of the alerts tab, to match its label.

- [ ] **Step 7: Delete the dead code**

```bash
rm src/components/news/ThreatStatsDashboard.tsx src/data/currentNewsData.ts
```

Use plain `rm`, not `git rm`, so the deletions are not staged before the first two commits in Step 9.

In `src/data/newsData.ts`, delete everything from line 1 down to, but not including, the line `export const technologyCategories: TechnologyCategory[] = [`. That removes the `currentNewsData` import, `mockNewsArticles` and `mockSecurityAlerts`. Put this line and one blank line in their place:

```ts
import { TechnologyCategory } from '@/types/news';
```

If section B has already moved or rewritten parts of this file, delete only the `currentNewsData` import and the `mockNewsArticles` and `mockSecurityAlerts` exports, and trim the `@/types/news` import to what is still used.

Check: `rtk proxy sed -n 1,3p src/data/newsData.ts` prints the import, a blank line, and `export const technologyCategories: TechnologyCategory[] = [`. Re-run the Step 1 grep. Expected: no output.

- [ ] **Step 8: Run everything**

Run: `rtk proxy npx vitest run src/components/news/__tests__/AlertsPanel.test.tsx src/components/newsletter/__tests__/QuickSubscribeCard.test.tsx src/pages/__tests__/News.navigation.test.tsx src/pages/__tests__/News.hero.test.tsx`

Expected: PASS (4 + 1 + 2 + 6 tests).

Run: `rtk proxy npx vitest run`

Expected: the whole suite passes, including the C1-C5 tests.

Run `npx tsc --noEmit -p tsconfig.app.json`, `npx eslint src/pages src/components/news src/components/newsletter src/data src/lib/threatIntel` and `npm run build`. Expected: no type or lint errors, and the build finishes. The `ThreatStatsDashboard` chunk is gone from the build output.

Manual check with `npm run dev`:
- on `/`, each "Latest alerts" row opens its incident page;
- "See a sample email" opens the preview dialog;
- no subscriber count shows next to Subscribe;
- on `/threat-intel?tab=alerts`, a skeleton shows while loading, and unconfirmed items carry the amber badge.

- [ ] **Step 9: Commit**

Three commits, so each change can be reverted on its own:

```bash
git add src/components/news/AlertsPanel.tsx src/components/news/__tests__/AlertsPanel.test.tsx src/pages/News.tsx
git commit -m "refactor(threat-intel): extract the active alerts panel" -m "Move the alerts tab out of News.tsx into a presentational AlertsPanel. Fetching and auto-refresh stay in the page. The panel shows a skeleton while loading, uses the confirmed/unconfirmed badge instead of Preliminary/Action Required, and the subscribe breadcrumb no longer leaves tab=subscribe in the URL."

git add src/components/news/EmailPreview.tsx src/components/newsletter/QuickSubscribeCard.tsx src/components/newsletter/__tests__/QuickSubscribeCard.test.tsx src/components/news/SubscriptionForm.tsx src/pages/Index.tsx
git commit -m "fix(home): link latest alerts to incidents and show a sample email" -m "Homepage alert rows open the incident page instead of the alerts tab, and View threat feed opens the feed. Replace the subscriber-count badge with a sample email preview on the quick subscribe card and drop it from the full form."

git add src/data/newsData.ts src/components/news/ThreatStatsDashboard.tsx src/data/currentNewsData.ts
git commit -m "chore(threat-intel): remove unused mock news data and stats dashboard" -m "ThreatStatsDashboard, currentNewsData and the mockNewsArticles/mockSecurityAlerts exports had no importers."
```

`git add` on a deleted path stages the deletion. Run `git status --short` before each commit to confirm only the listed files are staged.

---
### Notes for the plan author

**Interface assumptions this section relies on**

- **Section A, `readIncidentFields`.** It reads the metadata keys named in spec section 12 (coordination rule 1): `sources` (`[{provider, url, label, amount_usd}]`), `summary_source`, `amount_status`, `funds_returned`, `incident_date_unknown`, plus the existing `incident_date` and `verification_status`. It returns `null` or `[]` when a key is absent; in particular `amountStatus` is `null`, not `'reported'`, when missing. The C1 and C2 fixtures use these key names. If A reads different keys, fix the fixtures, not the display rules. C1 also falls back to the legacy keys (`verification_status`, `incident_date`, `summary_origin`) so records written before A still render correctly.
- **Section B, `taxonomy.ts`.** `getCategoryConfig(category: string)` returns at least `{ name: string; color: string }` and a fallback for unknown categories (the C2 and C3 "retired-category" tests depend on it). `parseScope(value: string | null)` returns `DEFAULT_SCOPE` (`'web3-incidents'`) for a missing or unknown value and `'all'` for `'all'`.
- **Section B, `articleRow.ts`.** `NEWS_ARTICLE_COLUMNS` includes `created_at` and `mapNewsArticleRow` sets `NewsArticle.createdAt`. C1 Step 1 checks this and gives a fallback edit for the hook. Without it, "Added" and "First reported on Digibastion" fall back to `published_at`. For QuillMonitor that is midnight UTC on the incident date, which is wrong.
- `SEVERITY_STYLES`, `isPublishable` and `mapNewsArticleRow` are not used here. The card keeps its local severity colours because the shape of `SEVERITY_STYLES` was not specified. Alert fetching stays in `News.tsx`, so the alerts mapping is whatever B leaves there.

**Overlaps and merge order**

- `src/pages/News.tsx` is edited by C1 (conditional), C3, C4, C5 and C6, and probably by B (local `NEWS_CATEGORIES` / `parseListParam`, row mapping). C4 5a and C6 5a say what to add and remove if B has already changed the import block. Merge B before C.
- `SubscriptionForm.tsx` gets new props (C3) and loses the subscriber badge (C6). Section D will probably rebuild this form for the three delivery checkboxes in spec 8.6. D should keep the `initialCategories` / `initialScope` props.
- `src/data/newsData.ts`: C6 deletes the mock exports. If B moved `newsCategoryConfig` into `taxonomy.ts`, apply C6 Step 7 to whatever is left.
- Homepage alerts (`Index.tsx:78-83`) still query without the `classification_relevant` filter. Spec 5.4 puts that on the shared row module (B). If B does not touch `Index.tsx`, add `.or(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER)` to that query.

**Deliberate deviations from the brief**

- `FeedToolbar` is created in C4, not extracted in C6, because the mobile sheet rewrites that markup anyway. C6 only extracts `AlertsPanel`.
- Stat tiles: only "Total" says "in this view". Critical, High and Supply chain are counted from the 20 loaded items (`useNewsArticles.ts:530-535`), so they say "on this page" until the `threat_intel_stats` RPC (spec 7.2) exists. Labelling page counts "in this view" would be false.
- The status history says "First reported on Digibastion", not "First reported". `created_at` is when we stored the record, not when the incident was first reported anywhere.
- Cards no longer show the words "Powered by QuillMonitor". The source line says "Source: QuillMonitor" and links `reference_url` when present. The incident page logo block and the alerts panel keep "Powered by QuillMonitor". **Check the QuillMonitor partner attribution terms before shipping C2**; if the exact wording is required on cards, change the label in `getSources` (C1) or add the line back to `NewsCard`.

**Risks**

- Changing the default scope to Web3 incidents changes what existing `/threat-intel` links without `?scope=` show, and the feed cache key (spec 7.6 bug) may briefly serve the old scope from localStorage.
- The verification tooltip does not open on touch devices (Radix Tooltip). The explanation is still read by screen readers, and the methodology page covers it. A Popover would fix this if design wants it.
- "Exploited Sep 30, 2026" reads oddly for phishing or supply-chain incidents. "Incident date Sep 30, 2026" would be neutral, and changing it is one string in C1.
- `News.hero.test.tsx` opens a Radix Dialog in jsdom. If that proves flaky in CI, keep the `Filters (3)` trigger assertion and drop the sheet assertion.
- **Methodology copy that must match reality before C5 ships:**
  - The duplicate rules (±2 days, 10%, shared reference link, provider priority) are taken from spec 5.1 and must match what A implements.
  - The RSS list is the 2025 seed and includes Naked Security, which Sophos stopped publishing in 2023. Compare it with `select name from rss_feeds where is_active` in production and update the sentence.
  - The 2026 Chainalysis, TRM Labs, Immunefi and ScamSniffer URLs came from the request. Open each one before publishing.
  - The corrections paragraph promises to pass errors on to the source; confirm someone owns `support@digibastion.com` for that.
  - SlowMist is shown as "Pending permission", but SlowMist records still render in the feed. Decide whether to hide them until permission arrives; this section does not.

**Spec items not covered here**

- 7.1: splitting `News.tsx` into route pages under `src/pages/threat-intel/`, React Query hooks, the `/threat-intel/subscribe` route and `?tab=subscribe` redirect. Existing routes were kept as instructed.
- 7.2: the `threat_intel_stats` RPC, severity sort across the whole result, and the verification, chain, attack-type and source filters. Search is not yet debounced (300 ms).
- 7.3: alerts that follow the selected view and filters, and alert pagination.
- 7.5: per-incident meta tags and link previews (deferred), and pointing `sitemap-index.xml` at the dynamic `generate-sitemap` function.
- 7.6: realtime channels recreated on every filter change, and the scope-carrying cache key.
- Leftover "preliminary" wording outside these files: the `RealtimeAlertListener` toast ("Preliminary incident"), `EmailPreview` ("· Preliminary"), and the `ContentScopeSelector` description ("Verified and preliminary").
- `Index.tsx` changes in C6 have no automated test; they are checked by typecheck, lint and the manual step.

<!-- C7 -->

---

### Task R1: Lovable release doc

**Files:**
- Create: `docs/LOVABLE_THREAT_INTEL_REVAMP_RELEASE.md`

**Interfaces:**
- Consumes: the function names from A3–A8 (`fetch-web3-incidents`, `fetch-quillmonitor-incidents`, `fetch-slowmist-incidents`, `summarize-article`, `fetch-rss-news`, `dedupe-incidents`), B1's edited functions (`submit-form`, `update-subscription`), the migrations `20261011090000_threat_intel_stats.sql` (B3) and `20261012090000_threat_intel_incident_filters.sql` (C7), B3's sanity SQL and C7's sanity SQL.
- Produces: the doc the user pastes into Lovable, one stage at a time.

- [ ] **Step 1: Write the doc**

Create `docs/LOVABLE_THREAT_INTEL_REVAMP_RELEASE.md`. Copy B3's sanity SQL block (B3 Step 5, "Sanity check for the deployer") into Stage 2 and C7's sanity SQL block into Stage 2 after it, verbatim. Everything else is below:

````markdown
# Lovable Threat Intel revamp release (Phase 0 + Phase 2)

Ships one record per incident with correct amounts, dates and sources
(Phase 0), then the new Threat Intel page: Web3 incidents by default,
whole-result stats and severity sort, incident filters, rebuilt cards and
incident page, and a methodology page (Phase 2).

No new secrets. Run the stages in order. Stage 2 must finish before Stage 4,
because the new page calls RPC arguments that only exist after the
migrations.

## Stage 1: backend data fixes (Phase 0)

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub
main commit <EXACT_SHA>. Do not rewrite application source, create another
backend, or print any secret value. Do not apply any migration in this stage.

1. Deploy the repository versions of these edge functions with their shared
   imports under supabase/functions/_shared/: fetch-web3-incidents,
   fetch-quillmonitor-incidents, fetch-slowmist-incidents, summarize-article,
   fetch-rss-news, and the new dedupe-incidents. Confirm dedupe-incidents has
   platform JWT verification disabled as declared in supabase/config.toml; the
   function itself requires CRON_SECRET, the service-role key, or an admin.
2. Invoke dedupe-incidents with an authorized POST body
   {"dryRun":true,"days":90} and return the full JSON response.
3. Return the deployed Git revision and the response. Do not run it with
   dryRun false yet.
```

Review the dry-run samples yourself. They should pair the NEAR Intents
reports and the Meter reports, must not pair Limit Break with Magic Eden,
and must contain no pair that is two different incidents. Then:

```text
Invoke dedupe-incidents with an authorized POST body {"dryRun":false,"days":90}
and return the JSON response. Then invoke it again with {"dryRun":true,"days":90}
and return that response too. The second response must show
duplicatesToMark 0 and canonicalSourceUpdates 0. Then show the last 20 log
lines of fetch-quillmonitor-incidents and summarize-article after their next
scheduled run, and confirm neither logged a PostgREST filter parse error.
```

If the write run returns HTTP 207 with `writeErrors`, run it again; rows that
are already correct are skipped.

### Optional: clear impossible loss figures on old rows

The old web3-incidents importer stored "$3,800,000" as 3.8 trillion USD. The
new page already hides any figure above $100B, so this is cleanup only.

```sql
-- Preview
SELECT id, title, metadata->'amount_lost_usd' AS amount, metadata->>'amount_display' AS display
FROM public.news_articles
WHERE metadata->>'provider' IN ('web3-incidents', 'web3')
  AND jsonb_typeof(metadata->'amount_lost_usd') = 'number'
  AND (metadata->'amount_lost_usd')::numeric > 100000000000;

-- Repair: remove the wrong figures, keep a marker
UPDATE public.news_articles
SET metadata = (metadata - 'amount_lost_usd' - 'amount_display')
  || jsonb_build_object('amount_cleared_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
WHERE metadata->>'provider' IN ('web3-incidents', 'web3')
  AND jsonb_typeof(metadata->'amount_lost_usd') = 'number'
  AND (metadata->'amount_lost_usd')::numeric > 100000000000;
```

## Stage 2: database functions

```text
Use View Backend for the existing managed Lovable Cloud project and use GitHub
main commit <EXACT_SHA>. Do not rewrite application source or print any
secret value.

1. Apply, in this order and only these:
   supabase/migrations/20261011090000_threat_intel_stats.sql
   supabase/migrations/20261012090000_threat_intel_incident_filters.sql
2. Run NOTIFY pgrst, 'reload schema';
3. Run the sanity SQL below in the SQL editor and return every result.
4. Return the migration state.
```

<B3 sanity SQL, verbatim>

<C7 sanity SQL, verbatim>

Every check must match its "Expect" comment before Stage 3.

## Stage 3: subscription functions

```text
Deploy the repository versions of submit-form and update-subscription from
GitHub main commit <EXACT_SHA> with their shared imports
(supabase/functions/_shared/news-categories.ts). Return the deployed revision.
```

## Stage 4: publish the frontend

Publish from Lovable. Then check the live site, logged out, on a phone-width
window (390px) and on desktop:

- `/threat-intel` opens the Web3 incidents view; `?scope=all` shows all
  security news.
- The first page has one card each for NEAR Intents and Meter, not two or three.
- Stat tiles say "in this view".
- A QuillMonitor-only card says "Powered by QuillMonitor"; every card names a
  source.
- "Filters (n)" opens the filter sheet on mobile; the status, chain, attack
  type and source filters change the list and the URL.
- An incident page shows the status history and the "What should I do?" block.
- `/threat-intel/methodology` loads and is in `/sitemap.xml`.

## Rollback

Frontend: republish the previous version in Lovable.

Database (only if Stage 2 must be undone, and after rolling back the frontend):
re-run the `search_news_articles` and `count_news_articles` definitions from
`supabase/migrations/20260927180000_add_subscription_content_scope.sql`, then
drop the new signatures listed in the rollback comments at the end of both
new migration files, then `NOTIFY pgrst, 'reload schema';`.

Phase 0 functions: redeploy the previous commit. Duplicate marks written by
`dedupe-incidents` are metadata keys; they can stay, since the old page
ignores them.
````

- [ ] **Step 2: Check the doc against the code**

Run: `rtk proxy grep -n "dedupe-incidents\|20261011090000\|20261012090000" docs/LOVABLE_THREAT_INTEL_REVAMP_RELEASE.md supabase/config.toml && ls supabase/migrations/20261011090000_threat_intel_stats.sql supabase/migrations/20261012090000_threat_intel_incident_filters.sql supabase/functions/dedupe-incidents/index.ts`

Expected: the config has `[functions.dedupe-incidents]`, both migrations and the function exist, and no `<B3 sanity SQL` or `<C7 sanity SQL` marker is left in the doc (`rtk proxy grep -c "sanity SQL, verbatim" docs/LOVABLE_THREAT_INTEL_REVAMP_RELEASE.md` prints `0`).

- [ ] **Step 3: Commit**

```bash
git add docs/LOVABLE_THREAT_INTEL_REVAMP_RELEASE.md
git commit -m "docs: add Lovable release steps for the threat intel revamp"
```

---

## Not in this plan

- **Route split and React Query (spec 7.1).** `News.tsx` keeps its routes; the hooks keep `useState`/`useEffect`. A later plan can split pages under `src/pages/threat-intel/` once this ships.
- **Link previews and per-incident meta tags (spec 7.5).** Needs a Cloudflare Worker or a hosting change (open decision). Telegram previews stay off.
- **Newsletters, email duplicate exclusion and the email category lists (Phase 3).** `threat-intel-api`, `send-critical-alerts` and the digest functions still need the duplicate filter and the shared category module; the newsletter plan owns them.
- **Limit Break / Magic Eden merge.** The matcher needs an exact project name; a manual alias mechanism is a follow-up.
- **10% loss tolerance in dedup.** A5 matches exact amounts (the SlowMist rule). Loosen it only if the Stage 1 dry run shows misses.
