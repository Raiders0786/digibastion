// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ThreatIntelMethodology from '@/pages/ThreatIntelMethodology';

vi.mock('@/components/Navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/Footer', () => ({ Footer: () => null }));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));

const renderPage = () => render(
  <MemoryRouter initialEntries={['/threat-intel/methodology']}>
    <ThreatIntelMethodology />
  </MemoryRouter>,
);

afterEach(cleanup);

describe('ThreatIntelMethodology', () => {
  it('covers every methodology section', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'How we track security incidents' })).not.toBeNull();
    for (const heading of [
      'Sources',
      'Severity',
      'Confirmed and unconfirmed',
      'How duplicates are merged',
      'Dates',
      'Alerts and newsletters',
      'Corrections',
      'Official channels',
      'References',
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: heading })).not.toBeNull();
    }
  });

  it('states the source list, the SlowMist status and the severity thresholds', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'QuillMonitor' })).not.toBeNull();
    expect(screen.getByText('Pending permission')).not.toBeNull();
    expect(screen.getByText(/The Hacker News, BleepingComputer, SecurityWeek/)).not.toBeNull();
    expect(screen.getByText('Reported loss of $50M or more.')).not.toBeNull();
    expect(screen.getByText('Reported loss from $10M up to $50M.')).not.toBeNull();
    expect(screen.getByText('Reported loss from $1M up to $10M.')).not.toBeNull();
    expect(screen.getByText('No loss disclosed and none of the attack types above.')).not.toBeNull();
  });

  it('lists the severity rules in the order the code checks them', () => {
    renderPage();

    // The rubric is the first definition list on the page.
    const rubric = document.querySelector('dl');
    const rows = Array.from(rubric?.querySelectorAll(':scope > div') ?? []).map((row) => [
      row.querySelector('dt')?.textContent,
      row.querySelector('dd')?.textContent,
    ]);
    expect(rows).toEqual([
      ['Critical', 'Reported loss of $50M or more.'],
      ['High', 'Reported loss from $10M up to $50M.'],
      [
        'High',
        'Loss under $10M or not disclosed, when the attack is a private-key compromise, an access-control flaw, oracle manipulation, reentrancy or a flash-loan attack.',
      ],
      ['Medium', 'Reported loss from $1M up to $10M.'],
      ['Medium', 'Any other disclosed loss under $1M.'],
      ['Low', 'No loss disclosed and none of the attack types above.'],
    ]);
  });

  it('lists the corrections address, the official channels and the anti-impersonation note', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'support@digibastion.com' }).getAttribute('href'))
      .toBe('mailto:support@digibastion.com');
    expect(screen.getByRole('link', { name: 't.me/digibastion' }).getAttribute('href')).toBe('https://t.me/digibastion');
    expect(screen.getByText('alerts@digibastion.com')).not.toBeNull();
    expect(screen.getByText(/never ask you to connect a wallet/)).not.toBeNull();
    expect(screen.getByRole('link', { name: 'RSS' }).getAttribute('href')).toContain('threat-intel-feed?format=rss');
    expect(screen.getByRole('link', { name: 'Atom' }).getAttribute('href')).toContain('threat-intel-feed?format=atom');
    expect(screen.getByRole('link', { name: 'JSON Feed' }).getAttribute('href')).toContain('threat-intel-feed?format=json');
  });

  it('links the reference sources', () => {
    renderPage();

    expect(screen.getByRole('link', { name: 'SEAL 911' }).getAttribute('href')).toBe('https://securityalliance.org/seal-911');
    expect(screen.getByRole('link', { name: 'OWASP Smart Contract Top 10' }).getAttribute('href'))
      .toBe('https://owasp.org/www-project-smart-contract-top-10/');
    expect(screen.getByRole('link', { name: 'CISA Known Exploited Vulnerabilities catalog' }).getAttribute('href'))
      .toBe('https://www.cisa.gov/known-exploited-vulnerabilities-catalog');
    expect(screen.getByRole('link', { name: 'ScamSniffer' }).getAttribute('href')).toBe('https://drops.scamsniffer.io/');
  });
});

describe('ThreatIntelMethodology alerts section', () => {
  it('describes alerts, Telegram and the weekly report without a severity claim for Telegram', () => {
    renderPage();

    const section = screen.getByRole('region', { name: 'Alerts and newsletters' });
    expect(section.textContent).toMatch(/Email alerts go out every 30 minutes for new critical and high incidents/);
    expect(section.textContent).toMatch(/posts new incidents from QuillMonitor, plus a link to the weekly report every Monday/);
    expect(section.textContent).toMatch(/The daily brief and the weekly deep-dive email go out at the hour each subscriber picks\./);
    expect(section.textContent).not.toMatch(/start soon/);
    expect(section.textContent).not.toMatch(/high and critical/);
  });
});
