import { describe, expect, it } from 'vitest';
import {
  isPendingSummary,
  truncateAtWord,
  withSummaryOrigin,
} from '../../../supabase/functions/_shared/summary-text';

describe('truncateAtWord', () => {
  it('returns text within the limit unchanged', () => {
    expect(truncateAtWord('Short excerpt.', 500)).toBe('Short excerpt.');
    expect(truncateAtWord('x'.repeat(500), 500)).toBe('x'.repeat(500));
  });

  it('cuts at the last word boundary and adds an ellipsis', () => {
    expect(truncateAtWord('The quick brown fox jumps', 12)).toBe('The quick…');
    expect(truncateAtWord('The quick brown fox jumps', 16)).toBe('The quick brown…');
  });

  it('never cuts mid-word and never exceeds the limit', () => {
    const text = 'Attackers drained the bridge after compromising a multisig signer key. '.repeat(20);
    const result = truncateAtWord(text, 500);
    expect(result.length).toBeLessThanOrEqual(500);
    expect(result.endsWith('…')).toBe(true);
    const head = result.slice(0, -1);
    expect(text.startsWith(head)).toBe(true);
    // The character after the kept text ends a word.
    expect(text[head.length]).toMatch(/[\s.,;:]/);
  });

  it('drops trailing punctuation before the ellipsis', () => {
    expect(truncateAtWord('Funds were stolen, and the team paused deposits', 20)).toBe('Funds were stolen…');
  });

  it('does not split a surrogate pair at the cut', () => {
    const result = truncateAtWord(`${'a'.repeat(9)}😀${'b'.repeat(20)}`, 11);
    expect(result).toBe(`${'a'.repeat(9)}😀…`);
    expect(result).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });

  it('hard-cuts a single long token instead of returning almost nothing', () => {
    const result = truncateAtWord(`See https://example.com/${'a'.repeat(80)}`, 40);
    expect(result).toHaveLength(40);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('isPendingSummary', () => {
  it('treats empty, missing and placeholder summaries as pending', () => {
    expect(isPendingSummary(null)).toBe(true);
    expect(isPendingSummary('')).toBe(true);
    expect(isPendingSummary('   ')).toBe(true);
    expect(isPendingSummary('Summary pending')).toBe(true);
    expect(isPendingSummary('An attacker drained $3.8M.')).toBe(false);
  });
});

describe('withSummaryOrigin', () => {
  it('merges summary_origin into existing metadata', () => {
    expect(withSummaryOrigin({ provider: 'quillmonitor', summary_origin: 'provider' }, 'ai'))
      .toEqual({ provider: 'quillmonitor', summary_origin: 'ai' });
    expect(withSummaryOrigin(null, 'publisher')).toEqual({ summary_origin: 'publisher' });
  });
});
