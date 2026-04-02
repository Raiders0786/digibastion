import { describe, it, expect } from 'vitest';
import { sanitizeText } from '../sanitize';

describe('sanitizeText', () => {
  it('returns empty string for null/undefined', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText('')).toBe('');
  });

  it('passes through already-clean text', () => {
    expect(sanitizeText('Hello world')).toBe('Hello world');
  });

  it('strips simple HTML tags', () => {
    expect(sanitizeText('<p>Hello</p>')).toBe('Hello');
    expect(sanitizeText('<em>italic</em>')).toBe('italic');
    expect(sanitizeText('<strong>bold</strong>')).toBe('bold');
  });

  it('strips nested HTML tags', () => {
    expect(sanitizeText('<p><em>text</em></p>')).toBe('text');
    expect(sanitizeText('<div><p><strong>deep</strong></p></div>')).toBe('deep');
  });

  it('strips anchor tags and keeps text', () => {
    expect(sanitizeText('<a href="https://example.com">click here</a>')).toBe('click here');
  });

  it('strips br tags', () => {
    expect(sanitizeText('line1<br>line2')).toBe('line1line2');
    expect(sanitizeText('line1<br/>line2')).toBe('line1line2');
  });

  it('decodes single-encoded HTML entities', () => {
    expect(sanitizeText('&lt;p&gt;Hello&lt;/p&gt;')).toBe('Hello');
    expect(sanitizeText('&amp; more')).toBe('& more');
    expect(sanitizeText('&quot;quoted&quot;')).toBe('"quoted"');
  });

  it('decodes double-encoded HTML entities', () => {
    // &amp;lt;p&amp;gt; → &lt;p&gt; → <p> → stripped
    expect(sanitizeText('&amp;lt;p&amp;gt;Hello&amp;lt;/p&amp;gt;')).toBe('Hello');
  });

  it('decodes numeric entities', () => {
    expect(sanitizeText('&#8217;')).toBe('\u2019'); // right single quotation mark
    expect(sanitizeText('&#x2019;')).toBe('\u2019');
  });

  it('decodes named entities like mdash, rsquo', () => {
    expect(sanitizeText('hello&mdash;world')).toBe('hello—world');
    expect(sanitizeText('it&rsquo;s')).toBe('it\u2019s');
  });

  it('collapses whitespace', () => {
    expect(sanitizeText('  hello   world  ')).toBe('hello world');
    expect(sanitizeText('hello\n\n\tworld')).toBe('hello world');
  });

  it('handles mixed CDATA-style content from Cisco/Debian feeds', () => {
    const input = '&lt;div&gt;&lt;p&gt;A vulnerability in Cisco&lt;/p&gt;&lt;/div&gt;';
    const result = sanitizeText(input);
    expect(result).toBe('A vulnerability in Cisco');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('handles complex real-world RSS content', () => {
    const input = '<p><em>Admin</em></p><br><a href="https://example.com">Read more</a>';
    const result = sanitizeText(input);
    expect(result).toBe('Admin Read more');
    expect(result).not.toContain('<');
  });
});
