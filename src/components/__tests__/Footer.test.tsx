// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { Footer } from '@/components/Footer';
import { GITHUB_ROADMAP_URL } from '@/seo/siteFacts';
import { FEED_URLS } from '../../../supabase/functions/_shared/site-urls';

afterEach(cleanup);

const renderFooter = () => render(<MemoryRouter><Footer /></MemoryRouter>);
const hrefOf = (name: string | RegExp) => screen.getByRole('link', { name }).getAttribute('href');

describe('Footer', () => {
  it('links the alert channels, the methodology and the weekly reports', () => {
    renderFooter();

    expect(hrefOf('Telegram alerts')).toBe('https://t.me/digibastion');
    expect(hrefOf('How we track incidents')).toBe('/threat-intel/methodology');
    expect(hrefOf('Weekly reports')).toBe('/threat-intel/weekly');
    expect(hrefOf('Threat Intel')).toBe('/threat-intel');
    expect(hrefOf(/RSS feed/)).toBe(FEED_URLS.rss);
  });

  it('links the FAQ, the privacy page and the roadmap on GitHub', () => {
    renderFooter();

    expect(hrefOf('FAQ')).toBe('/faq');
    expect(hrefOf('Privacy')).toBe('/privacy');
    expect(hrefOf(/Public roadmap/)).toBe(GITHUB_ROADMAP_URL);
  });

  it('labels the community link so it is not confused with the alerts channel', () => {
    renderFooter();

    expect(hrefOf(/Community chat/)).toBe('https://t.me/digibastion_chat');
    expect(screen.queryByRole('link', { name: /^Community$/ })).toBeNull();
  });

  it('uses one name per thing', () => {
    renderFooter();

    expect(hrefOf('OpSec self-check')).toBe('/quiz');
    expect(hrefOf('Security guides')).toBe('/articles');
    expect(hrefOf('Security tools')).toBe('/tools');
    expect(document.body.textContent).not.toMatch(/OpSec assessment|Threat intelligence|Tools and resources/);
  });
});
