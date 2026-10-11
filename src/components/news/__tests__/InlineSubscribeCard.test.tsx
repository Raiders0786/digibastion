// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { InlineSubscribeCard } from '@/components/news/InlineSubscribeCard';

afterEach(cleanup);

describe('InlineSubscribeCard', () => {
  it('describes Telegram and email without a severity or speed promise', () => {
    render(<MemoryRouter><InlineSubscribeCard subscribeHref="/threat-intel?tab=subscribe" /></MemoryRouter>);

    expect(screen.getByText(
      'Telegram (@digibastion) posts new Web3 incidents from QuillMonitor, plus a link to the weekly report every Monday. Email alerts follow the filters you pick.',
    )).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Telegram' }).getAttribute('href')).toBe('https://t.me/digibastion');
    expect(screen.getByRole('link', { name: 'Email alerts' }).getAttribute('href')).toBe('/threat-intel?tab=subscribe');
    expect(document.body.textContent).not.toMatch(/as they happen|high and critical/i);
  });
});
