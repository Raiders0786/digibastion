

# Plan: Fix HTML Sanitization in Article Content

## Problem

Article content/summaries contain raw HTML tags (`<p>`, `<em>`, `<br>`, `<a href=...>`, `<div>`, `<strong>`, `&nbsp;`) because of a processing order bug. Many RSS feeds (especially Cisco, Debian) double-encode HTML entities in their descriptions — e.g. `&lt;p&gt;` — which the current pipeline decodes *after* stripping tags, leaving raw HTML in the final text.

**35 out of 1978 articles** currently have dirty content. All new articles from these feeds will also be dirty.

## Root Cause

In `fetch-rss-news/index.ts`, the `stripHtml` function strips HTML tags first, then `decodeHtmlEntities` runs. But when feeds double-encode (e.g. `&lt;p&gt;`), the strip step sees no real tags, then the decode step reveals them.

## Solution

### 1. Fix the sanitization pipeline in `fetch-rss-news` edge function

Rewrite `stripHtml` to loop: decode entities → strip tags → repeat until stable. This handles any level of encoding. Also decode `&nbsp;` → space, and strip common boilerplate.

```text
function stripHtml(html):
  prev = ""
  text = html
  while text != prev:
    prev = text
    text = decodeHtmlEntities(text)  // decode first
    text = text.replace(/<[^>]*>/g, '')  // then strip tags
  collapse whitespace, trim
```

### 2. Add a client-side safety net in `useNewsArticles.ts`

Add a lightweight `sanitizeText` function that strips any residual HTML from `title`, `summary`, and `content` when mapping DB rows to `NewsArticle` objects. This catches dirty data already in the DB without needing a migration.

### 3. Clean existing dirty data via SQL update

Run a database migration to clean the 35 affected articles by stripping HTML tags from `content` and `summary` fields using PostgreSQL's `regexp_replace`.

### 4. Redeploy the edge function

Deploy updated `fetch-rss-news` so all future ingestions produce clean text.

---

## Technical Details

**Files changed:**
- `supabase/functions/fetch-rss-news/index.ts` — Fix `stripHtml` to loop decode→strip until stable
- `src/hooks/useNewsArticles.ts` — Add client-side sanitize fallback on article mapping
- Database migration — Clean existing dirty rows

