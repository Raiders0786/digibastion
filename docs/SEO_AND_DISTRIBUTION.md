# SEO and distribution

Last reviewed: 2026-10-11

This is how a new incident or weekly report gets found: by Google and Bing, by
AI answer engines, by feed readers, and through the links we send out on
Telegram, by email and from share buttons. Each section says what the code
does, what it does not do, and how to check it with `curl`.

The site's canonical address is `https://www.digibastion.com` plus a path, with
no query string, no fragment and no trailing slash (except `/` itself). Every
canonical tag, sitemap entry, feed entry id, JSON-LD URL and IndexNow submission
uses that form. UTM tags never appear in any of them.

## What gets indexed

| Page | Indexed | Why |
| --- | --- | --- |
| Static pages: home, Threat Intel, methodology, FAQ, guides, checklists, tools, services | Yes | Our own content |
| Web3 incident pages, `/threat-intel/<id>` | Yes | One record per incident, with its source named and linked |
| Weekly reports, `/threat-intel/weekly/<YYYY-MM-DD>`, and the archive | Yes | Our own summary of the week |
| Security-news records from RSS | No: `noindex, follow` | They relay another site's article (a title, a short excerpt and a link). The original deserves to rank, and thousands of near-empty pages would hurt the site. Readers and email links still reach them. |
| Merged records (`duplicate_of_uid` set) and records the classifier rejected | No; never listed | They redirect to, or are replaced by, another record |
| Admin, subscription, quiz-result and test pages | No; disallowed in `robots.txt` | Private or personal |

One rule decides "indexable incident" everywhere:
`INDEXABLE_INCIDENT_POSTGREST_FILTER` and `isIndexableIncidentMetadata` in
`supabase/functions/_shared/publishable.ts`. The sitemap, the feeds, IndexNow,
the prerender and the preview images all use it, and
`src/utils/__tests__/publishableParity.test.ts` keeps it identical to the rule
the app uses.

## From a new incident to search engines

1. An importer stores the incident in `news_articles` (QuillMonitor at :17 and
   :47 UTC).
2. The incident page works at once. Google runs JavaScript, so it can read the
   page's own title and description after rendering. Crawlers that do not run
   JavaScript see the fallback page until the next Publish writes a static
   copy (see [Per-page HTML](#per-page-html-at-build-time)).
3. At :22 and :52, `ping-indexnow` sends the new URL to IndexNow, which shares
   it with Bing, Yandex, Seznam, Naver and Yep.
4. The dynamic sitemap lists the incident on its next fetch (cached for up to an
   hour), and the Google News sitemap lists it for 48 hours.
5. The RSS, Atom and JSON feeds include it on their next fetch (cached for up to
   15 minutes).
6. Telegram and email links point readers at the incident page with UTM tags,
   and the page's share buttons do the same.

### What Google offers, and what it does not

Google has no "ping" for ordinary pages. The sitemap ping endpoint was retired
in 2023, and the Indexing API only accepts job postings and livestream events.
Neither is built here, on purpose. Google learns about new pages from sitemaps
(`sitemap-index.xml`, submitted in Search Console, and the two function
sitemaps, which Google finds through `robots.txt`) and from links. IndexNow is the fast path for every engine that supports it; Bing
is the largest, and its index also feeds Microsoft Copilot.

## Sitemaps

| URL | What it lists | Made by |
| --- | --- | --- |
| `https://www.digibastion.com/sitemap-index.xml` | Points to `sitemap.xml` | `npm run seo:generate` |
| `https://www.digibastion.com/sitemap.xml` | Every static page, checklist and guide (101 URLs on 2026-10-11) | `npm run seo:generate` |
| `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap?part=dynamic` | Every indexable incident and weekly report, 45,000 per page (`&page=N`) | `generate-sitemap` |
| `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap?part=news` | Google News sitemap: incidents stored in the last 48 hours, at most 1,000 | `generate-sitemap` |

`public/robots.txt` lists `sitemap-index.xml` (which points to `sitemap.xml`)
and the two function sitemaps on `Sitemap:` lines. A sitemap on another host is
accepted for this site only when this site's `robots.txt` lists it, which is
why the function URLs are there.

Search Console's Sitemaps report only accepts sitemap URLs inside the verified
property, and the function host cannot be verified. Submit
`sitemap-index.xml` there and nothing else. Google reads the function sitemaps
through `robots.txt`, but they never show in that report; check them with URL
Inspection on a few incident URLs and in the Pages report instead.

**lastmod.** An incident's `lastmod` is the latest of three dates: when we
stored it (`created_at`), when the source last changed it
(`metadata.provider_updated_at`), and its newest logged status change in
`incident_status_events`, capped at today. It never uses `updated_at`, because
every QuillMonitor sync rewrites that column and it would make every page look
changed every 30 minutes. A weekly report's `lastmod` is when it was built.

**Content type.** On GET, the Supabase gateway rewrites XML and HTML responses
to `text/plain` and adds `content-security-policy: default-src 'none'; sandbox`.
JSON and PNG pass through, and a HEAD request shows the type the function set.
Google normally reads a sitemap whatever its content type. If URL Inspection
or the Pages report ever shows Google failing to fetch the XML sitemap, list
`generate-sitemap?part=dynamic&format=txt` in `robots.txt` instead: the same
URLs, one per line, which is a sitemap format Google accepts.

## Feeds

| Format | URL |
| --- | --- |
| RSS 2.0 | `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=rss` |
| Atom 1.0 | `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=atom` |
| JSON Feed 1.1 | `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=json` |

Each feed holds the 50 newest Web3 incidents and the 10 newest weekly reports.
Add `&type=incidents` or `&type=weekly` for one kind only. Every item names its
source, and QuillMonitor-only items say "Powered by QuillMonitor". `index.html`
advertises all three with `<link rel="alternate">` tags. The same gateway
caveat applies: the RSS and Atom feeds arrive as `text/plain`, which some feed
readers refuse. The JSON feed is not affected.

## IndexNow

- **Key file:** `public/5d9d2e41356f5953eedc2e72bca99b7b.txt`, served at
  `https://www.digibastion.com/5d9d2e41356f5953eedc2e72bca99b7b.txt`. The key is
  public by design: IndexNow checks that the site serves it. To rotate it, add
  the new `public/<key>.txt`, publish, then set the `INDEXNOW_KEY` secret.
- **Schedule:** cron job `ping-indexnow` at :22 and :52 UTC, five minutes after
  each QuillMonitor sync.
- **What it sends:** new weekly reports, then incidents stored since the last
  successful run, then incidents with a logged status change, then
  `/threat-intel` and `/threat-intel/weekly` when anything above changed.
  Incidents and status changes go in the order they happened. At most 1,000
  URLs a run, and nothing when nothing is new.
- **Cursor:** where the next run starts is stored in
  `threat_intel_ingestion_runs.metadata.cursor` of the last successful run
  (pipeline `indexnow`). The first run looks back two hours, and no run looks
  back more than seven days. When a run has more than fits, the cursor stops
  just before the first incident it left out, so nothing between the old and
  new cursor is skipped. A failed submission (including a 403 for a bad key or
  a 429 rate limit) leaves the cursor where it was, so the next run sends the
  same URLs again. A dry run records nothing.
- **HTTP status:** IndexNow throttling and outages (429, 5xx, timeouts,
  network errors) answer 200 with `"success":false`, because the next run
  retries them and a non-2xx answer would count as a failed cron run in
  `/admin/cron`. A bad key (403), a bad request (400 or 422) or an unexpected
  answer return 502, because a person has to fix them.
- **Other modes:** an admin or the service role can POST
  `{"mode":"urls","urls":[...]}` to submit specific URLs on our host, or
  `{"mode":"backfill"}` to submit every indexable incident and weekly report
  once. Add `"dryRun":true` to see the count and a sample without sending.

## Per-page HTML at build time

Lovable answers every path it has no file for with the same `index.html`.
Without help, link previews and crawlers that do not run JavaScript (GPTBot,
ClaudeBot, PerplexityBot and most other AI crawlers) would see the homepage
for every URL.

So `vite build` runs a prerender step (`scripts/seo/prerenderPlugin.ts`) that
writes one HTML file per public page into `dist/`, each with its own title,
description, canonical, Open Graph and X tags, JSON-LD and a plain-text version
of the page's main content. It covers:

- every static page in the route registry (`src/seo/routeMeta.ts`), including
  the 11 checklists and the 71 guides (100 pages in the build on 2026-10-11;
  the home page is the fallback shell, not a separate file);
- the 500 newest indexable incidents (`PRERENDER_INCIDENT_LIMIT` changes this);
- the 26 newest weekly reports.

The prerendered `/threat-intel` page links the 100 newest of those incidents,
each with its answer sentence, and adds an `ItemList` of them to its JSON-LD.
AI crawlers such as GPTBot, ClaudeBot and PerplexityBot do not run JavaScript
and find pages mostly by following links, so without this list the incident
pages would be orphans for them.

Titles are at most 60 characters. A page keeps the " | Digibastion" suffix only
when the whole title fits; otherwise the page's own title stands alone, and it
is cut at a word only when it is longer than 60 characters by itself.

When the app loads, `src/main.tsx` removes the prerendered JSON-LD and React
draws the page fresh (there is no hydration), so search engines never see two
copies of the structured data.

`dist/index.html` becomes the fallback shell: generic site-wide tags and no
canonical, so a page with no prerendered file never claims to be the homepage.

Build settings, all optional:

| Variable | Effect |
| --- | --- |
| `PRERENDER=0` | Skip the step entirely |
| `PRERENDER_DYNAMIC=0` | Skip incidents and weekly reports (no network needed) |
| `PRERENDER_LAYOUT` | `dir` (default) writes `threat-intel/methodology/index.html`; `file` writes `threat-intel/methodology.html`; `both` writes both |
| `PRERENDER_INCIDENT_LIMIT` | How many incidents to prerender (default 500) |
| `PRERENDER_STRICT=1` | Fail the build on a prerender error instead of warning |

The step never fails the build unless `PRERENDER_STRICT=1`. If Supabase is down,
slow or unreachable, the incident and weekly pages are skipped with one warning.
The default layout is `dir`. The first release built `file` and the canary
showed what Lovable's host does: it answers both `/__prerender-check` and
`/__prerender-check/` from `__prerender-check/index.html`, with 200 and no
redirect, and ignores the `.html` file. On a host that redirects `/page` to
`/page/`, `dir` would contradict the canonical, so the release check still
tests every hub for a redirect and says to turn the prerender off if one
appears.

**Unverified:** whether Lovable serves these files before its fallback. The
canary pages `public/__prerender-check.html` (prints `prerender-file-ok`) and
`public/__prerender-check/index.html` (prints `prerender-dir-ok`) answer that
after a publish; [LOVABLE_SEO_RELEASE.md](LOVABLE_SEO_RELEASE.md) has the
commands and what to do with each result. If Lovable serves neither, the
prerender does no harm, and per-page HTML needs the Worker below.

## llms.txt and llms-full.txt

`public/llms.txt` is a short, plain-text map of the site for language models:
the definition of Digibastion, the main pages, every guide and checklist with a
one-line description, the feeds, the Telegram channel and the methodology.
`public/llms-full.txt` adds the FAQ and the full text of every guide and
checklist. Both, plus `sitemap.xml` and `sitemap-index.xml`, are written by
`npm run seo:generate` from the same registry and data the pages use.
`src/seo/__tests__/generatedFilesInSync.test.ts` fails if they are out of date,
so run the script after changing a route, guide or checklist.

`robots.txt` allows all crawlers, and names the main search and AI crawlers
(Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-User,
Claude-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended and others)
so the intent is explicit.

## Structured data and plain answers

- Each page's JSON-LD comes from the route registry: `Organization` and
  `WebSite` site-wide, `Article` for guides, `ItemList` for checklists,
  `NewsArticle` for incidents, `Report` for weekly reports, `CollectionPage` for
  list pages, `BreadcrumbList`, and `FAQPage` on `/faq` and the methodology
  page.
- `FAQPage` answers are the exact visible text of the page
  (`src/seo/siteFacts.ts`); a test checks they match. Structured data never
  says something the page does not.
- Each incident page opens with one answer-first sentence built by
  `_shared/incident-answer.ts`: what happened, when, the reported loss, and who
  reported it. That is the sentence an answer engine is most likely to quote,
  so it always names the source and never claims Digibastion verified anything.
  It leaves out placeholder chains such as "Other" and "Centralized", and it
  drops the "($0 loss)" some importers add to titles, since the sentence
  already says when no loss figure has been reported.

## Links we send out

Links to our own pages carry UTM tags so a future analytics tool can tell where
visitors came from. Links to sources and partners are never tagged, and links
that carry a token (`/verify-email`, `/manage-subscription`, `/unsubscribe`)
are never tagged either, so a token never sits next to campaign data. The tags
are built by `buildTrackedUrl` in `supabase/functions/_shared/share-links.ts`.

| Where the link appears | `utm_source` | `utm_medium` | `utm_campaign` | `utm_content` |
| --- | --- | --- | --- | --- |
| Telegram incident post | `telegram` | `social` | `incident_alerts` | `retraction` on the link in a retraction edit |
| Telegram weekly post | `telegram` | `social` | `weekly_deep_dive` | none |
| Real-time alert email | `email` | `email` | `realtime_alert` | `title`, `details` or `feed` |
| Alert follow-up email | `email` | `email` | `alert_followup` | `title`, `details` or `feed` |
| Daily brief email | `email` | `email` | `daily_brief` | the link's place in the email |
| Weekly email | `email` | `email` | `weekly_deep_dive` | the link's place in the email |
| Legacy digest email | `email` | `email` | `digest_daily` or `digest_weekly` | `title` or `feed` |
| Subscription confirmation | `email` | `email` | `subscribe_confirm` | `weekly` |
| Share bar on an incident page | `x`, `telegram`, `linkedin` or `share` | `social` (`share` for the device share sheet) | `share_incident` | none |
| Share bar on a weekly page | as above | as above | `share_weekly` | none |

"Copy link" copies the clean canonical URL with no tags. Nothing in production
reads UTM tags yet: `@vercel/analytics` only loads on `*.vercel.app` hosts.
Choosing an analytics tool is on the [roadmap](ROADMAP.md).

Every Telegram post and email names and links the original source next to our
link, and QuillMonitor-only items keep "Powered by QuillMonitor".

## Preview images

`og-image` draws a 1200 by 630 PNG card:

- `?kind=incident&id=<id>`: the incident's title, the source's confirmed or
  unconfirmed status, the reported loss, chain and attack type, and the source
  (with "Powered by QuillMonitor" when it is the only one);
- `?kind=weekly&week=<YYYY-MM-DD>`: the week, its incident count and its
  reported loss;
- no `kind`: the quiz result card.

A missing, merged, retracted or non-Web3 record redirects to the generic Threat
Intel image, so a preview never shows a record we would not list. The images are
cached for a day. Incident and weekly pages point their `og:image` and
`twitter:image` at these cards, and the incident's `NewsArticle` JSON-LD uses
the same image. X, Telegram, LinkedIn and Slack only see them when they get the
prerendered page, or the Worker's page.

Telegram incident posts are the exception: each post asks Telegram to preview
the incident's card directly (`link_preview_options.url`). A post goes out a
few minutes after the incident is stored, before any Publish could prerender
its page, and the card is drawn when Telegram asks for it. A retraction edit
turns the preview off.

## The optional Cloudflare Worker

`edge/cloudflare-worker/` is a Worker that would sit in front of the site. It
does nothing today, because DNS is at GoDaddy and no request reaches it. If DNS
moves to Cloudflare and the Worker is deployed, it:

- writes the right head for every incident and weekly page at request time,
  including ones added after the last publish;
- returns a real 404 for missing records and a real 301 for merged ones, the
  retired routes, and the apex domain (Lovable answers the apex with a 302);
- serves the feeds and dynamic sitemaps from our own host as `/feed.xml`,
  `/feed.atom`, `/feed.json`, `/sitemap-dynamic.xml` and `/sitemap-news.xml`
  with correct content types;
- adds the security headers from `vercel.json`.

Its [README](../edge/cloudflare-worker/README.md) has the DNS move, the
deployment, the checks and the rollback.

## Checking it

```bash
# IndexNow key file (prints the key)
curl -s https://www.digibastion.com/5d9d2e41356f5953eedc2e72bca99b7b.txt

# robots.txt lists three sitemaps
curl -s https://www.digibastion.com/robots.txt | grep Sitemap

# Dynamic sitemap: valid XML, about 2,100 or more URLs
curl -s "https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap?part=dynamic" | xmllint --noout -
curl -s "https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap?part=dynamic" | grep -c "<loc>"

# Feeds parse
curl -s "https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=rss" | xmllint --noout -
curl -s "https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed?format=json" | uv run python3 -m json.tool > /dev/null && echo ok

# Which prerender layout the host serves
curl -s https://www.digibastion.com/__prerender-check
curl -s https://www.digibastion.com/__prerender-check/

# A guide's own title, if the prerender is served
curl -s https://www.digibastion.com/articles/seed-phrase-security-guide | grep -o '<title>[^<]*'

# A preview card renders
# (use the Monday of a published weekly report; a missing week redirects to the generic image)
curl -sI "https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/og-image?kind=weekly&week=<YYYY-MM-DD>"
```

IndexNow runs show up in the admin health panel under the `indexnow` pipeline,
and Bing Webmaster Tools reports the URLs it received.

## Known limits

- A prerendered incident page is as fresh as the last Publish. An incident
  stored after that gets the fallback shell until the next Publish, and a status
  change after it is not in the static copy. Google's rendered view and the
  Worker are both current.
- Only the 500 newest incidents are prerendered. Older ones rely on rendering.
- The sitemaps and feeds live on the functions host and are served as
  `text/plain`.
- Production sends no Content-Security-Policy or anti-framing header.
- The apex domain redirects with a 302, not a 301.
- Whether Lovable serves the prerendered files is unverified until the canary
  check runs.
