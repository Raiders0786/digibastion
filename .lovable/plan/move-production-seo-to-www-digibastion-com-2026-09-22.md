# Move production SEO to www.digibastion.com

## Outcome
Make `https://www.digibastion.com` the single public and search-engine authority while preserving the root-domain and Lovable-address redirects.

## Changes
1. Wait for both custom domains to finish verification and HTTPS setup. Keep `www.digibastion.com` as primary and `digibastion.com` redirecting to it.
2. Replace remaining `digibastion.lovable.app` sitemap and robots references with `https://www.digibastion.com` while preserving page paths and existing update dates.
3. Audit canonical, social sharing, structured-data, and generated public URL references so they consistently use the `www` domain.
4. Publish the pending accessibility fixes and domain SEO changes together.
5. Verify the live redirects, homepage metadata, robots file, sitemap index, and sitemap from the public domain.
6. In Google Search Console, list verified properties first. Verify or add the exact `https://www.digibastion.com/` URL-prefix property if needed, then submit `https://www.digibastion.com/sitemap.xml`.
7. Confirm Search Console submission status and report any indexing delay separately from configuration errors.

## Technical notes
- Preserve existing email DNS records at GoDaddy.
- Do not change page content or indexing rules.
- Keep the existing Lovable-site Search Console property; the new `www` property becomes the production property.
- Do not attempt Google verification until the custom domain serves the published root page with its verification tag.
