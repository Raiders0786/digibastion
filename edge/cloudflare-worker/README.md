# Digibastion edge Worker (optional)

This folder holds a Cloudflare Worker that can sit in front of www.digibastion.com. **It does nothing today.** The site is on Lovable's static hosting with DNS at GoDaddy, so no request ever reaches this code. It starts working only after the steps below: move DNS to Cloudflare, deploy the Worker, add two routes.

## Why you might want it

Lovable serves the same `index.html` for every URL it has no file for. The build writes a page with its own title, description and preview image for each incident and weekly report that exists at build time (see `scripts/seo`), but an incident added after the last publish gets the generic homepage head. X, Telegram, LinkedIn and Slack previews then show the homepage, and so do crawlers that do not run JavaScript (GPTBot, ClaudeBot, PerplexityBot and most answer engines).

The Worker fixes that at request time, for every visitor, with no redeploy:

- `/threat-intel/<id>` gets that incident's title, description, canonical URL, preview image and JSON-LD, read from Supabase with the public anon key. The incident is described by the same code the build uses (`src/seo/incidentMeta.ts`), so the source is named and QuillMonitor records keep "Powered by QuillMonitor".
- `/threat-intel/weekly/<YYYY-MM-DD>` gets the weekly report's head the same way.
- An incident or weekly report that does not exist returns a real `404` with a `noindex` tag. Today it returns `200`, which search engines treat as a thin duplicate of the homepage.
- A record merged into another provider's report returns a `301` to the surviving record, keeping any `?utm_` tags.
- RSS news relays still render (readers reach them from emails) but carry `noindex, follow`, the same rule the sitemap and prerender use.
- `/news` and `/present` and the three retired guide slugs return real `301`s instead of a client-side redirect. The list matches `vercel.json`, and a test fails if the two drift.
- `digibastion.com/<path>` returns a `301` to `https://www.digibastion.com/<path>`. Lovable answers with a `302` today, which tells search engines the move is temporary.
- `/feed.xml`, `/feed.atom`, `/feed.json`, `/sitemap-dynamic.xml` and `/sitemap-news.xml` are served from our own host with the right content type. The Supabase gateway sends XML as `text/plain`, which some feed readers reject.
- Every HTML page gets the security headers from `vercel.json` (Content-Security-Policy, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-Content-Type-Options). Lovable sends only Referrer-Policy and X-Content-Type-Options today (checked 2026-10-11).

## What it does not do

- It does not check user agents. Bots and people get the same HTML, so there is no cloaking.
- It does not cache pages. Supabase lookups are cached for five minutes in each Cloudflare data centre, so a status change can take up to five minutes to show in the head tags. The page body is still drawn by the app in the browser.
- It does not change static pages such as `/about`, guides or checklists beyond adding headers. Those come from the build-time prerender.
- If Supabase errors or takes longer than four seconds, the Worker serves Lovable's page unchanged. The site never goes down because of a lookup.
- It holds no secrets. Every value in `wrangler.toml` is already public in this repo.

## Files

| File | What it is |
|---|---|
| `src/plan.ts` | Pure logic: which kind of URL this is, the redirect table, the header list, the HTML rewrite. Tested by `src/plan.test.ts`. |
| `src/index.ts` | The Worker: fetches the origin and Supabase, applies the plan, fails open. |
| `src/env.d.ts` | The few Workers types used, so no extra dependency is needed. |
| `wrangler.toml` | Name, entry point and public settings (`[vars]`). |

## Settings (`[vars]` in `wrangler.toml`)

| Name | Value | Notes |
|---|---|---|
| `ORIGIN_URL` | `""` (empty) | Empty means pages come from the DNS record's origin, Lovable at `185.158.133.1`, the same server that answers today. A separate host only works if it serves the site without redirecting to www. `digibastion.lovable.app` answers every path with a `302` to `www.digibastion.com` (checked 2026-10-11), so it cannot be used: the Worker would detect the loop and return `502`. |
| `SUPABASE_URL` | `https://sdszjqltoheqhfkeprrd.supabase.co` | |
| `SUPABASE_ANON_KEY` | the public anon key | Same value as `src/integrations/supabase/publicDefaults.ts`. Never put a service-role key here. |
| `CSP_REPORT_ONLY` | `"true"` | Sends the policy as `Content-Security-Policy-Report-Only` so a blocked script is logged instead of breaking the page. Set it to `"false"` after a few days with no CSP warnings in the browser console. |

## Before you start

1. **Know the one real risk.** With the Worker, Lovable keeps serving `www.digibastion.com`, but the requests now arrive through Cloudflare's proxy. Lovable's custom-domain check or certificate renewal might reject that. The steps below test this before the Worker is switched on, and the rollback is one click.
2. **Write down every DNS record at GoDaddy.** Open the `digibastion.com` DNS page and screenshot or export all of it. Pay attention to the email records: the `MX` records for incoming mail, the Resend records (`resend._domainkey` TXT for DKIM, the `send` subdomain `MX` and SPF `TXT`), the root SPF `TXT` and the `_dmarc` TXT. If one goes missing, alert and newsletter emails start failing SPF or DKIM and land in spam.

## Moving DNS to Cloudflare

1. Create a free Cloudflare account and choose **Add a site**, then enter `digibastion.com` and pick the Free plan.
2. Cloudflare scans the existing records. Compare its list with your GoDaddy export line by line and add anything it missed.
3. Set the proxy status:
   - `digibastion.com` (A) and `www` (A or CNAME): **Proxied** (orange cloud). These must be proxied for the Worker to see the traffic. Keep the current Lovable target (`185.158.133.1`) as the record value.
   - Every mail record (`MX`, `TXT`, the `send` subdomain, DKIM): **DNS only** (grey cloud). Mail must never go through the proxy.
   - Any `_lovable` or other verification `TXT` record: copy it unchanged.
4. Under **SSL/TLS**, set the mode to **Full (strict)**.
5. Cloudflare shows two nameservers. At GoDaddy, open the domain, choose **Nameservers > Change > Enter my own nameservers**, and paste them. The switch can take from a few minutes to a day. Cloudflare emails you when the site is active.
6. Once active, and before deploying the Worker, open https://www.digibastion.com and a few inner pages. They should load exactly as before. Then open Lovable's domain settings. If Lovable now shows `www.digibastion.com` as unverified or failing, re-verify it there and keep its verification `TXT` record in place. If it still fails after a day, Lovable will not serve the domain through a proxy: roll back (below) and keep DNS-only records. The Worker cannot run in that case, and the build-time prerender remains the only per-page head.

## Deploying the Worker

From the repo root:

```sh
cd edge/cloudflare-worker
npx wrangler login
npx wrangler deploy
```

Leave `ORIGIN_URL` empty unless you have a host that serves the site without redirecting. Then in the Cloudflare dashboard open **Workers & Pages > digibastion-edge > Settings > Domains & Routes** and add two routes, both on the `digibastion.com` zone:

- `www.digibastion.com/*`
- `digibastion.com/*`

## Checking it works

Pick a real incident: open https://www.digibastion.com/threat-intel, click any incident, and copy its URL. It looks like `/threat-intel/3f2a9c1e-...`.

```sh
# Its own title and exactly one canonical pointing at itself
curl -s https://www.digibastion.com/threat-intel/<id> | grep -E '<title>|rel="canonical"'

# Security headers (content-security-policy-report-only until CSP_REPORT_ONLY is "false")
curl -sI https://www.digibastion.com/threat-intel/<id>

# A missing incident is a real 404
curl -sI https://www.digibastion.com/threat-intel/00000000-0000-0000-0000-000000000000

# Redirects
curl -sI https://digibastion.com/about          # 301 to https://www.digibastion.com/about
curl -sI https://www.digibastion.com/news       # 301 to /threat-intel

# Feeds and sitemaps with real content types, and valid XML
curl -sI https://www.digibastion.com/feed.xml   # content-type: application/rss+xml
curl -s https://www.digibastion.com/sitemap-dynamic.xml | xmllint --noout -
```

Then paste an incident URL into a private Telegram chat and check that the preview shows the incident title and card, not the homepage. Finally, open the site in a browser with the developer console open and click through a few pages. Any `Content-Security-Policy` warnings name the blocked address; add it to the policy in both `vercel.json` and `src/plan.ts` (the test keeps them equal), redeploy, and only then set `CSP_REPORT_ONLY = "false"`.

## After it is live

These are optional follow-ups, each a small edit elsewhere in the repo:

- List `https://www.digibastion.com/sitemap-dynamic.xml` and `https://www.digibastion.com/sitemap-news.xml` in `public/robots.txt` in place of the Supabase function URLs. Do this only after the Worker is live: without it those paths return the app's HTML.
- Point the feed `<link rel="alternate">` tags in `index.html` at `/feed.xml`, `/feed.atom` and `/feed.json` for the same reason.

## Rolling back

The fastest way back is in the Cloudflare DNS page: switch `digibastion.com` and `www` to **DNS only** (grey cloud). Traffic then goes straight to Lovable at `185.158.133.1`, the same as before the move, and the Worker no longer runs. You can also delete the two routes under the Worker's **Domains & Routes**. DNS can stay on Cloudflare either way; moving nameservers back to GoDaddy is not needed.

## Developing

```sh
rtk proxy npx vitest run edge/cloudflare-worker/src/plan.test.ts
npx tsc --noEmit -p edge/cloudflare-worker/tsconfig.json
bun build edge/cloudflare-worker/src/index.ts --target=browser --outdir /tmp/worker-check
```

The Worker imports the shared page builders from `src/seo/` and `supabase/functions/_shared/` by relative path. Those modules must stay free of `@/` imports, React and `window` (see the module boundary rule in `docs/superpowers/plans/2026-10-11-seo-aeo-and-docs.md`), or the Worker will not bundle.
