# Complete Google Search Console setup

## Changes
- Update the existing static sitemap so every page and image URL uses the published `https://digibastion.lovable.app` origin.
- Update the existing robots sitemap reference and sitemap index to the same published origin.
- Preserve existing page-specific `lastmod` values and the current sitemap mechanism.

## Verification
- Publish the corrected files.
- Confirm the Google verification tag and same-origin sitemap are publicly reachable.
- Verify the URL-prefix property with Google, add it to Search Console, list verified properties again, and submit `https://digibastion.lovable.app/sitemap.xml`.
- Mark the SEO finding fixed only after Google accepts verification and sitemap submission.
