# Threat Intel sources

Last reviewed: 2026-10-11

The public feed is at [`/threat-intel`](https://www.digibastion.com/threat-intel),
and the old `/news` route redirects there. The reader-facing version of this
document is the [methodology page](https://www.digibastion.com/threat-intel/methodology).
This file is for contributors: it names every source, its terms and schedule,
and the rules the code applies to what comes in.

Whether a source is healthy right now is a runtime fact, not something a file
can promise. Check it in `/admin/cron`, in the admin health panel, or through
**View Backend** in Lovable.

## Sources

### QuillMonitor

- **What:** QuillAudits' database of Web3 hacks and exploits, read through its
  partner API.
- **How:** `fetch-quillmonitor-incidents`, at :17 and :47 every hour (UTC). Each
  run asks for incidents changed since a stored cursor
  (`app_config.QUILLMONITOR_SYNC_SINCE`), so a status change on an old incident
  is picked up too. Credential: `QUILLMONITOR_API_KEY`.
- **Status:** each incident is `verified` or `unverified`, shown on the site as
  Confirmed or Unconfirmed. Unverified incidents are included.
- **Attribution:** every QuillMonitor record links its source, and a record
  whose only source is QuillMonitor shows "Powered by QuillMonitor" with a link
  to the [QuillMonitor database](https://www.quillaudits.com/web3-hacks-database).
  Keep that line wherever such a record appears: cards, the incident page,
  emails and Telegram posts.

### Web3 Is Going Just Great

- **What:** [Molly White's timeline](https://www.web3isgoinggreat.com/) of
  crypto hacks, scams and failures.
- **How:** `fetch-web3-incidents` scrapes the home page through Firecrawl at
  00:30, 06:30, 12:30 and 18:30 UTC. Credential: `FIRECRAWL_API_KEY`. The site
  has no verification status, so these records carry no Confirmed or
  Unconfirmed label.
- **Terms:** the site's [attribution page](https://www.web3isgoinggreat.com/attribution)
  says, as of 2026-10-11: "Text is licensed under the Creative Commons
  Attribution 3.0 Unported License" and "Feel free to reuse posts on this site
  under those terms." It also says: "under no circumstance do I wish for my
  work to be used in NFTs, or in any other crypto projects." Every record links
  back to the original entry and names the site. Whether a Web3 security site
  counts as a "crypto project" under that request is for the owner to decide;
  see [docs/ROADMAP.md](docs/ROADMAP.md).

### Security news (RSS)

- **What:** RSS feeds from security publishers, listed in the `rss_feeds`
  table. The methodology page names The Hacker News, BleepingComputer,
  SecurityWeek, CISA Alerts, Dark Reading and Krebs on Security among them.
- **How:** `fetch-rss-news` at :15 every hour. A classifier
  (`_shared/rss-classifier.ts`) files each item by topic and severity and marks
  items about something else as not relevant. No credential.
- **On the site:** these records are relays: a title, a short excerpt and a
  link to the publisher's article. Their pages are readable but carry
  `noindex, follow`, and they stay out of the sitemaps, feeds and IndexNow
  pings, because the original article is the page that deserves to rank.

### SlowMist Hacked (built, switched off)

`fetch-slowmist-incidents` can read the latest entries from SlowMist Hacked
(`hacked.slowmist.io`). It stores only normalized facts: the target, date,
reported loss, attack method and reference link, never SlowMist's text or
images. It has no schedule, and it returns a permission notice unless
`SLOWMIST_INGESTION_ENABLED=true`. That flag waits on written reuse permission
from SlowMist. Until then, do not describe SlowMist as a live source anywhere.

### AI summaries

`summarize-article` runs at 00:45, 06:45, 12:45 and 18:45 UTC. Each run
summarizes up to 20 records not yet processed, plus up to five Web3 incidents
from the last 14 days that still have no summary. It uses the Lovable AI gateway
(`LOVABLE_API_KEY`) with `google/gemini-2.5-flash-lite`. These summaries are
labelled "AI summary" on cards and in Telegram posts. The weekly report can also
use an AI pass (`WEEKLY_AI_ENABLED`); a validator rejects any name, number or
claim in its output that is not in the week's data.

## What happens to a record

Every importer writes into `news_articles`. Source-specific fields go into
`news_articles.metadata`, so the public schema does not change when a source is
added. Each run also writes one summary row to `threat_intel_ingestion_runs`:
counts, timing and a short error message, never the raw payload or a
credential.

### Topic and scope

- `category` is the record's most specific topic.
- `metadata.security_domain = "web3"` puts a record under Web3 Security even
  when its category is DeFi, supply chain or a vulnerability disclosure.
- `metadata.is_web3_incident = true` marks a Web3 incident, unconfirmed ones
  included. The feed's default view, "Web3 Incidents", shows only these; "All
  Intelligence" adds the security news. Subscriptions use the same two scopes
  (`content_scope` of `web3-incidents` or `all`).
- `metadata.classification_relevant = false` hides a rejected RSS record from
  the feed and from email but keeps it for audit. `taxonomy_version` and
  `classification_reasons` record why.

`fetch-rss-news` has a `reclassify` mode for re-filing history after a
classifier change. It is bounded, runs as a dry run unless `dryRun` is `false`,
and never sends email. Review a full dry run before applying one.

### Severity

One rubric for every incident importer
(`supabase/functions/_shared/incident-severity.ts`):

| Rule | Severity |
| --- | --- |
| Reported loss of $50M or more | critical |
| Reported loss of $10M or more | high |
| Attack method is private-key compromise, access control, oracle manipulation, reentrancy or flash loan, even with no disclosed loss | high |
| Any other disclosed loss above $0 | medium |
| Everything else | low |

RSS items keep the classifier's severity, which can also be `info`. Losses are
written as "about $X" or "~$X reported", because the figure is the source's
estimate.

### One record per incident

`supabase/functions/_shared/incident-dedup.ts` decides when two records describe
the same incident. Every importer runs it on write; `dedupe-incidents` runs it
over history when an admin asks, as a dry run by default.

1. Records from different sources match when the normalized project name is the
   same and either the incident date is the same, or the dates are within two
   days and one more fact matches: the same positive loss, the same attack
   method or the same reference link. A loss of zero is not evidence.
2. Records with different names match only on an identical dated social-post
   reference, the same incident date and the same positive loss.
3. Two QuillMonitor records merge only on the same name, date and loss. The
   verified one survives, then the one with the smaller `uid`.
4. When sources compete, QuillMonitor's record survives, then Web3 Is Going
   Just Great, then SlowMist.
5. The losing record is kept, gets `metadata.duplicate_of_uid`, and adds its
   link to the survivor's `metadata.sources`. Its URL redirects to the survivor.

There is no fuzzy name matching. A wrong merge hides a real incident, which is
worse than showing the same incident twice.

### Status changes

When QuillMonitor confirms, revises or retracts an incident, the importer logs
it in `incident_status_events`. The Telegram post is edited in place, and email
subscribers who got the alert receive a follow-up for a retraction or an
upgrade to critical. Subscribers can turn off unconfirmed incidents with
`include_preliminary` (on by default).

### Attribution rules

- Name the source on every incident, on every surface. If the source is
  unknown, say "Source not given"; never fill in Digibastion.
- Never write that Digibastion verified an incident. Status words come only from
  the source: confirmed, unconfirmed.
- Keep "Powered by QuillMonitor" on every record whose only source is
  QuillMonitor.
- Link the original report. Links to sources never carry UTM tags.

## Where records go

| Channel | What goes out | When |
| --- | --- | --- |
| The feed and incident pages | Every publishable record | As soon as it is stored |
| Telegram `@digibastion` | New QuillMonitor Web3 incidents, and the weekly report link on Mondays | :20 and :50; Mondays 01:00 UTC |
| Email alerts | Critical and high records that match a subscriber's filters | Checked at :25 and :55 |
| Daily brief and weekly email | The day's or week's incidents | Built daily at 00:05 and Mondays at 00:10 UTC; sending waits for `NEWSLETTER_POSTAL_ADDRESS` |
| Weekly report page | The week's incidents, at `/threat-intel/weekly/<YYYY-MM-DD>` | Mondays from 00:10 UTC |
| Sitemaps, feeds and IndexNow | Web3 incidents and weekly reports only | IndexNow at :22 and :52 |

[docs/SEO_AND_DISTRIBUTION.md](docs/SEO_AND_DISTRIBUTION.md) covers the
sitemaps, feeds and IndexNow, and
[docs/PRODUCT_AND_ARCHITECTURE.md](docs/PRODUCT_AND_ARCHITECTURE.md) covers
delivery in full.

## Proposing a source

Open a GitHub issue with:

1. The source's name, owner, homepage and machine-readable endpoint.
2. The gap it fills in the current feed.
3. How often it publishes, what it covers and how many records to expect.
4. Stable identifiers, and how its records would match ones we already have.
5. Its license, attribution and reuse terms, quoted from the source.
6. Authentication, rate limits, timeouts and running cost.
7. A few sample records with anything sensitive removed.
8. The category, severity and incident fields you would map, and what should
   happen when it fails.

Primary advisories, public incident disclosures and reputable sources with
stable structured output are the best fit. Paywalled material, sources used
without permission, marketing feeds dressed as news, and anything that cannot
be attributed are not.

## Building a new importer

A new importer must:

- keep its credential on the server, in Lovable Cloud secrets;
- run as its own function, so it cannot block the others;
- validate the response shape, URLs, dates, pages and numbers;
- cap pages, concurrency, response size and run time;
- build a stable `uid` and run the shared duplicate matcher;
- use the shared severity rubric;
- store only normalized public content and the agreed metadata;
- write one `threat_intel_ingestion_runs` row per run, with no payloads or
  secrets;
- authenticate callers with a timing-safe `CRON_SECRET` compare, the
  service-role key or an admin token (copy `authorize()` from
  `supabase/functions/send-newsletters/index.ts`);
- have tests for bad input, timeouts, duplicates, partial failure and refused
  authorization;
- state the attribution the source requires.

Merging the code does not switch a source on. That also takes the credential in
Lovable Cloud, a deployed function, a cron migration and a healthy first run,
checked by the owner.
