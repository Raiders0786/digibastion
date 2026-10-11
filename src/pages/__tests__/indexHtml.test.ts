import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE_DEFINITION } from '@/seo/siteFacts';

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'public/site.webmanifest'), 'utf8')) as { description: string };

const jsonLdBlocks = (): Record<string, unknown>[] =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));

describe('index.html fallback copy', () => {
  it('describes the Organization with the site definition and no stray taglines', () => {
    const organization = jsonLdBlocks().find((block) => block['@type'] === 'Organization');
    expect(organization?.description).toBe(SITE_DEFINITION);
    for (const block of jsonLdBlocks()) expect(block).not.toHaveProperty('alternateName');
  });

  it('gives non-JS readers the definition and plain links', () => {
    const noscript = /<noscript>([\s\S]*?)<\/noscript>/.exec(html)?.[1] ?? '';
    expect(noscript.replace(/&#39;/g, "'")).toContain(SITE_DEFINITION);
    for (const href of ['/threat-intel', '/threat-intel/methodology', '/articles', '/quiz', '/faq', '/about', 'https://t.me/digibastion']) {
      expect(noscript).toContain(`href="${href}"`);
    }
  });

  it('drops stale claims from the shell and the manifest', () => {
    expect(html).not.toMatch(/Community-built|community-built|real-time|DigiBastion/);
    expect(manifest.description).toBe('Free Web3 security help: crypto hack alerts, security checklists and guides.');
  });
});
