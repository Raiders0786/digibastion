# Lovable SEO release: sitemaps, IndexNow, feeds, per-page HTML and sharing

This runbook ships the `seo-aeo-docs` branch. After it, search engines and
answer engines hear about a new incident within about 30 minutes, and a
shared link can show the incident's own title and card instead of the
homepage. What changes:

- `generate-sitemap` lists every indexable incident and weekly report, plus a
  Google News sitemap. `robots.txt` points crawlers at both.
- `ping-indexnow` tells Bing, Yandex, Seznam and Naver about new and changed
  pages at :22 and :52 past each hour. Bing's index also feeds ChatGPT search
  and Copilot. Google has no ping API for normal pages, so Google finds new
  pages through the sitemaps.
- `threat-intel-feed` serves RSS, Atom and JSON Feed.
- The build writes one HTML file per route, incident and weekly report, each
  with its own title, canonical URL, preview image and JSON-LD. The release
  also adds `/faq`, `/privacy` and a weekly archive at `/threat-intel/weekly`.
- Telegram posts and emails credit the source by name and tag links back to
  the site with UTM parameters. Incident and weekly pages get a share bar and
  their own preview cards from `og-image`.
- The docs in `docs/` and the README are rewritten.

Two placeholders appear below. `<MAIN_SHA>` is the merge commit of
`seo-aeo-docs` on `main`. `<PRE_RELEASE_MAIN_SHA>` is the `main` commit just
before that merge, and is the rollback target for functions.

## What ships

### Migrations, in this order

1. `supabase/migrations/20261014090000_seo_indexing.sql` adds `indexnow` to the
   pipelines `threat_intel_ingestion_runs` accepts and to the health panel,
   schedules the cron job `ping-indexnow` at `22,52 * * * *`, and removes the
   orphan `fetch-web3-incidents-6h` job. The real Web3 job,
   `fetch-web3-incidents-6hourly`, stays.
2. `supabase/migrations/20261014100000_weekly_newsletter_list.sql` adds the
   read-only RPC `list_weekly_newsletters(p_limit integer default 52)`, which
   anon may call. The weekly archive page and the build use it.

Both expect `20261013140000_weekly_newsletter_public.sql` to be applied
already.

### Edge functions

Every function below has `verify_jwt = false` in `supabase/config.toml` and
checks its callers in its own code.

| Function | Status | What changed |
| --- | --- | --- |
| `ping-indexnow` | New | Submits new and changed URLs to IndexNow. `CRON_SECRET` may only use mode `run`; modes `urls` and `backfill` need the service role or an admin |
| `threat-intel-feed` | New | RSS, Atom and JSON Feed of incidents and weekly reports |
| `generate-sitemap` | Rewritten | Indexable incidents only, real `lastmod`, paging, `?part=news`, `?format=txt` |
| `og-image` | Changed | Preview cards for `?kind=incident&id=` and `?kind=weekly&week=`; the quiz card is unchanged |
| `post-telegram-alerts` | Changed | Links the source, adds "Powered by QuillMonitor" where it applies, tags links, previews the incident card |
| `send-critical-alerts` | Changed | Source credits and tagged links in alerts and follow-ups |
| `send-newsletters` | Changed | Source credits and tagged links; the daily brief links the newest weekly report |
| `send-digest-emails` | Changed | Source credits and tagged links in the legacy digest |
| `submit-form` | Changed | Next steps in the confirmation email, with a link to the weekly reports |
| `verify-email`, `update-subscription` | Changed | Shared site URL and opt-in module; no behavior change |
| `request-management-link`, `one-click-unsubscribe`, `cron-monitor`, `threat-intel-api`, `weekly-admin-summary` | Changed | Links use `https://www.digibastion.com` instead of the apex domain |
| `fetch-web3-incidents` | Changed | Names its source URL in plain text; it scrapes the same URL as before |
| `fetch-rss-news` | Changed | User-Agent names the `www` host |
| `build-daily-newsletter`, `build-weekly-newsletter` | Changed | Shared site URL; no behavior change |

`fetch-quillmonitor-incidents` and `fetch-slowmist-incidents` need no
redeploy. The only change they see is a type in `_shared/ingestion-health.ts`.

`supabase/config.toml` gains four `verify_jwt = false` entries:
`ping-indexnow`, `threat-intel-feed`, `weekly-admin-summary` and
`threat-intel-api`. Until now the gateway rejected the cron call to
`weekly-admin-summary`, because `CRON_SECRET` is not a JWT, so that Monday job
has probably been failing.

### Secrets and config

No new secrets and no new non-secret config. `CRON_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` already exist.

`INDEXNOW_KEY` is optional and exists only to rotate the key. Leave it unset.
The function then uses the public key `5d9d2e41356f5953eedc2e72bca99b7b`,
which the site serves at `/5d9d2e41356f5953eedc2e72bca99b7b.txt`. IndexNow
keys are public by design: the engines fetch that file to confirm we control
the site. If you ever set `INDEXNOW_KEY`, publish `public/<new key>.txt`
first, or every submission gets a 403.

The build reads a few optional environment variables, and none is needed:
`PRERENDER=0` turns per-page HTML off, `PRERENDER_DYNAMIC=0` skips the
incident and weekly pages, `PRERENDER_LAYOUT=file|dir|both` (default `file`)
picks the file layout, `PRERENDER_INCIDENT_LIMIT` (default 500) caps the
incident pages, and `PRERENDER_STRICT=1` fails the build when the prerender
fails.

### Frontend

The route registry and per-page HTML, `/faq`, `/privacy`,
`/threat-intel/weekly`, the share bar, the IndexNow key file, the canary page
`/__prerender-check`, and new `robots.txt`, `sitemap.xml`,
`sitemap-index.xml`, `llms.txt` and `llms-full.txt`.

## Order, and why

1. **Deploy the functions first.** Nothing calls `ping-indexnow` until
   migration 1 schedules it, and the new pages point their preview images at
   the new `og-image`. The old `og-image` ignores `kind` and would draw a quiz
   card.
2. **Apply the two migrations.**
3. **Publish straight away.** Publishing puts the IndexNow key file live.
   Until then IndexNow answers 403, the function returns HTTP 502 and the run
   is recorded as failed; the next run retries the same URLs. Keep the gap
   between migration 1 and Publish under about two hours: after six failed
   cron runs of any job in a day, cron health turns critical and the admins
   get an email. Throttling or outages on the IndexNow side (429, 5xx,
   timeouts) return 200 with `"success":false`, so they page nobody.
   Publishing after migration 2 also lets the build write a page for each
   weekly report.

## What to expect after deploy

- **A burst of Telegram edits.** `post-telegram-alerts` compares each post's
  stored text with what it would post now. Every incident post still inside
  the 14-day edit window now differs (source link, "Powered by QuillMonitor"
  line, "Digibastion" spelling), so the next few runs edit those posts once
  each, a few per run. Nothing is reposted.
- **Build logs.** A normal build prints
  `[seo] prerendered 100 static, 500 incident, N weekly pages (file)`. If
  Supabase cannot be reached from the build machine, it prints one
  `[seo] dynamic pages skipped: ...` line and still passes. A 5xx answer is
  retried twice first. Before migration 2 the build also prints
  `[seo] list_weekly_newsletters is not deployed yet`.
- **Freshness.** Incident pages are written at build time. An incident added
  after the last Publish gets the generic page head until the next Publish.
  The sitemap and IndexNow still list it within 30 minutes.

## The prompt for Lovable

Paste this into Lovable after `seo-aeo-docs` is merged, with `<MAIN_SHA>`
filled in:

```text
Use View Backend for the existing managed Lovable Cloud project and deploy
from GitHub main at commit <MAIN_SHA> or later. Follow
docs/LOVABLE_SEO_RELEASE.md. Do not rewrite application source, create another
backend, or change any secret, flag, cron job or table this prompt does not
name. Never print, log or paste a secret value; refer to secrets by name.

Do not invoke any function that sends email or Telegram messages:
post-telegram-alerts, send-critical-alerts, send-newsletters,
send-digest-emails, submit-form, verify-email, request-management-link,
weekly-admin-summary, cron-monitor, build-daily-newsletter,
build-weekly-newsletter. Deploying them is fine; calling them is not.

Auth: "with CRON_SECRET" means the header Authorization: Bearer <value of the
CRON_SECRET function secret>, read from secrets and never displayed. "With the
service role" means the same with SUPABASE_SERVICE_ROLE_KEY. ping-indexnow
refuses CRON_SECRET for its urls and backfill modes by design.

Run the steps in order and STOP at the first failure. Reply with one line per
step: "<n> PASS <short evidence>" or "<n> FAIL <what you saw>", then
"<n> SKIPPED" for every step after a failure. If you have no tool that can
fetch a public URL, mark steps 9 to 11 "SKIPPED no fetch tool" and continue;
I will run the curl versions from the doc.

F   = https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1
WWW = https://www.digibastion.com

1. Preflight, read-only. public.get_weekly_newsletter(date) exists
   (migration 20261013140000 is applied), and the secrets CRON_SECRET,
   SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY exist (names only).
2. Deploy these 20 edge functions from the commit above, with their _shared
   imports: ping-indexnow, threat-intel-feed, generate-sitemap, og-image,
   post-telegram-alerts, send-critical-alerts, send-newsletters,
   send-digest-emails, submit-form, verify-email, update-subscription,
   request-management-link, one-click-unsubscribe, cron-monitor,
   threat-intel-api, weekly-admin-summary, fetch-web3-incidents,
   fetch-rss-news, build-daily-newsletter, build-weekly-newsletter.
   Report the deployed Git revision.
3. Confirm platform JWT verification is off (verify_jwt = false, as in
   supabase/config.toml) for all 20, including the four new entries
   ping-indexnow, threat-intel-feed, weekly-admin-summary, threat-intel-api.
4. Apply these migrations byte for byte, in this order, and nothing else:
   supabase/migrations/20261014090000_seo_indexing.sql
   supabase/migrations/20261014100000_weekly_newsletter_list.sql
5. SQL checks:
   a. SELECT jobname, schedule, active FROM cron.job WHERE jobname IN
      ('ping-indexnow','fetch-web3-incidents-6h','fetch-web3-incidents-6hourly');
      expect exactly two rows, both active: ping-indexnow '22,52 * * * *'
      and fetch-web3-incidents-6hourly '30 */6 * * *'.
   b. SELECT count(*) FROM pg_proc WHERE proname = 'list_weekly_newsletters';
      expect 1.
   c. SELECT has_function_privilege('anon',
      'public.list_weekly_newsletters(integer)', 'EXECUTE'); expect true.
   d. SELECT public.list_weekly_newsletters(3); expect week summaries with no
      "archive" key.
6. Function checks, GET, no auth:
   a. F/generate-sitemap?part=dynamic returns 200 and a well-formed XML
      urlset with about 2,000 or more <loc> entries, all starting with WWW/.
      The gateway may label it text/plain; that is expected.
   b. F/generate-sitemap?part=news returns 200 and well-formed XML.
   c. F/generate-sitemap?part=dynamic&format=txt returns one URL per line.
   d. F/generate-sitemap?part=bogus returns 400.
   e. F/threat-intel-feed?format=rss and ?format=atom return 200 and
      well-formed XML; ?format=json returns 200 and valid JSON with an
      "items" array; ?format=bogus returns 400.
   f. Take one id from: SELECT id FROM news_articles WHERE
      metadata->>'is_web3_incident' = 'true' AND
      metadata->>'duplicate_of_uid' IS NULL ORDER BY created_at DESC LIMIT 1;
      F/og-image?kind=incident&id=<that id> returns 200 image/png.
7. ping-indexnow, POST with a JSON body. Dry runs submit nothing and record
   nothing.
   a. With CRON_SECRET: {"mode":"run","dryRun":true} returns 200 with
      "success":true,"dryRun":true and a count (0 is fine).
   b. With the service role: {"mode":"backfill","dryRun":true} returns 200
      with a count above 1,000 and a sample of 5 URLs, all under WWW/.
   c. With no Authorization header: {} returns 401.
8. Publish the frontend from the same commit. If you cannot publish
   yourself, reply "8 WAITING click Publish" and continue from step 9 when I
   reply "published".
9. Static files:
   a. GET WWW/5d9d2e41356f5953eedc2e72bca99b7b.txt returns exactly
      5d9d2e41356f5953eedc2e72bca99b7b, not the HTML app shell.
   b. GET WWW/robots.txt has three Sitemap: lines: WWW/sitemap-index.xml,
      F/generate-sitemap?part=dynamic and F/generate-sitemap?part=news.
   c. GET WWW/llms.txt returns plain text, not HTML.
10. Hubs must not redirect. HEAD, without following redirects:
    WWW/threat-intel, WWW/articles, WWW/services, WWW/threat-intel/weekly,
    WWW/__prerender-check. Each returns 200 with no Location header. Any 301,
    308, 403 or 404 is a FAIL: stop, and follow "Turning the prerender off"
    in the doc.
11. Per-page HTML, read as raw HTML without running JavaScript. This step
    reports; it fails only if a page does not return 200.
    a. GET WWW/__prerender-check and WWW/__prerender-check/ and report
       which of prerender-file-ok and prerender-dir-ok appears, if either.
    b. For WWW/threat-intel/methodology, WWW/about and
       WWW/threat-intel/<id from 6f>, report the <title> text and the
       rel="canonical" href. If Lovable serves the prerendered files, the
       titles are "How Digibastion Tracks Crypto Incidents", "About
       Digibastion: Free Web3 Security Tools and Alerts" and the incident's
       own title, each with its own canonical. If not, all three show the
       generic site title and no canonical. Report which.
    c. GET WWW/does-not-exist contains no rel="canonical".
12. IndexNow, real submission, with the service role:
    {"mode":"urls","urls":["https://www.digibastion.com/threat-intel"]}
    returns 200 with "success":true and "outcomes":["ok"]. The newest
    threat_intel_ingestion_runs row with pipeline = 'indexnow' has
    success = true and metadata.statuses [200] or [202]. A 403 means the key
    file from 9a is not being served.
13. Only if 12 passed, with the service role: {"mode":"backfill"} once.
    Expect 200 and "success":true. Do not repeat it.
14. In a browser, open WWW/threat-intel, one incident page, WWW/faq and
    WWW/threat-intel/weekly. Each renders, the incident page shows the share
    bar (Post on X, Telegram, LinkedIn, Copy link), and the console shows no
    errors.
15. Return the deployed Git revision, the cron rows from 5a, the newest
    indexnow run row (aggregate columns only) and the step 11 results.
```

## Checks by hand

The same checks as the prompt, for a terminal. `xmllint` ships with macOS;
on Linux install `libxml2-utils`. `jq` ships with recent macOS or comes from
your package manager.

### Before Publish

```bash
F="https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1"
curl -sI "$F/generate-sitemap?part=dynamic" | grep -iE '^(HTTP|x-robots-tag)'   # 200, noindex
curl -s  "$F/generate-sitemap?part=dynamic" | xmllint --noout -                # no output means valid
curl -s  "$F/generate-sitemap?part=dynamic" | grep -c '<loc>'                   # about 2,100
curl -s  "$F/generate-sitemap?part=news"    | xmllint --noout -
curl -s -o /dev/null -w '%{http_code}\n' "$F/generate-sitemap?part=bogus"     # 400
curl -s "$F/threat-intel-feed?format=rss"  | xmllint --noout -
curl -s "$F/threat-intel-feed?format=atom" | xmllint --noout -
curl -s "$F/threat-intel-feed?format=json" | jq -e '.items | length' > /dev/null && echo ok
curl -s -o /dev/null -w '%{http_code}\n' "$F/threat-intel-feed?format=bogus"  # 400
```

The Supabase gateway may relabel XML as `text/plain`. Crawlers parse it
anyway. If Search Console ever rejects the XML sitemap, use
`?part=dynamic&format=txt`, a plain list of URLs that Google also accepts.

The IndexNow dry runs need the `CRON_SECRET` or service-role value, so run
them in Lovable (prompt step 7), not from a laptop.

### After Publish

```bash
W="https://www.digibastion.com"
curl -s "$W/5d9d2e41356f5953eedc2e72bca99b7b.txt"            # prints the key, not HTML
curl -s "$W/robots.txt" | grep Sitemap                         # three lines

# Hubs: every line must show 200 and no location header
for p in /threat-intel /articles /services /threat-intel/weekly /__prerender-check; do
  printf '%s  ' "$p"; curl -sI "$W$p" | grep -iE '^(HTTP|location)' | tr '\r\n' '  '; echo
done

# Canary: which layout does Lovable serve?
curl -s "$W/__prerender-check"  | grep -o 'prerender-[a-z]*-ok'
curl -s "$W/__prerender-check/" | grep -o 'prerender-[a-z]*-ok'

# Per-page head on three routes (put a real incident id in the third)
for p in /threat-intel/methodology /about /threat-intel/<incident id>; do
  echo "== $p"; curl -s "$W$p" | grep -oE '<title>[^<]*|rel="canonical" href="[^"]*"'
done
curl -s "$W/does-not-exist" | grep -c 'rel="canonical"'        # 0

# The prerendered hub links the newest incidents for crawlers without JavaScript
curl -s "$W/threat-intel" | grep -c 'href="/threat-intel/[0-9a-f-]\{36\}"'   # up to 100 if served, 0 if not
```

The hub check comes first for a reason. The default `file` layout writes
`dist/threat-intel.html` next to a `dist/threat-intel/` folder of incident
pages, and does the same for `articles`, `services` and `threat-intel/weekly`.
Some static hosts answer `/threat-intel` with a 301 to `/threat-intel/` once
a folder of that name exists, and some then return 403 or 404 because the
folder has no `index.html`. Those are the site's most important URLs.

What to do with the results:

| Result | Action |
| --- | --- |
| A hub or the canary returned 301 or 308 to a trailing slash, 403 or 404 | Turn the prerender off and publish again now (below). Do not switch to `dir`; it keeps the slash redirect on every hub. |
| `prerender-file-ok` appears and every hub returned 200 | Keep the defaults. Per-page HTML is live. |
| Only `prerender-dir-ok` appears, every hub returned 200, and `/about` has no 301 | Switch to the `dir` layout (below) and publish again. |
| Neither appears and every hub returned 200 | Lovable serves only `index.html`. Nothing breaks, but previews and crawlers that do not run JavaScript keep seeing the generic page. The fix is the Cloudflare Worker in `edge/cloudflare-worker/`, after a DNS move. |

To switch to `dir`, set the build variable `PRERENDER_LAYOUT=dir` if Lovable
offers build variables. If it does not, change the first line of
`parseLayout()` in `scripts/seo/prerenderCore.ts` from
`if (!value) return 'file';` to `if (!value) return 'dir';`, merge and
publish.

### In the admin pages over the next day

- `/admin/cron`: `ping-indexnow` runs at :22 and :52 with HTTP 200, and
  `fetch-web3-incidents-6h` is gone.
- The health panel shows the `indexnow` pipeline as healthy after the first
  scheduled run.
- `weekly-admin-summary` succeeds on its next Monday run at 07:05 UTC.

### Previews (user)

Paste one incident URL and one weekly URL into the X post composer, a private
Telegram chat and the
[LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/). Note
whether each shows the page's own title and card or the generic homepage
card. Generic cards everywhere usually mean the canary showed neither layout.

## After the release (user)

1. **Google Search Console**, property `https://www.digibastion.com`: submit
   only `https://www.digibastion.com/sitemap-index.xml`. The Sitemaps report
   accepts sitemaps inside the verified property only. The two function
   sitemaps live on `sdszjqltoheqhfkeprrd.supabase.co`, which you cannot
   verify, so submitting them fails. Google still reads them through the
   `Sitemap:` lines in `robots.txt`; they just do not show in that report. To
   confirm, use URL Inspection on `/`, one guide, a few incidents and one
   weekly report, then watch the Pages report over the following weeks.
2. **Bing Webmaster Tools**: import the site from Search Console and submit
   `sitemap-index.xml`. IndexNow is the main path into Bing, so check the
   IndexNow report there after the backfill.

## Rollback

| Problem | Action |
| --- | --- |
| IndexNow misbehaves | `SELECT cron.unschedule('ping-indexnow');` Nothing else depends on it. |
| The build fails, a page renders wrong, or a hub redirects or stops loading | Turn the prerender off (below) and publish again. The site falls back to the single `index.html`. |
| The dynamic sitemap is wrong | Remove its two `Sitemap:` lines from `public/robots.txt` and publish. |
| The feed is wrong | Remove the three feed `<link rel="alternate">` tags from `index.html` and publish, then fix and redeploy `threat-intel-feed`. The app never calls the feed; `llms.txt` also lists it, and that file is generated by `npm run seo:generate`. |
| A changed email or Telegram function fails | Redeploy that function from `<PRE_RELEASE_MAIN_SHA>`. The changes are links and copy, with no schema dependency. |

### Turning the prerender off

1. If Lovable offers build environment variables, set `PRERENDER=0` and
   publish.
2. Otherwise, delete the `seoPrerender(),` line from the `plugins` list in
   `vite.config.ts` (under the "Per-route HTML for crawlers" comment), merge
   and publish. The build then writes only `index.html`, as before this
   release. `robots.txt`, the sitemaps, `llms.txt` and the key file are plain
   files in `public/` and keep working.

Do not reverse the migrations. Migration 1 widens a check constraint,
replaces the health function with the same signature and changes cron jobs.
Migration 2 adds a read-only RPC.
