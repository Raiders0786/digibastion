

# Plan: Deep-Linkable Threat Intel Articles + Email Digest Links to Digibastion

## Problem

1. **Sharing copies generic URL**: Viewing an article keeps the URL as `/threat-intel` — sharing gives people the feed page, not the specific article.
2. **Email digest links go directly to external sources**: Subscribers click a title and leave Digibastion entirely, missing the context (summary, severity, related articles) and the original source link on our detail page.

## Solution

### 1. Make articles deep-linkable via URL search param

Use `?article=<id>` on `/threat-intel` so each article gets a unique, shareable URL like `https://www.digibastion.com/threat-intel?article=abc123`.

**Changes in `src/pages/News.tsx`:**
- On `handleArticleClick`: set `searchParams` to include `article=<id>` (alongside existing `tab` param)
- On `handleBackToNews`: remove the `article` param from URL
- On mount: read `article` param from URL → fetch that article from DB if not already loaded → set as `selectedArticle`
- The share button in `NewsDetail` will then naturally copy the correct deep-linked URL via `window.location.href`

**Changes in `src/components/news/NewsDetail.tsx`:**
- Update `handleShare` to explicitly construct the deep link URL (`https://www.digibastion.com/threat-intel?article=${article.id}`) as a fallback, ensuring the correct URL is always shared even if the browser URL hasn't updated yet

### 2. Update email digest to link through Digibastion

**Changes in `supabase/functions/send-digest-emails/index.ts`:**
- Change article title links from `article.link` (external source) to `https://www.digibastion.com/threat-intel?article=${article.id}`
- Keep a small "Read original →" text link to `article.link` below each article for users who want to go directly to the source
- Update the "View All Threats" CTA to use `www.digibastion.com` (currently missing `www.`)

### 3. Update MetaTags for shared articles

When an article is loaded via `?article=<id>`, the `MetaTags` component already receives the article title/summary. Ensure the canonical URL includes the article param so social previews show the right content.

---

## Technical Details

**Files changed:**
- `src/pages/News.tsx` — URL param sync for `article` ID, fetch-by-ID on direct navigation
- `src/components/news/NewsDetail.tsx` — Explicit deep link in share handler
- `supabase/functions/send-digest-emails/index.ts` — Article links point to Digibastion, add "original source" secondary link
- Redeploy `send-digest-emails` edge function

**No new routes needed** — the existing `/threat-intel` route handles everything via search params, consistent with the existing `?tab=` pattern.

