// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyLinkButton, ShareBar } from '@/components/share/ShareBar';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

const URL_WITH_TAGS = 'https://www.digibastion.com/threat-intel/abc?utm_source=telegram&utm_medium=social';
const props = { url: URL_WITH_TAGS, title: 'Example Protocol exploit', text: 'Example Protocol bridge exploit on Ethereum.', campaign: 'share_incident' as const };

function setNavigator(key: 'clipboard' | 'share', value: unknown) {
  Object.defineProperty(navigator, key, { value, configurable: true, writable: true });
}

beforeEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
  vi.spyOn(window, 'open').mockImplementation(() => null);
  setNavigator('clipboard', { writeText: vi.fn().mockResolvedValue(undefined) });
  setNavigator('share', undefined);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ShareBar', () => {
  it('is a labelled nav with one labelled button per platform', () => {
    render(<ShareBar {...props} />);
    expect(screen.getByRole('navigation', { name: 'Share' })).not.toBeNull();
    for (const name of ['Share on X', 'Share on Telegram', 'Share on LinkedIn', 'Copy link']) {
      expect(screen.getByRole('button', { name })).not.toBeNull();
    }
    expect(screen.queryByRole('button', { name: 'More sharing options' })).toBeNull();
  });

  it('opens X with tagged URL and the via handle, without a referrer-leaking window', () => {
    render(<ShareBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share on X' }));
    const [url, target, features] = vi.mocked(window.open).mock.calls[0];
    expect(String(url)).toMatch(/^https:\/\/x\.com\/intent\/post\?/);
    expect(String(url)).toContain('utm_source%3Dx');
    expect(String(url)).toContain('utm_campaign%3Dshare_incident');
    expect(String(url)).not.toContain('utm_source%3Dtelegram');
    expect(String(url)).toContain('via=digibastion');
    expect(target).toBe('_blank');
    expect(features).toBe('noopener');
  });

  it('tags Telegram and LinkedIn shares with their own source', () => {
    render(<ShareBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share on Telegram' }));
    fireEvent.click(screen.getByRole('button', { name: 'Share on LinkedIn' }));
    const [telegram, linkedin] = vi.mocked(window.open).mock.calls.map(([url]) => String(url));
    expect(telegram).toMatch(/^https:\/\/t\.me\/share\/url\?url=/);
    expect(telegram).toContain('utm_source%3Dtelegram%26utm_medium%3Dsocial%26utm_campaign%3Dshare_incident');
    expect(linkedin).toContain('utm_source%3Dlinkedin');
  });

  it('copies the clean canonical URL and confirms only after the write resolves', async () => {
    render(<ShareBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Link copied'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://www.digibastion.com/threat-intel/abc');
  });

  it('shows the failure toast, not "Link copied", when the clipboard is refused', async () => {
    setNavigator('clipboard', { writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    render(<ShareBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Copy the address from your browser'));
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('uses the native share sheet with share tags and stays quiet when it is cancelled', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    setNavigator('share', share);
    render(<ShareBar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'More sharing options' }));
    await waitFor(() => expect(share).toHaveBeenCalled());
    expect(share.mock.calls[0][0].url).toBe('https://www.digibastion.com/threat-intel/abc?utm_source=share&utm_medium=share&utm_campaign=share_incident');
    await Promise.resolve();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows only X, Copy link and More in compact mode', () => {
    setNavigator('share', vi.fn().mockResolvedValue(undefined));
    render(<ShareBar {...props} compact />);
    expect(screen.getByRole('button', { name: 'Share on X' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Copy link' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'More sharing options' })).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Share on Telegram' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Share on LinkedIn' })).toBeNull();
  });
});

describe('CopyLinkButton', () => {
  it('copies the URL without tags', async () => {
    render(<CopyLinkButton url="https://www.digibastion.com/threat-intel/methodology?utm_source=x#sources" />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://www.digibastion.com/threat-intel/methodology'));
  });
});
