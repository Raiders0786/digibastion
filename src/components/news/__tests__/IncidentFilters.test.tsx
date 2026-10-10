// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IncidentFilters, type IncidentFilterState } from '@/components/news/IncidentFilters';
import type { ThreatIntelFacets } from '@/lib/threatIntel/query';

const facets: ThreatIntelFacets = {
  chains: [
    { value: 'ethereum', label: 'Ethereum', count: 42 },
    { value: 'bsc', label: 'BSC', count: 7 },
  ],
  attackTypes: [{ value: 'phishing', label: 'Phishing', count: 9 }],
};

const noFilters: IncidentFilterState = { verification: 'all', chains: [], attackTypes: [], sources: [] };

const renderFilters = (overrides: Partial<Parameters<typeof IncidentFilters>[0]> = {}) => {
  const handlers = {
    onVerificationChange: vi.fn(),
    onChainToggle: vi.fn(),
    onAttackTypeToggle: vi.fn(),
    onSourceToggle: vi.fn(),
  };
  render(
    <IncidentFilters
      scope="web3-incidents"
      filters={noFilters}
      facets={facets}
      idPrefix="test"
      {...handlers}
      {...overrides}
    />,
  );
  return handlers;
};

describe('IncidentFilters', () => {
  afterEach(cleanup);

  it('shows status, chain, attack type and source in the Web3 incidents view', () => {
    renderFilters({ filters: { ...noFilters, verification: 'confirmed', chains: ['ethereum'] } });

    const status = screen.getByRole('group', { name: 'Status' });
    expect(within(status).getByRole('button', { name: 'Confirmed' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(status).getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('false');
    expect(status.getAttribute('aria-describedby')).toBe('test-status-help');
    expect(screen.getByText('As reported by QuillMonitor. Other sources do not report a status.')).not.toBeNull();

    const chain = screen.getByRole('group', { name: 'Chain' });
    expect(within(chain).getByRole('button', { name: 'Ethereum' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(chain).getByRole('button', { name: 'BSC' }).getAttribute('title')).toBe('7 in the last 90 days');
    expect(within(screen.getByRole('group', { name: 'Attack type' })).getByRole('button', { name: 'Phishing' })).not.toBeNull();

    const source = screen.getByRole('group', { name: 'Source' });
    expect(within(source).getAllByRole('button').map((button) => button.textContent))
      .toEqual(['QuillMonitor', 'Web3 Is Going Just Great', 'SlowMist Hacked']);
  });

  it('reports the value the user picked', () => {
    const handlers = renderFilters();

    fireEvent.click(screen.getByRole('button', { name: 'Unconfirmed' }));
    fireEvent.click(screen.getByRole('button', { name: 'BSC' }));
    fireEvent.click(screen.getByRole('button', { name: 'Phishing' }));
    fireEvent.click(screen.getByRole('button', { name: 'SlowMist Hacked' }));

    expect(handlers.onVerificationChange).toHaveBeenCalledWith('unconfirmed');
    expect(handlers.onChainToggle).toHaveBeenCalledWith('bsc');
    expect(handlers.onAttackTypeToggle).toHaveBeenCalledWith('phishing');
    expect(handlers.onSourceToggle).toHaveBeenCalledWith('slowmist');
  });

  it('keeps a selected chain that is not in the top list, so it can be removed', () => {
    renderFilters({ filters: { ...noFilters, chains: ['sui'] } });

    const chip = within(screen.getByRole('group', { name: 'Chain' })).getByRole('button', { name: 'sui' });
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    expect(chip.getAttribute('title')).toBeNull();
  });

  it('hides chain and attack type when there are no options and nothing is selected', () => {
    renderFilters({ facets: { chains: [], attackTypes: [] } });

    expect(screen.queryByRole('group', { name: 'Chain' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Attack type' })).toBeNull();
    expect(screen.getByRole('group', { name: 'Status' })).not.toBeNull();
  });

  it('shows only the source filter in the all-news view, including publisher feeds', () => {
    renderFilters({ scope: 'all' });

    expect(screen.queryByRole('group', { name: 'Status' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Chain' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Attack type' })).toBeNull();
    expect(within(screen.getByRole('group', { name: 'Source' })).getByRole('button', { name: 'News publishers' })).not.toBeNull();
  });
});
