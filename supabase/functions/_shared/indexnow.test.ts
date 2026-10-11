import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildIndexNowBody, chunkUrls, classifyIndexNowResponse, filterSubmittableUrls, INDEXNOW_KEY,
  INDEXNOW_MAX_URLS_PER_RUN, isIndexNowKey, keyLocation, nextCursor, planIndexNowUrls, resolveSince,
} from './indexnow';

describe('indexnow', () => {
  it('has a valid key served from public/', () => {
    expect(INDEXNOW_KEY).toMatch(/^[a-f0-9]{32}$/);
    expect(readFileSync(resolve(process.cwd(), `public/${INDEXNOW_KEY}.txt`), 'utf8')).toBe(`${INDEXNOW_KEY}\n`);
    expect(keyLocation()).toBe(`https://www.digibastion.com/${INDEXNOW_KEY}.txt`);
    expect(isIndexNowKey(INDEXNOW_KEY)).toBe(true);
    expect(isIndexNowKey('short')).toBe(false);
    expect(isIndexNowKey(undefined)).toBe(false);
  });
  it('submits only canonical URLs on our host, once each, without tags', () => {
    expect(filterSubmittableUrls([
      'https://www.digibastion.com/threat-intel/a?utm_source=telegram',
      'https://www.digibastion.com/threat-intel/a',
      'https://www.digibastion.com/threat-intel/a/',
      'https://digibastion.com/threat-intel/b',
      'http://www.digibastion.com/threat-intel/c',
      'https://www.digibastion.com.evil.test/x',
      '/threat-intel/relative',
      'https://evil.test/x',
    ])).toEqual(['https://www.digibastion.com/threat-intel/a']);
  });
  it('builds the protocol body', () => {
    expect(buildIndexNowBody(['https://www.digibastion.com/a'])).toEqual({
      host: 'www.digibastion.com', key: INDEXNOW_KEY, keyLocation: keyLocation(), urlList: ['https://www.digibastion.com/a'],
    });
  });
  it('chunks at 10,000', () => {
    expect(chunkUrls(Array.from({ length: 10_001 }, (_, i) => `u${i}`)).map((c) => c.length)).toEqual([10_000, 1]);
    expect(chunkUrls([])).toEqual([]);
  });
  it.each([[200, 'ok'], [202, 'ok'], [400, 'bad_request'], [403, 'key_invalid'], [422, 'unprocessable'], [429, 'rate_limited'], [503, 'server_error'], [302, 'unexpected']])(
    'classifies %i as %s', (status, outcome) => expect(classifyIndexNowResponse(status)).toBe(outcome));
  it('plans weekly first, then incidents, then hubs, capped', () => {
    expect(planIndexNowUrls({ incidentIds: ['b', 'a'], statusChangedIds: ['a', 'c'], weeklyStarts: ['2026-10-05'] })).toEqual([
      'https://www.digibastion.com/threat-intel/weekly/2026-10-05',
      'https://www.digibastion.com/threat-intel/b',
      'https://www.digibastion.com/threat-intel/a',
      'https://www.digibastion.com/threat-intel/c',
      'https://www.digibastion.com/threat-intel',
      'https://www.digibastion.com/threat-intel/weekly',
    ]);
    expect(planIndexNowUrls({ incidentIds: [], statusChangedIds: [], weeklyStarts: [] })).toEqual([]);
    expect(planIndexNowUrls({ incidentIds: [], statusChangedIds: [], weeklyStarts: ['bad'] })).toEqual([]);
    const many = Array.from({ length: 2_000 }, (_, i) => `id${i}`);
    const planned = planIndexNowUrls({ incidentIds: many, statusChangedIds: [], weeklyStarts: [] });
    expect(planned.length).toBe(INDEXNOW_MAX_URLS_PER_RUN);
    expect(planned[planned.length - 1]).toBe('https://www.digibastion.com/threat-intel');
  });
  it('resumes from the last successful cursor, within 7 days', () => {
    const now = new Date('2026-10-11T12:00:00Z');
    expect(resolveSince(null, now)).toBe('2026-10-11T10:00:00.000Z');
    expect(resolveSince({ attempted_at: '2026-10-11T11:22:00Z', metadata: { cursor: '2026-10-11T11:21:00.000Z' } }, now)).toBe('2026-10-11T11:21:00.000Z');
    expect(resolveSince({ attempted_at: '2026-10-11T11:22:00Z', metadata: {} }, now)).toBe('2026-10-11T11:22:00.000Z');
    expect(resolveSince({ attempted_at: '2026-09-01T00:00:00Z', metadata: {} }, now)).toBe('2026-10-04T12:00:00.000Z');
    expect(resolveSince({ attempted_at: 'bad', metadata: { cursor: 'also bad' } }, now)).toBe('2026-10-04T12:00:00.000Z');
    // A cursor in the future (clock skew) never skips rows.
    expect(resolveSince({ attempted_at: '2026-10-11T11:22:00Z', metadata: { cursor: '2026-10-12T00:00:00Z' } }, now)).toBe('2026-10-11T12:00:00.000Z');
  });
  it('moves the cursor to until, or back to the boundary row when truncated', () => {
    expect(nextCursor({ until: '2026-10-11T12:00:00.000Z', truncated: false, firstIncludedCreatedAt: null, lastIncludedCreatedAt: null }))
      .toBe('2026-10-11T12:00:00.000Z');
    // Truncated: resume just before the last row so rows sharing its timestamp are not skipped.
    expect(nextCursor({ until: '2026-10-11T12:00:00.000Z', truncated: true,
      firstIncludedCreatedAt: '2026-10-11T08:00:00.000Z', lastIncludedCreatedAt: '2026-10-11T09:00:00.000Z' }))
      .toBe('2026-10-11T08:59:59.999Z');
    // A whole page with one timestamp: step past it so the pinger never loops on the same rows.
    expect(nextCursor({ until: '2026-10-11T12:00:00.000Z', truncated: true,
      firstIncludedCreatedAt: '2026-10-11T09:00:00.000Z', lastIncludedCreatedAt: '2026-10-11T09:00:00.000Z' }))
      .toBe('2026-10-11T09:00:00.001Z');
    expect(nextCursor({ until: '2026-10-11T12:00:00.000Z', truncated: true, firstIncludedCreatedAt: null, lastIncludedCreatedAt: 'bad' }))
      .toBe('2026-10-11T12:00:00.000Z');
  });
});
