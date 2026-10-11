// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThreatIntelAnswers } from '@/components/news/ThreatIntelAnswers';
import { faqEntries, THREAT_INTEL_FAQ_IDS } from '@/seo/siteFacts';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc } }));

afterEach(() => {
  cleanup();
  rpc.mockReset();
});

const renderAnswers = () => render(<MemoryRouter><ThreatIntelAnswers /></MemoryRouter>);

describe('ThreatIntelAnswers', () => {
  it('answers the Threat Intel questions with real headings', () => {
    rpc.mockResolvedValue({ data: [], error: null });
    renderAnswers();

    const region = screen.getByRole('region', { name: 'Questions about Threat Intel' });
    const questions = faqEntries().filter((entry) => THREAT_INTEL_FAQ_IDS.includes(entry.id)).map((entry) => entry.question);
    expect(within(region).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(questions);
    expect(within(region).getByRole('link', { name: 'All weekly reports' }).getAttribute('href')).toBe('/threat-intel/weekly');
  });

  it('links the newest weekly issue when one exists', async () => {
    rpc.mockResolvedValue({
      data: [{ week_start: '2026-10-05', issue_date: '2026-10-12', incident_count: 7, loss_usd: 18_400_000 }],
      error: null,
    });
    renderAnswers();

    const latest = await screen.findByRole('link', { name: /Latest weekly report/ });
    expect(latest.getAttribute('href')).toBe('/threat-intel/weekly/2026-10-05');
    expect(rpc).toHaveBeenCalledWith('list_weekly_newsletters', { p_limit: 1 });
  });

  it('still renders when the weekly list cannot load', () => {
    rpc.mockImplementation(() => {
      throw new Error('offline');
    });
    renderAnswers();

    expect(screen.getByRole('link', { name: 'All weekly reports' })).not.toBeNull();
    expect(screen.queryByRole('link', { name: /Latest weekly report/ })).toBeNull();
  });
});
