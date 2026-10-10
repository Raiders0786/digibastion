// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertsPanel, type AlertsPanelProps } from '@/components/news/AlertsPanel';
import type { NewsArticle } from '@/types/news';

const unconfirmedCritical: NewsArticle = {
  id: 'quillmonitor:ledger',
  title: 'Ledger: Security incident ($86M loss)',
  summary: 'Summary pending',
  content: '',
  category: 'web3-security',
  tags: [],
  severity: 'critical',
  publishedAt: new Date('2026-10-08T00:00:00.000Z'),
  sourceName: 'QuillMonitor',
  metadata: {
    provider: 'quillmonitor',
    is_web3_incident: true,
    verification_status: 'unverified',
    incident_date: '2026-10-08',
    attribution_url: 'https://www.quillaudits.com/web3-hacks-database',
  },
};

const highNews: NewsArticle = {
  id: 'rss-1',
  title: 'Vendor patches VPN flaw',
  summary: 'Fixes are out for a flaw attackers are using.',
  content: '',
  category: 'vulnerability-disclosure',
  tags: [],
  severity: 'high',
  publishedAt: new Date('2026-10-07T10:00:00.000Z'),
  sourceName: 'BleepingComputer',
};

const makeProps = (overrides: Partial<AlertsPanelProps> = {}): AlertsPanelProps => ({
  alerts: [unconfirmedCritical, highNews],
  loading: false,
  error: null,
  autoRefreshInterval: 0,
  onAutoRefreshIntervalChange: vi.fn(),
  onRefresh: vi.fn(),
  onSelectAlert: vi.fn(),
  onNavigateHome: vi.fn(),
  onNavigateFeed: vi.fn(),
  ...overrides,
});

afterEach(cleanup);

describe('AlertsPanel', () => {
  it('groups alerts by severity and labels unconfirmed incidents', () => {
    const props = makeProps();
    render(<AlertsPanel {...props} />);

    expect(screen.getByText('Critical Alerts (1)')).not.toBeNull();
    expect(screen.getByText('High Priority Alerts (1)')).not.toBeNull();
    expect(screen.getByText('Exploited Oct 8, 2026')).not.toBeNull();
    expect(screen.queryByText('Action Required')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /^Unconfirmed/ }));
    expect(props.onSelectAlert).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: unconfirmedCritical.title }));
    expect(props.onSelectAlert).toHaveBeenCalledWith(unconfirmedCritical);
  });

  it('shows totals across every page when the page passes them', () => {
    render(<AlertsPanel {...makeProps({ criticalCount: 12, highCount: 30 })} />);

    expect(screen.getByText('Critical Alerts (12)')).not.toBeNull();
    expect(screen.getByText('High Priority Alerts (30)')).not.toBeNull();
  });

  it('shows a skeleton instead of the empty state during the first load', () => {
    render(<AlertsPanel {...makeProps({ alerts: [], loading: true })} />);

    expect(screen.getByTestId('alerts-loading')).not.toBeNull();
    expect(screen.queryByText('No alerts available')).toBeNull();
  });

  it('reports a load error and retries', () => {
    const props = makeProps({ alerts: [], error: 'Active alerts could not be loaded.' });
    render(<AlertsPanel {...props} />);

    expect(screen.getByText('Active alerts could not be loaded.')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('navigates through the breadcrumb', () => {
    const props = makeProps();
    render(<AlertsPanel {...props} />);

    fireEvent.click(screen.getByRole('button', { name: 'Home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Threat Intel' }));
    expect(props.onNavigateHome).toHaveBeenCalledTimes(1);
    expect(props.onNavigateFeed).toHaveBeenCalledTimes(1);
  });
});
