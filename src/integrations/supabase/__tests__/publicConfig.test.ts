import { describe, expect, it } from 'vitest';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../publicConfig';

describe('public Supabase configuration', () => {
  it('provides valid browser configuration when build-time variables are absent', () => {
    expect(new URL(SUPABASE_URL).protocol).toBe('https:');
    expect(SUPABASE_URL).toContain('.supabase.co');
    expect(SUPABASE_PUBLISHABLE_KEY.split('.')).toHaveLength(3);
  });
});
