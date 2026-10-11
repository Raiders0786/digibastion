# Lovable SEO release: sitemaps, IndexNow, feeds, per-page HTML and sharing

This release ships the `seo-aeo-docs` branch:

- a dynamic sitemap of every indexable incident and weekly report, plus a
  Google News sitemap, both listed in `robots.txt`;
- `ping-indexnow`, which tells Bing and the other IndexNow engines about new
  and changed pages every 30 minutes;
- RSS, Atom and JSON feeds (`threat-intel-feed`);
- per-page HTML written at build time, a `/faq` page and a weekly archive at
  `/threat-intel/weekly`;
- UTM-tagged links in Telegram posts and emails, source credits in every
  email, a share bar and preview cards for incidents and weekly reports;
- rewritten docs.

No new secrets are needed. `INDEXNOW_KEY` is optional and only for rotating
the key; if you set it, `public/<key>.txt` with the same value must already be
live, or IndexNow rejects every submission.

Pre-release main (rollback target for functions): `<PRE_RELEASE_MAIN_SHA>`, the
`main` commit just before the merge.
Release commit: `<MAIN_SHA>`, the merge commit of `seo-aeo-docs` on `main`.

## What ships

**Migrations, in this order:**

1. `supabase/migrations/20261014090000_seo_indexing.sql`: adds `indexnow` to the
   ingestion-run pipelines and the health panel, schedules `ping-indexnow` at
   `22,52 * * * *`, and removes the old `fetch-web3-incidents-6h` job.
2. `supabase/migrations/20261014100000_weekly_newsletter_list.sql`: adds the
   public `list_weekly_newsletters(p_limit)` RPC for the weekly archive.

**New functions:** `ping-indexnow`, `threat-intel-feed`.

**Changed functions:**

| Function | What changed |
| --- | --- |
| `generate-sitemap` | Rebuilt: indexable incidents only, honest `lastmod`, paging, `?part=news`, `?format=txt` |
| `og-image` | Preview cards for incidents and weekly reports |
| `post-telegram-alerts` | Links the source record, tags our links, shared site URL, and shows the incident's preview card under each post |
| `send-critical-alerts` | Source credits and tagged links in alerts and follow-ups |
| `send-newsletters` | Source credits and tagged links; the daily brief links the newest weekly report, and the weekly email links its web page |
| `send-digest-emails` | Source credits and tagged links in the legacy digest |
| `submit-form` | "While you wait" next steps in the confirmation email, with a tagged link to the weekly reports |
| `verify-email`, `update-subscription` | Use the shared site URL and opt-in module (no behavior change) |
| `request-management-link`, `one-click-unsubscribe`, `cron-monitor`, `threat-intel-api`, `weekly-admin-summary` | Links point at `https://www.digibastion.com` instead of the apex domain |
| `fetch-web3-incidents` | Names its source in plain text (no behavior change) |
| `fetch-rss-news` | User-Agent points at the `www` host |
| `build-daily-newsletter`, `build-weekly-newsletter` | Use the shared site URL (no behavior change) |

`fetch-quillmonitor-incidents` and `fetch-slowmist-incidents` need no redeploy:
their only change is a type in `_shared/ingestion-health.ts`.

New or changed shared modules: `attribution.ts`, `feed-render.ts`,
`incident-answer.ts`, `indexnow.ts`, `og-card.ts`, `publishable.ts`,
`share-links.ts`, `site-urls.ts`, `sitemap-render.ts` and `xml.ts` (new), and
`alert-email.ts`, `ingestion-health.ts`, `newsletter-render.ts`,
`security-actions.ts`, `subscription-optin.ts`, `telegram-alerts.ts` and
`weekly-render.ts` (changed).

**Config:** `supabase/config.toml` gains `verify_jwt = false` entries for
`ping-indexnow`, `threat-intel-feed`, `weekly-admin-summary` and
`threat-intel-api`. All four check callers themselves. Before this change the
gateway rejected the `weekly-admin-summary` cron call, because the cron secret
is not a JWT, so that job has probably been failing.

**Frontend:** the route registry and per-page HTML, `/faq`,
`/threat-intel/weekly`, the share bar, the IndexNow key file
`public/5d9d2e41356f5953eedc2e72bca99b7b.txt`, the canary pages
`public/__prerender-check.html` and `public/__prerender-check/index.html`, the
new `robots.txt`, `sitemap.xml`, `llms.txt` and `llms-full.txt`.

## Order, and why

1. Deploy the functions first. Nothing calls `ping-indexnow` until migration 1
   schedules it, and the new pages point their preview images at the new
   `og-image`.
2. Apply the two migrations.
3. Publish straight away. Publishing puts the IndexNow key file live; until
   then IndexNow answers 403, the run is recorded as failed, and the next run
   retries the same URLs. Keep this gap under about two hours: a 403 is an
   error a person has to fix, so `ping-indexnow` answers it with HTTP 502, and
   cron health turns critical and the admins get an email after six failed
   cron runs (of any job) in a day. Throttling and outages on the IndexNow side (429, 5xx,
   timeouts) answer 200 with `"success":false` instead, so they do not page
   anyone; the next run retries them. Publishing after migration 2 also lets
   the build write a page for each weekly report.

## The prompt for Lovable

Paste this into Lovable after `seo-aeo-docs` is merged:

```text
Release the SEO work from main. Follow docs/LOVABLE_SEO_RELEASE.md exactly.
Never print, log or paste any secret value; refer to secrets by name only.

1. Preflight (read-only): confirm public.get_weekly_newsletter(date) exists
   (migration 20261013140000 is applied) and that the secrets CRON_SECRET,
   SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY exist (names only).
   If the RPC is missing, stop and report.
2. Deploy these edge functions from main with their _shared imports:
   ping-indexnow, threat-intel-feed, generate-sitemap, og-image,
   post-telegram-alerts, send-critical-alerts, send-newsletters,
   send-digest-emails, submit-form, verify-email, update-subscription,
   request-management-link, one-click-unsubscribe, cron-monitor,
   threat-intel-api, weekly-admin-summary, fetch-web3-incidents,
   fetch-rss-news, build-daily-newsletter, build-weekly-newsletter.
   Apply the supabase/config.toml entries (verify_jwt = false) for
   ping-indexnow, threat-intel-feed, weekly-admin-summary and threat-intel-api.
3. Apply these migrations byte for byte, in this order, and nothing else:
   supabase/migrations/20261014090000_seo_indexing.sql
   supabase/migrations/20261014100000_weekly_newsletter_list.sql
4. Run the "Backend checks" section and report each result.
5. Tell me when to click Publish. Do not change any other secret, flag,
   cron job or table.
```

## Backend checks (Lovable, before Publish)

```sql
-- ping-indexnow is scheduled; the old duplicate Web3 job is gone
SELECT jobname, schedule, active FROM cron.job
WHERE jobname IN ('ping-indexnow', 'fetch-web3-incidents-6h', 'fetch-web3-incidents-6hourly')
ORDER BY jobname;
-- expect: fetch-web3-incidents-6hourly '30 */6 * * *' and ping-indexnow '22,52 * * * *', both active;
-- no fetch-web3-incidents-6h row

-- one overload, callable by anon
SELECT count(*) FROM pg_proc WHERE proname = 'list_weekly_newsletters';   -- 1
SELECT has_function_privilege('anon', 'public.list_weekly_newsletters(integer)', 'EXECUTE');  -- true

-- the archive returns summary fields only (no "archive" key)
SELECT public.list_weekly_newsletters(3);

-- three merged record ids, for the sitemap check below
SELECT id FROM news_articles WHERE metadata->>'duplicate_of_uid' IS NOT NULL LIMIT 3;
```

Then two calls, authorized with `Authorization: Bearer` and the
`SUPABASE_SERVICE_ROLE_KEY` read from the backend secrets (never displayed):

1. `POST ping-indexnow {"mode":"urls","dryRun":true,"urls":["https://www.digibastion.com/threat-intel"]}`
   returns `200` with `"success":true,"dryRun":true,"count":1`.
2. `POST ping-indexnow {}` with no `Authorization` header returns `401`.

Do not send a real (non-dry-run) IndexNow submission before Publish: the key
file is not live yet.

## Checks after Publish

Run each command and record the result. `xmllint` ships with macOS; on Linux
install `libxml2-utils`.

**Key file and robots.txt**

```bash
curl -s https://www.digibastion.com/5d9d2e41356f5953eedc2e72bca99b7b.txt
# prints 5d9d2e41356f5953eedc2e72bca99b7b

curl -s https://www.digibastion.com/robots.txt | grep Sitemap
# three lines: sitemap-index.xml and the two generate-sitemap URLs
```

**Sitemaps**

```bash
SM="https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/generate-sitemap"
curl -sI "$SM?part=dynamic" | head -1                 # HTTP/2 200
curl -s "$SM?part=dynamic" | xmllint --noout -        # no output means valid
curl -s "$SM?part=dynamic" | grep -c "<loc>"          # about 2,100 or more
curl -s "$SM?part=news" | xmllint --noout -           # valid (may list few or no URLs)
curl -s "$SM?part=dynamic" | grep -c "<merged id from the SQL above>"   # 0 for each of the three ids
```

**Feeds**

```bash
FEED="https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/threat-intel-feed"
curl -s "$FEED?format=rss" | xmllint --noout -
curl -s "$FEED?format=atom" | xmllint --noout -
curl -s "$FEED?format=json" | uv run python3 -m json.tool > /dev/null && echo ok
```

**Hubs and canary: no redirects**

The default `file` layout writes `dist/threat-intel.html` next to a
`dist/threat-intel/` folder of incident pages. The same happens for
`articles`, `services` and `threat-intel/weekly`. Before this release none of
those folders existed. Some static hosts answer `/threat-intel` with a 301 to
`/threat-intel/` when a folder of that name exists, and some then return 403
or 404 because the folder has no `index.html`. Check this first: these are the
site's most important URLs.

```bash
for p in /threat-intel /articles /services /threat-intel/weekly /__prerender-check; do
  printf '%s  ' "$p"; curl -sI "https://www.digibastion.com$p" | grep -iE '^(HTTP|location)' | tr '\r\n' '  '; echo
done
# expect: every line shows 200 and no location: header
```

If any of them shows 301, 308, 403 or 404, roll the prerender back at once
(see "Turning the prerender off" below). Do not switch to the `dir` layout:
it writes `threat-intel/index.html` and keeps the slash redirect on every hub.

**Prerender canary: which layout does Lovable serve?**

```bash
curl -s https://www.digibastion.com/__prerender-check  | grep -o 'prerender-[a-z]*-ok'
curl -s https://www.digibastion.com/__prerender-check/ | grep -o 'prerender-[a-z]*-ok'
curl -sI https://www.digibastion.com/articles/seed-phrase-security-guide | head -1
# expect 200, not a 301 to a URL ending in /
curl -s https://www.digibastion.com/articles/seed-phrase-security-guide | grep -o '<title>[^<]*'
# the guide's own title if the prerender is served; the generic site title if not
curl -s https://www.digibastion.com/does-not-exist | grep -c 'rel="canonical"'
# 0: the fallback page has no canonical
```

Record which of `prerender-file-ok` and `prerender-dir-ok` appeared, then:

| Result | What to do |
| --- | --- |
| Any hub or the canary answered 301 or 308 to a trailing slash, 403 or 404 in the check above | Turn the prerender off and publish again at once (see below). Do not switch to `dir`. |
| `prerender-file-ok` appears and every hub answered 200 | Keep the defaults. Per-page HTML is live. |
| Only `prerender-dir-ok` appears, every hub answered 200, and the guide URL has no 301 to a trailing slash | Switch to the `dir` layout (see below) and publish again. Otherwise leave it. |
| Neither appears, and every hub answered 200 | Lovable serves only `index.html`. Nothing breaks, but link previews and non-JS crawlers keep seeing the fallback page. The fix is the Worker in `edge/cloudflare-worker/` after a DNS move. |

To switch to the `dir` layout, set the build environment variable
`PRERENDER_LAYOUT=dir` if Lovable offers build variables. If it does not,
change the first line of `parseLayout()` in `scripts/seo/prerenderCore.ts`
from `if (!value) return 'file';` to `if (!value) return 'dir';`, merge, and
publish.

Also check that the prerendered `/threat-intel` links the newest incidents,
so crawlers that do not run JavaScript can reach them:

```bash
curl -s https://www.digibastion.com/threat-intel | grep -c 'href="/threat-intel/[0-9a-f-]\{36\}"'
# up to 100 when the prerender is served; 0 when Lovable serves only index.html
```

Also open one incident page and one weekly report and check the raw HTML title
the same way: an incident added before this Publish should have its own title
when the file layout is served.

**IndexNow, for real**

Authorized with the service-role key, as above:

1. `POST ping-indexnow {"mode":"urls","urls":["https://www.digibastion.com/threat-intel"]}`
   returns `200` with `"success":true` and `"outcomes":["ok"]`. The newest
   `threat_intel_ingestion_runs` row with `pipeline = 'indexnow'` has
   `success = true` and `metadata.statuses` of `[200]` or `[202]`.
   A `403` there means the key file is not live; check the first command above.
2. Once that works, run `POST ping-indexnow {"mode":"backfill"}` one time. It
   submits every indexable incident and weekly report (about 2,100 URLs).
   Do not repeat it; the cron covers everything new from here on.

**Cron and health, in `/admin/cron` and the admin health panel**

- `ping-indexnow` shows runs at :22 and :52 with HTTP 200.
- `fetch-web3-incidents-6h` no longer appears.
- `weekly-admin-summary` succeeds on its next Monday run at 07:05 UTC.
- The `indexnow` pipeline shows as healthy after the first scheduled run.

**Pages**

- `/faq`, `/threat-intel/weekly` and one `/threat-intel/weekly/<YYYY-MM-DD>`
  load, and the weekly page shows the share bar.
- An incident page shows the share bar. "Copy link" copies the URL with no
  `?utm_` tags.
- `/threat-intel/<id>` for a merged record redirects to the surviving record.

**Previews (user)**

Paste one incident URL and one weekly URL into the X post composer, a private
Telegram chat and the [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).
Record what each shows: the incident's own title and card, or the generic
homepage card. Generic cards everywhere usually mean the canary showed neither
layout.

## After the release (user)

1. In Google Search Console for `https://www.digibastion.com`, submit only
   `https://www.digibastion.com/sitemap-index.xml`. The Sitemaps report
   accepts sitemap URLs inside the verified property only, and the two
   function sitemaps live on `sdszjqltoheqhfkeprrd.supabase.co`, which cannot
   be verified, so submitting them fails. Google still reads them, because
   `robots.txt` lists them on `Sitemap:` lines, but they will not appear in
   the Sitemaps report. To confirm they work, use URL Inspection on `/`, one
   guide, a few incidents and one weekly report, and watch the Pages report
   over the following weeks.
2. In Bing Webmaster Tools, import the site from Search Console and submit
   `sitemap-index.xml`. Bing may also refuse a sitemap on another host;
   IndexNow is the main path to Bing, so watch its IndexNow report after the
   backfill.

## Rollback

| Problem | Action |
| --- | --- |
| IndexNow misbehaves | `SELECT cron.unschedule('ping-indexnow');` Nothing else depends on it. |
| The build fails, a page renders wrong, or a hub redirects or stops loading | Turn the prerender off (below) and publish again; the site falls back to the single `index.html`. |
| The dynamic sitemap is wrong | Remove its two `Sitemap:` lines from `public/robots.txt` and publish. Nothing else reads the old sitemap behavior. |
| A changed email or Telegram function fails | Redeploy that function from `<PRE_RELEASE_MAIN_SHA>`. The changes are links and copy only, with no schema dependency. |

### Turning the prerender off

There are two ways. The first needs a host feature nobody has confirmed
Lovable has; the second always works.

1. If Lovable offers build environment variables, set `PRERENDER=0` and
   publish.
2. Otherwise, change one line in `vite.config.ts`: delete `seoPrerender(),`
   from the `plugins` list (the line under the "Per-route HTML for crawlers"
   comment), merge, and publish. The build then writes only the single
   `index.html`, as it did before this release. `public/robots.txt`, the
   sitemaps, `llms.txt` and the key file are plain files in `public/` and keep
   working.

Do not reverse the migrations. Migration 1 only widens a check constraint,
replaces the health function with the same signature and changes cron jobs;
migration 2 adds a read-only RPC.
