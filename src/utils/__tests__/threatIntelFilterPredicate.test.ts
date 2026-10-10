import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// search_news_articles, count_news_articles and threat_intel_stats each repeat
// the same WHERE clause, marked THREAT_INTEL_FILTER_PREDICATE. If one copy
// drifts, the list, the page count and the stat tiles disagree.
const MIGRATIONS = [
  'supabase/migrations/20261011090000_threat_intel_stats.sql',
  'supabase/migrations/20261012090000_threat_intel_incident_filters.sql',
];
const MARKER = /^\s*-- THREAT_INTEL_FILTER_PREDICATE \(keep identical/;

/** Each marked WHERE clause, without comments and with whitespace collapsed. */
function extractPredicates(sql: string): string[] {
  const lines = sql.split('\n');
  const blocks: string[] = [];
  for (let index = 0; index < lines.length; index++) {
    if (!MARKER.test(lines[index])) continue;
    const block: string[] = [];
    for (let cursor = index + 1; cursor < lines.length; cursor++) {
      const line = lines[cursor].replace(/--.*$/, '');
      // search ends at its ORDER BY; count and stats end at the statement's semicolon.
      if (/^\s*ORDER BY\b/i.test(line)) break;
      const end = line.indexOf(';');
      if (end >= 0) {
        block.push(line.slice(0, end));
        break;
      }
      block.push(line);
    }
    blocks.push(block.join(' ').replace(/\s+/g, ' ').trim());
  }
  return blocks;
}

describe('THREAT_INTEL_FILTER_PREDICATE', () => {
  it.each(MIGRATIONS)('is identical in search, count and stats in %s', (path) => {
    const blocks = extractPredicates(readFileSync(resolve(process.cwd(), path), 'utf8'));
    expect(blocks).toHaveLength(3);
    expect(blocks[0].startsWith('WHERE ')).toBe(true);
    expect(blocks[1]).toBe(blocks[0]);
    expect(blocks[2]).toBe(blocks[0]);
  });

  it('notices a copy that drifts', () => {
    const block = '  -- THREAT_INTEL_FILTER_PREDICATE (keep identical in search/count/stats)\n  WHERE a = 1\n    AND b = 2';
    const sql = [
      `${block}\n  ORDER BY x;`,
      `${block};`,
      block.replace('b = 2', 'b = 3') + ';',
    ].join('\n');
    const blocks = extractPredicates(sql);
    expect(blocks).toEqual(['WHERE a = 1 AND b = 2', 'WHERE a = 1 AND b = 2', 'WHERE a = 1 AND b = 3']);
  });
});
