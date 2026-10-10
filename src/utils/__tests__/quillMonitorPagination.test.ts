import { describe, expect, it } from 'vitest';
import { resolveQuillMonitorMaxPages } from '../../../supabase/functions/_shared/quillmonitor';

describe('resolveQuillMonitorMaxPages', () => {
  it('allows 100 pages by default for a full sync', () => {
    expect(resolveQuillMonitorMaxPages('full')).toBe(100);
  });

  it('keeps the 20-page default for incremental (auto) syncs', () => {
    expect(resolveQuillMonitorMaxPages('auto')).toBe(20);
  });

  it('uses an explicit max_pages in either mode', () => {
    expect(resolveQuillMonitorMaxPages('full', 30)).toBe(30);
    expect(resolveQuillMonitorMaxPages('auto', 50)).toBe(50);
  });
});
