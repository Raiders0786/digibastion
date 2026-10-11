// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VerifyEmail, { manageLinkPath } from '@/pages/VerifyEmail';

const invoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invoke(...args) } },
}));
vi.mock('@/components/MetaTags', () => ({ MetaTags: () => null }));

afterEach(cleanup);

describe('manageLinkPath', () => {
  it('keeps the path and query of the absolute management link', () => {
    expect(manageLinkPath('https://www.digibastion.com/manage-subscription?email=a%40b.com&token=t'))
      .toBe('/manage-subscription?email=a%40b.com&token=t');
  });
  it('falls back to the management page', () => {
    expect(manageLinkPath(undefined)).toBe('/manage-subscription');
    expect(manageLinkPath('not a url')).toBe('/manage-subscription');
  });
});

describe('VerifyEmail success state', () => {
  it('links preferences in place and offers Telegram and the weekly report', async () => {
    invoke.mockResolvedValue({
      data: { success: true, message: 'Verified', email: 'a@b.com', manageUrl: 'https://www.digibastion.com/manage-subscription?email=a%40b.com&token=t' },
      error: null,
    });
    render(
      <MemoryRouter initialEntries={['/verify-email?token=abc']}>
        <Routes><Route path="/verify-email" element={<VerifyEmail />} /></Routes>
      </MemoryRouter>,
    );

    const manage = await screen.findByRole('link', { name: 'Manage Preferences' });
    expect(manage.getAttribute('href')).toBe('/manage-subscription?email=a%40b.com&token=t');
    expect(screen.getByRole('link', { name: /Join @digibastion on Telegram/ }).getAttribute('href')).toBe('https://t.me/digibastion');
    expect(screen.getByRole('link', { name: /latest weekly report/ }).getAttribute('href')).toBe('/threat-intel/weekly');
  });
});
