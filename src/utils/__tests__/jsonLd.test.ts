import { describe, expect, it } from 'vitest';

import { serializeJsonLd } from '../jsonLd';

describe('serializeJsonLd', () => {
  it('prevents values from breaking out of a script element', () => {
    const serialized = serializeJsonLd({
      title: '</script><script>alert("xss")</script>',
      separator: '\u2028\u2029',
    });

    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(serialized).toContain('\\u003c/script\\u003e');
    expect(serialized).toContain('\\u2028\\u2029');
    expect(JSON.parse(serialized)).toEqual({
      title: '</script><script>alert("xss")</script>',
      separator: '\u2028\u2029',
    });
  });
});
