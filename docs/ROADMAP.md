# Digibastion roadmap

Last reviewed: 2026-10-11

This roadmap is about outcomes for the people who use Digibastion, not a wish
list of features. Something is **shipped** when it is in the repository with a
public route or a documented way to run it. It is **validated** when its
production behavior has been checked by someone with the access to check it.

Completed work, with dates, is in
[`IMPLEMENTATION_HISTORY.md`](IMPLEMENTATION_HISTORY.md). The working plans in
`docs/superpowers/` are history, not this roadmap. The file `roadmap.md` at the
repo root is Lovable's own task log.

## Shipped

| Outcome | Evidence | Validation |
| --- | --- | --- |
| People can assess and improve their own security | 11 checklists with 263 items; `/quiz` (eight questions from 20 scenarios), `/category/:categoryId`, `/share`, `/leaderboard` | Public routes checked; usage data needs owner access |
| People can follow Web3 incidents | `/threat-intel` with QuillMonitor every 30 minutes, Web3 Is Going Just Great every 6 hours and RSS news hourly | Public feed checked; schedules and source health need **View Backend** |
| Each incident appears once, with honest severity | One duplicate matcher for every importer, `dedupe-incidents`, one severity rubric, legacy amounts repaired | In production; the history cleanup ran after a reviewed dry run |
| People can see how the feed works | `/threat-intel/methodology`, `/faq` | Live |
| People can find incidents quickly | Whole-result stats, filters for status, chain, attack type and source, severity sort, rebuilt incident pages | Live |
| People get told about incidents | Email alerts for critical and high incidents every 30 minutes; Telegram `@digibastion` for new QuillMonitor incidents | Live; Telegram settings and send health need owner access |
| People get a weekly summary | `/threat-intel/weekly/<YYYY-MM-DD>` every Monday, with a Telegram link post | Released with Phase 3; each issue depends on the Monday job running |
| People can get a daily or weekly email | Daily brief and weekly email, built with one-click unsubscribe, suppressions and a consent audit | **Built, not sending.** Waits for `NEWSLETTER_POSTAL_ADDRESS` |
| Search and answer engines can find every incident and guide | Dynamic and news sitemaps in `robots.txt`, IndexNow every 30 minutes, RSS/Atom/JSON feeds, per-page HTML at build time, `llms.txt` and `llms-full.txt`, share bar and preview cards | Built on branch `seo-aeo-docs`; validated by [`LOVABLE_SEO_RELEASE.md`](LOVABLE_SEO_RELEASE.md) after release |
| People can learn by topic | 71 guides, a tools directory with 27 entries, a links directory | 52 older guides got a source-backed rewrite; reviews continue |
| Teams can ask for expert help | `/services`, `/services/opsec-consulting`, `/services/full-stack-review`, `/contact` | Public routes checked |
| Teams can check a domain's trust setup | [Vantage](https://vantage.digibastion.com/) (beta) | Public pages checked 2026-09-27; signed-in features not tested |
| Operators can run the platform | `/admin/analytics`, `/admin/cron`, `/admin/api-keys`, ingestion health | Needs **View Backend** |

**SlowMist Hacked** is built (`fetch-slowmist-incidents`) and switched off. It
stays off, with no cron job, until SlowMist gives written permission to reuse
its data.

## Now

### 1. Launch the newsletters

- Read and approve a privacy page that says what the site collects, before any
  newsletter goes out.
- `send-newsletters` now covers everything the legacy digest sends ("more
  updates", quiet-day brief, each subscriber's weekly day, a parity test).
  Before the switch, `send-newsletters {"parity": true}` must report
  `ready_for_cutover: true`, which needs a daily issue built by the new
  builder. (The first attempt, on 11 October 2026, left high-threshold
  subscribers with no email and was rolled back.)
- Then set `NEWSLETTER_POSTAL_ADDRESS` in Lovable Cloud. That starts the daily brief
  and weekly email and makes the legacy digest stand down by itself.
- Set `NEWSLETTERS_LIVE = true` in `src/seo/siteFacts.ts` in the same change, so
  the site copy stops saying "starting soon".
- After a clean week, retire `send-digest-emails` and its four cron jobs.

Success: subscribers who chose daily or weekly get one email at their local
time, with a working one-click unsubscribe, and nobody gets a legacy digest too.

### 2. Release and confirm the SEO work

- Run [`LOVABLE_SEO_RELEASE.md`](LOVABLE_SEO_RELEASE.md): two migrations, the
  new and changed functions, then Publish.
- Find out whether Lovable serves the per-page HTML files (the canary check).
  If it does not, decide whether to move DNS to Cloudflare for the Worker in
  `edge/cloudflare-worker/`.
- Submit `sitemap-index.xml` in Google Search Console and Bing Webmaster Tools
  (the two function sitemaps are found through `robots.txt` and cannot be
  submitted there), run the one-time IndexNow backfill, and watch coverage for
  a month.
- Make the apex redirect (`digibastion.com` to `www`) a 301 instead of a 302.

Success: a sample incident, weekly report and guide each show their own title in
the raw HTML and in a Telegram or X preview, Search Console shows the sample
incident URLs as indexed or discovered, and Bing's IndexNow report shows the
backfill as received.

### 3. Security headers

Production sends no Content-Security-Policy, X-Frame-Options or
Permissions-Policy, because those live in `vercel.json` and Lovable does not
apply it. Either Lovable adds header support or DNS moves to Cloudflare and the
Worker sends them. See the status note in
[`security/2026-09-27-source-review.md`](security/2026-09-27-source-review.md).

Success: `curl -I https://www.digibastion.com/` shows a CSP (report-only first)
and an anti-framing header.

### 4. Know where visitors come from

Nothing in production reads UTM tags today: `@vercel/analytics` only loads on
`*.vercel.app`. Pick a privacy-respecting analytics tool that reads UTM tags on
any host (for example Plausible, Umami or Cloudflare Web Analytics), or confirm
that Lovable's analytics reports them.

Success: Telegram, email and share-bar visits show up as separate sources.

### 5. Editorial integrity

- Finish the source-by-source review of the remaining older guides, and keep all
  71 accurate: primary citations, author and reviewer, review date, and claims
  that have aged out.
- Change a year in a title only when the body has actually been reviewed.
- Write incident analysis from a fixed brief: timeline, affected systems,
  confirmed impact, attack path, detection, mitigations, primary sources, what
  is still unknown, and lessons mapped to checklist items or Vantage checks.
- Keep feed records and editorial guides separate. A feed summary is never an
  incident report.

Success: every indexed guide has original content, visible sources, an owner,
a review date and a next step.

## Next

### 6. Clearer paths through the site

- Let a visitor pick a goal and get a short plan built from the self-check, the
  checklists, the guides and the tools, with no account.
- Add "why this matters", effort and "how to check it worked" to the
  highest-priority checklist items.
- Link team-level controls to the matching Vantage check or service.
- Treat keyboard, screen-reader, reduced-motion, slow-network and small-screen
  behavior as release requirements.

### 7. Services with clear boundaries

- For each service: who it is for, what you get, what is out of scope, the
  steps, and a sample output.
- Case studies only with client permission and real outcomes.
- One intake form that can be tracked and respects privacy.

### 8. Contributions

- Label issues by size, skill and whether security review is needed.
- Publish small briefs for content fixes, source checks, accessibility, mobile
  testing, tests and new checklist items.
- Credit merged work accurately, without promising rewards or response times.

## Later, only if evidence supports it

- More incident sources, each with permission and a clear license.
- A stable public API beyond the current key-gated partner endpoint
  (`threat-intel-api`).
- Organization accounts and shared remediation plans.
- Vantage monitoring, integrations and exports beyond the beta.
- Translations, once terminology and review owners are in place.
- Browser or mobile apps, only if research shows the website cannot solve the
  problem.

## Not committed

The older roadmap listed AI source-code analysis, instant supply-chain
monitoring, a browser extension, a native mobile app and broad CI/CD scanning
against dates that have passed. None of them is a current commitment. Any can
come back as a scoped proposal with an owner, a threat model, data sources,
running costs, a maintenance plan and a measurable need.

## Decisions only the owner can make

1. The long-term license: keep Commons Clause or move to a standard open-source
   license.
2. Which Vantage features are generally available, beta or invitation-only.
3. Whether Web3 Is Going Just Great's request that its work not be used "in any
   other crypto projects" covers Digibastion, and whether to ask its author
   directly (see [`THREAT_INTEL_FEEDS.md`](../THREAT_INTEL_FEEDS.md)).
4. Whether to move DNS from GoDaddy to Cloudflare for the Worker.
5. Access for production checks: the Lovable project (hosting and **View
   Backend**), GoDaddy DNS, Search Console, Bing Webmaster Tools, analytics and
   the email provider.
6. Named editorial and technical reviewers for security guidance and incident
   coverage.

To propose or take on an outcome, read [`CONTRIBUTING.md`](../CONTRIBUTING.md)
and open a focused issue with evidence, scope and how you will check it. Report
vulnerabilities privately through [`SECURITY.md`](../SECURITY.md).
