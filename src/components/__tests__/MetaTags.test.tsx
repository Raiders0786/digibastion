// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MetaTags } from '../MetaTags';
import { SITE_FALLBACK_META } from '@/seo/routeMeta';

const renderAt = (path: string, element: JSX.Element) => render(
  <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>,
);

const canonicals = () => Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="canonical"]'));
const meta = (selector: string) => document.head.querySelector<HTMLMetaElement>(selector)?.content;

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});
afterEach(cleanup);

describe('MetaTags', () => {
  it('builds the canonical from the path without query strings', () => {
    renderAt('/threat-intel/abc?utm_source=telegram', <MetaTags />);
    expect(canonicals().map((link) => link.href)).toEqual(['https://www.digibastion.com/threat-intel/abc']);
    expect(meta('meta[property="og:url"]')).toBe('https://www.digibastion.com/threat-intel/abc');
  });

  it('strips tracking from an explicit canonical too', () => {
    renderAt('/x', <MetaTags canonical="https://www.digibastion.com/threat-intel/abc/?utm_source=x#top" />);
    expect(canonicals()[0].href).toBe('https://www.digibastion.com/threat-intel/abc');
  });

  it('updates an existing canonical instead of adding a second one', () => {
    const existing = document.createElement('link');
    existing.rel = 'canonical';
    existing.href = 'https://www.digibastion.com/';
    document.head.appendChild(existing);
    renderAt('/about', <MetaTags />);
    expect(canonicals()).toHaveLength(1);
    expect(canonicals()[0].href).toBe('https://www.digibastion.com/about');
  });

  it('writes the robots directive', () => {
    renderAt('/threat-intel/rss-1', <MetaTags robots="noindex,follow" />);
    expect(meta('meta[name="robots"]')).toBe('noindex, follow');
  });

  it('keeps the legacy noindex prop working', () => {
    renderAt('/unsubscribe', <MetaTags noindex />);
    expect(meta('meta[name="robots"]')).toBe('noindex, nofollow');
  });

  it('defaults to the fallback title and description', () => {
    renderAt('/', <MetaTags />);
    expect(document.title).toBe(SITE_FALLBACK_META.title);
    expect(meta('meta[name="description"]')).toBe(SITE_FALLBACK_META.description);
    expect(meta('meta[name="robots"]')).toMatch(/^index, follow/);
    expect(canonicals()[0].href).toBe('https://www.digibastion.com/');
  });
});
