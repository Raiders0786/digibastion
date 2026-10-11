// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openExternalUrl, safeExternalUrl } from '../safeUrl';

describe('safeExternalUrl', () => {
  it('accepts HTTP and HTTPS links', () => {
    expect(safeExternalUrl('https://example.com/path')).toBe('https://example.com/path');
    expect(safeExternalUrl('http://localhost:8080/test')).toBe('http://localhost:8080/test');
  });

  it('rejects active and malformed schemes', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(safeExternalUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(safeExternalUrl('//example.com')).toBeNull();
    expect(safeExternalUrl('not a url')).toBeNull();
  });
});

describe('openExternalUrl', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens a new tab with noopener only, so the source sees the site as referrer', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(openExternalUrl('https://www.quillaudits.com/web3-hacks-database')).toBe(true);
    expect(open).toHaveBeenCalledWith('https://www.quillaudits.com/web3-hacks-database', '_blank', 'noopener');
  });

  it('refuses unsafe URLs', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(openExternalUrl('javascript:alert(1)')).toBe(false);
    expect(open).not.toHaveBeenCalled();
  });
});
