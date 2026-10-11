// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Privacy from '@/pages/Privacy';
import { staticRouteMeta } from '@/seo/routeMeta';

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));

afterEach(cleanup);

describe('Privacy page', () => {
  it('is registered with an indexable canonical', () => {
    const meta = staticRouteMeta('/privacy');
    expect(meta.canonical).toBe('https://www.digibastion.com/privacy');
    expect(meta.robots).toBe('index');
    expect(meta.description.length).toBeLessThanOrEqual(160);
  });

  it('dates the statement and covers each feature that stores data', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>);

    expect(screen.getByText(/^Last updated: /)).not.toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy at Digibastion' })).not.toBeNull();
    for (const heading of [
      'Email subscriptions',
      'What our emails record',
      'Unsubscribing and deletion',
      'OpSec self-check and leaderboard',
      'What stays in your browser',
      'Contact form',
      'Services we use',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).not.toBeNull();
    }
    expect(screen.getByText(/one-way hash of your IP address/)).not.toBeNull();
    expect(screen.getAllByRole('link', { name: 'support@digibastion.com' })[0].getAttribute('href'))
      .toBe('mailto:support@digibastion.com');
  });
});
