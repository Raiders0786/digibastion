

# Plan: Fix HTML Entity Rendering + Integrate New Security Feeds + Improve Categorization

## Problem Summary
1. **HTML entities not decoded**: Titles/summaries contain raw `&#8217;`, `&#8211;`, `&#8216;` etc. because `stripHtml()` only handles 5 basic entities
2. **Summaries contain boilerplate**: "The post ... appeared first on SecurityWeek" cruft in summaries
3. **New feeds need integration**: 15+ vendor-specific feeds (Oracle, AWS, Google Cloud, Linux distros, NVD, Microsoft, Cisco, Fortinet) with varying XML structures
4. **Atom `<link>` parsing broken**: Atom feeds use `<link href="..." />` (self-closing with attribute), but the parser only extracts inner text content
5. **Category tagging too coarse**: The `categoryMap` defaults almost everything to `web3-security` — vendor advisories (Cisco, Microsoft, etc.) should map to `vulnerability-disclosure`, cloud feeds to a sensible category, not web3

## Technical Details

### Step 1: Fix HTML Entity Decoding (edge function + migration for existing data)

**File**: `supabase/functions/fetch-rss-news/index.ts`

Replace the `stripHtml` function with a comprehensive HTML entity decoder:
- Decode all numeric entities (`&#8217;` → `'`, `&#8211;` → `–`, etc.)
- Decode all hex entities (`&#x2019;` → `'`)
- Decode all named entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`, `&nbsp;`, `&mdash;`, `&ndash;`, `&lsquo;`, `&rsquo;`, `&ldquo;`, `&rdquo;`, `&hellip;`)
- Strip HTML tags
- Strip boilerplate patterns like "The post ... appeared first on ..."

Also add a summary cleaner that removes the "appeared first on XYZ" RSS boilerplate.

**Migration**: Run an UPDATE on existing `news_articles` to fix stored entities in title and summary columns.

### Step 2: Fix Atom Feed Link Parsing

**File**: `supabase/functions/fetch-rss-news/index.ts`

The `<link>` tag in Atom feeds is self-closing with an `href` attribute: `<link rel="alternate" href="https://..." />`. The current parser only extracts inner text, returning empty string for Atom links.

Add Atom-aware link extraction:
```
// Extract href from <link> attributes for Atom feeds
const linkHrefMatch = xml.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
  || xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']alternate["']/i)
  || xml.match(/<link[^>]*href=["']([^"']+)["']/i);
```

### Step 3: Add New RSS Feeds to Database

**Migration**: Insert ~15 new feeds into `rss_feeds` with appropriate categories. Skip any duplicates (check URL uniqueness).

Feeds to add with their categories:
- `vulnerabilityspoileralert.com/feed.xml` → `vulnerability-disclosure`
- `blogs.oracle.com/security/feed` → `vulnerability-disclosure`
- `aws.amazon.com/security/security-bulletins/rss/feed/` → `vulnerability-disclosure`
- `cloud.google.com/feeds/google-cloud-security-bulletins.xml` → `vulnerability-disclosure`
- `cloud.google.com/feeds/gke-security-bulletins.xml` → `vulnerability-disclosure`
- `security.access.redhat.com/data/meta/v1/rhsa.rss` → `vulnerability-disclosure`
- `ubuntu.com/security/notices/rss.xml` → `vulnerability-disclosure` (skip the Atom duplicate)
- `debian.org/security/dsa` → `vulnerability-disclosure`
- `nvd.nist.gov/.../nvd-rss-analyzed.xml` → `vulnerability-disclosure` (skip the duplicate `nvd-rss.xml`)
- `api.msrc.microsoft.com/update-guide/rss` → `vulnerability-disclosure`
- `sec.cloudapps.cisco.com/.../CiscoSecurityAdvisory.xml` → `vulnerability-disclosure` (skip CSAF and Event Response duplicates)
- `filestore.fortinet.com/fortiguard/rss/ir.xml` → `vulnerability-disclosure` (skip endpoint vuln duplicate)

Deduplication logic: Only add one feed per vendor to avoid noise (e.g., skip Ubuntu Atom since RSS exists, skip Cisco CSAF since Advisory exists, skip NVD recent since analyzed exists, skip Fortinet endpoint since ir.xml exists).

### Step 4: Add New Security Keywords

**Migration**: Insert keywords for vendor-specific content so articles from these feeds pass the relevance filter:
- `advisory`, `security bulletin`, `security notice`, `RHSA`, `DSA`, `MSRC`, `fortiguard`, `cisco advisory` → category `vulnerability`, weight 3
- `cloud security`, `aws`, `gke`, `google cloud` → category `vulnerability`, weight 2

### Step 5: Improve Category Mapping Logic

**File**: `supabase/functions/fetch-rss-news/index.ts`

The current `categoryMap` has problems:
- `breach`, `malware`, `attack` all map to `web3-security` even when they're generic cybersec
- No mappings for `cloud`, `infrastructure`, `advisory` categories

Updated mapping with source-awareness:
- If the feed's own `category` field is `vulnerability-disclosure`, use that as a strong signal
- Add new keyword categories and map them: `cloud` → `vulnerability-disclosure`, `infrastructure` → `vulnerability-disclosure`
- Keep `web3` → `web3-security` only when web3-specific keywords match
- Default fallback should be `vulnerability-disclosure` for vendor advisory feeds, not `web3-security`

The fix: pass `feed.category` into `isRelevant()` and use it as the default category when no strong keyword category dominates. This way Oracle/Cisco/AWS articles don't get tagged as "Web3 Security".

### Step 6: Fix Existing Mis-categorized Articles

**Migration**: Update articles from known non-web3 sources that were incorrectly tagged:
```sql
UPDATE news_articles 
SET category = 'vulnerability-disclosure' 
WHERE source_name IN ('SecurityWeek', 'BleepingComputer', 'The Hacker News', ...) 
  AND category = 'web3-security'
  AND NOT (title ILIKE '%defi%' OR title ILIKE '%wallet%' OR title ILIKE '%blockchain%' ...);
```

---

## Implementation Order
1. Fix `stripHtml` + add summary cleaner in edge function
2. Fix Atom link parsing in edge function
3. Improve category mapping logic with feed-category awareness
4. Migration: insert new feeds + keywords
5. Migration: fix HTML entities in existing articles
6. Migration: re-categorize mis-tagged articles

**Files changed**: 1 edge function, 1-2 migrations. No frontend changes needed since the fix is at the data layer.

