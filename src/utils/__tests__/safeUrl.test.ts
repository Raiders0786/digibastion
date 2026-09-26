import { describe, expect, it } from 'vitest';
import { safeExternalUrl } from '../safeUrl';

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
