// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThreatIntelMethodology from '@/pages/ThreatIntelMethodology';
import { articlesMeta } from '@/data/articlesData';
import { initialSecurityData } from '@/data/securityData';
import { toolCategories } from '@/data/tools/categories';
import { weeklyPublicContent } from '../../../supabase/functions/_shared/weekly-test-fixtures';
import {
  brandedTitle,
  categoryRouteMeta,
  guideRouteMeta,
  NOINDEX_PATHS,
  SITE_FALLBACK_META,
  STATIC_ROUTES,
  staticRouteMeta,
  toMetaTagsProps,
  toolsRouteMeta,
  weeklyRouteMeta,
} from '../routeMeta';
import { faqEntries, methodologyFaqEntries, THREAT_INTEL_FAQ_IDS } from '../siteFacts';

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));
afterEach(cleanup);

const appRoutes = [...readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf8').matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]);
const toolCount = toolCategories.reduce((n, c) => n + c.tools.length, 0);

describe('route registry', () => {
  it('covers every static route in App.tsx or marks it noindex', () => {
    expect(appRoutes.length).toBeGreaterThan(10);
    for (const path of appRoutes.filter((p) => !p.includes(':') && p !== '*')) {
      expect(path in STATIC_ROUTES || NOINDEX_PATHS.includes(path) || path === '/tools', path).toBe(true);
    }
  });

  it('keeps titles within 60 and descriptions within 160 characters', () => {
    const all = [...Object.values(STATIC_ROUTES), toolsRouteMeta(27),
      ...initialSecurityData.map(categoryRouteMeta), ...articlesMeta.map((a) => guideRouteMeta(a))];
    for (const meta of all) {
      expect(meta.title.length, meta.title).toBeLessThanOrEqual(60);
      expect(meta.description.length, meta.path).toBeLessThanOrEqual(160);
      expect(meta.description.length, meta.path).toBeGreaterThanOrEqual(50);
      expect(meta.canonical).toBe(`https://www.digibastion.com${meta.path === '/' ? '/' : meta.path}`);
      // Brand spelling is case-sensitive; the rest is not.
      expect(`${meta.title} ${meta.description}`).not.toContain('DigiBastion');
      expect(meta.title).not.toMatch(/Security Security|real-time/i);
      expect(meta.description).not.toMatch(/real-time|as they happen|vetted/i);
      expect(meta.robots).toBe('index');
      expect(meta.image.startsWith('https://www.digibastion.com/')).toBe(true);
    }
  });

  it('keeps the brand only when the whole title fits, and never cuts a title to make room for it', () => {
    expect(brandedTitle('OpSec Checklist')).toBe('OpSec Checklist | Digibastion');
    const fiftyFive = 'Alpha Finance/Cream Finance: Flash Loan Attack ($37.5M)';
    expect(brandedTitle(fiftyFive)).toBe(fiftyFive);
    const long = '2FA for Crypto Accounts: Passkeys, Security Keys and Authenticator Apps Compared';
    const cut = brandedTitle(long);
    expect(cut.length).toBeLessThanOrEqual(60);
    expect(cut).not.toContain('Digibastion');
    expect(cut.endsWith('…')).toBe(true);
  });

  it('gives the fallback shell no canonical', () => {
    expect(SITE_FALLBACK_META.canonical).toBeNull();
  });

  it('derives the tools count from data', () => {
    expect(toolsRouteMeta(toolCount).description.startsWith(`${toolCount} Web3 security tools`)).toBe(true);
  });

  it('never promises newsletters before they send', () => {
    expect(faqEntries({ newslettersLive: false }).find((e) => e.id === 'alerts')!.answer).toMatch(/start soon/);
    expect(JSON.stringify(faqEntries())).not.toMatch(/verified by digibastion|high and critical incidents on telegram/i);
    for (const id of THREAT_INTEL_FAQ_IDS) {
      expect(faqEntries().some((entry) => entry.id === id), id).toBe(true);
    }
  });

  it('keeps noindex paths out of the registry', () => {
    for (const path of NOINDEX_PATHS) expect(path in STATIC_ROUTES, path).toBe(false);
    expect(Object.keys(STATIC_ROUTES)).toEqual(expect.arrayContaining(['/', '/faq', '/threat-intel/weekly', '/threat-intel/methodology']));
  });

  it('throws on an unknown static path', () => {
    expect(() => staticRouteMeta('/nope')).toThrow(/route/i);
  });

  it('titles checklists without doubling "Security"', () => {
    const titles = Object.fromEntries(initialSecurityData.map((c) => [c.id, categoryRouteMeta(c).title]));
    expect(titles.wallet).toBe('Crypto Wallet Security Checklist | Digibastion');
    expect(titles.os).toBe('OS Hardening Checklist | Digibastion');
    expect(titles.opsec).toBe('OpSec Checklist | Digibastion');
    expect(titles.authentication).toBe('Authentication Security Checklist | Digibastion');
  });

  it('links each checklist to the other ten when given the full list', () => {
    const metas = initialSecurityData.map(categoryRouteMeta);
    const wallet = metas.find((m) => m.path === '/category/wallet')!;
    const checklistLinks = wallet.body.links.filter((l) => l.href.startsWith('/category/') && l.href !== '/category/opsec');
    expect(checklistLinks.map((l) => l.href)).not.toContain('/category/wallet');
    expect(wallet.body.links.map((l) => l.href)).toContain('/category/defi');
    expect(wallet.jsonLd.some((node) => (node as { '@type'?: string })['@type'] === 'ItemList')).toBe(true);
  });

  it('describes guides from their data and links three neighbours', () => {
    const guide = articlesMeta[0];
    const related = articlesMeta.filter((a) => a.category === guide.category && a.slug !== guide.slug);
    const meta = guideRouteMeta(guide, '<p>Body</p>', articlesMeta);
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(meta.type).toBe('article');
    expect(meta.lastmod).toBe(guide.modifiedAt.slice(0, 10));
    expect(meta.body.html).toBe('<p>Body</p>');
    expect(meta.body.links[0]).toEqual({ href: '/articles', label: 'All security guides' });
    const guideLinks = meta.body.links.filter((l) => l.href.startsWith('/articles/'));
    expect(guideLinks).toHaveLength(Math.min(3, related.length));
    expect(guideLinks.map((l) => l.href)).not.toContain(`/articles/${guide.slug}`);
  });

  it('builds weekly meta with the numbers in the title and a Report schema', () => {
    const meta = weeklyRouteMeta(weeklyPublicContent(), '2026-10-12T00:10:00Z');
    expect(meta.path).toBe('/threat-intel/weekly/2026-10-05');
    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.title).toContain('~$12.3M across 9 incidents');
    expect(meta.robots).toBe('index');
    expect(meta.publishedTime).toBe('2026-10-12T00:10:00Z');
    expect(JSON.stringify(meta.jsonLd)).toContain('"@type":"Report"');
    expect(JSON.stringify(meta)).not.toContain('utm_');
  });

  it('turns a registry entry into MetaTags props', () => {
    const props = toMetaTagsProps(staticRouteMeta('/about'));
    expect(props).toMatchObject({ title: STATIC_ROUTES['/about'].title, canonical: 'https://www.digibastion.com/about', robots: 'index', type: 'website' });
    expect(toMetaTagsProps(SITE_FALLBACK_META).canonical).toBeUndefined();
  });

  it('ends every static body with the shared site links', () => {
    for (const meta of Object.values(STATIC_ROUTES)) {
      const hrefs = meta.body.links.map((l) => l.href);
      for (const href of ['/threat-intel', '/threat-intel/weekly', '/articles', '/faq', 'https://t.me/digibastion']) {
        if (href !== meta.path) expect(hrefs, meta.path).toContain(href);
      }
      expect(new Set(hrefs).size, meta.path).toBe(hrefs.length);
    }
  });
});

describe('methodology FAQ schema', () => {
  it('only states what the methodology page shows', () => {
    const { container } = render(createElement(MemoryRouter, null, createElement(ThreatIntelMethodology)));
    const visible = (container.textContent ?? '').replace(/\s+/g, ' ');
    for (const entry of methodologyFaqEntries()) {
      // Each answer is one or more whole paragraphs from the page.
      for (const sentence of entry.answer.split(/(?<=\.) (?=[A-Z])/)) {
        expect(visible, entry.id).toContain(sentence);
      }
    }
    const schema = JSON.stringify(staticRouteMeta('/threat-intel/methodology').jsonLd);
    expect(schema).toContain('"@type":"FAQPage"');
  });
});
