// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import About from '@/pages/About';
import { SITE_DEFINITION } from '@/seo/siteFacts';

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));

afterEach(cleanup);

const renderAbout = () => render(<MemoryRouter><About /></MemoryRouter>);

describe('About page', () => {
  it('puts the definition paragraph right under the heading', () => {
    renderAbout();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.nextElementSibling?.textContent).toBe(SITE_DEFINITION);
    expect(document.body.textContent).not.toMatch(/connective tissue/);
  });

  it('says where the Threat Intel alerts go', () => {
    renderAbout();

    expect(screen.getByText(
      'Follow sourced Web3 incidents on the site, on Telegram (@digibastion) or by email, and read the weekly report every Monday.',
    )).not.toBeNull();
  });

  it('answers five common questions and links the full FAQ', () => {
    renderAbout();

    const qa = screen.getByRole('region', { name: 'Common questions' });
    expect(within(qa).getAllByRole('heading', { level: 3 })).toHaveLength(5);
    expect(within(qa).getByRole('heading', { name: 'Does Digibastion verify incidents?' })).not.toBeNull();
    expect(within(qa).getByRole('link', { name: 'All questions and answers' }).getAttribute('href')).toBe('/faq');
  });
});
