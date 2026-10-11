// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Navbar } from '@/components/Navbar';
import { initialSecurityData } from '@/data/securityData';

vi.mock('@/components/ThemeToggle', () => ({ ThemeToggle: () => null }));

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(cleanup);

const renderNavbar = (path = '/about') => render(<MemoryRouter initialEntries={[path]}><Navbar /></MemoryRouter>);

describe('Navbar', () => {
  it('renders the desktop items as crawlable links', () => {
    renderNavbar();
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });

    expect(within(nav).getByRole('link', { name: /^Digibastion/ }).getAttribute('href')).toBe('/');
    expect(within(nav).getByRole('link', { name: 'Threat Intel' }).getAttribute('href')).toBe('/threat-intel');
    expect(within(nav).getByRole('link', { name: 'Guides' }).getAttribute('href')).toBe('/articles');
    expect(within(nav).getByRole('link', { name: 'Services' }).getAttribute('href')).toBe('/services');
    expect(within(nav).getByRole('link', { name: 'Get alerts' }).getAttribute('href')).toBe('/threat-intel?tab=subscribe');
  });

  it('keeps buttons only for menus, never for page navigation', () => {
    renderNavbar();
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' });

    const buttonNames = within(nav).queryAllByRole('button').map((button) => button.textContent?.trim() || button.getAttribute('aria-label'));
    expect(buttonNames.sort()).toEqual(['Open navigation menu', 'Products'].sort());
  });

  it('lists every checklist in the mobile menu by its data title, as links', () => {
    renderNavbar();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const sheet = screen.getByRole('dialog');

    for (const category of initialSecurityData) {
      const link = within(sheet).getByRole('link', { name: new RegExp(category.title.replace(/[()]/g, '\\$&')) });
      expect(link.getAttribute('href')).toBe(`/category/${category.id}`);
    }
    expect(within(sheet).getByRole('link', { name: /OpSec self-check/ }).getAttribute('href')).toBe('/quiz');
    expect(within(sheet).getByRole('link', { name: /Threat Intel/ }).getAttribute('href')).toBe('/threat-intel');
    expect(within(sheet).getByRole('link', { name: /FAQ/ }).getAttribute('href')).toBe('/faq');
    expect(within(sheet).queryAllByRole('button').map((button) => button.getAttribute('aria-label') ?? button.textContent?.trim()))
      .toEqual(['Close']);
  });

  it('labels Vantage as beta, not live', () => {
    renderNavbar();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));

    expect(screen.getAllByText('Beta').length).toBeGreaterThan(0);
    expect(screen.queryByText('Live')).toBeNull();
  });
});

vi.mock('@/hooks/useMobileNotifications', () => ({
  useMobileNotifications: () => ({ alertCount: 0, hasNewQuiz: false, markAlertsRead: vi.fn(), markQuizVisited: vi.fn() }),
}));

describe('MobileBottomNav', () => {
  it('renders the bottom bar as links with one name per page', async () => {
    const { MobileBottomNav } = await import('@/components/MobileBottomNav');
    render(<MemoryRouter><MobileBottomNav /></MemoryRouter>);

    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Quiz' }).getAttribute('href')).toBe('/quiz');
    expect(screen.getByRole('link', { name: 'Threat Intel' }).getAttribute('href')).toBe('/threat-intel');
    expect(screen.getByRole('link', { name: 'Vantage' }).getAttribute('href')).toBe('https://vantage.digibastion.com');
    expect(screen.queryByText('Threats')).toBeNull();
  });
});
