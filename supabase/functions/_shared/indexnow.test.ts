import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildIndexNowBody, chunkUrls, classifyIndexNowResponse, filterSubmittableUrls, indexNowResponseStatus, INDEXNOW_KEY,
  INDEXNOW_MAX_URLS_PER_RUN, isIndexNowKey, keyLocation, planIndexNowRun, resolveSince, type IndexNowRow,
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
  it('answers 200 for upstream throttling and outages, 502 for faults a person must fix', () => {
    expect(indexNowResponseStatus(['ok'])).toBe(200);
    expect(indexNowResponseStatus([])).toBe(200);
    for (const outcome of ['rate_limited', 'server_error', 'timeout', 'network_error']) expect(indexNowResponseStatus(['ok', outcome])).toBe(200);
    for (const outcome of ['key_invalid', 'bad_request', 'unprocessable', 'unexpected']) expect(indexNowResponseStatus([outcome])).toBe(502);
  });
  const UNTIL = '2026-10-11T12:00:00.000Z';
  const at = (minute: number, ms = 0) => new Date(Date.parse('2026-10-11T08:00:00.000Z') + minute * 60_000 + ms).toISOString();
  const row = (id: string, minute: number, indexable = true): IndexNowRow => ({ id, at: at(minute), indexable });
  const url = (id: string) => `https://www.digibastion.com/threat-intel/${id}`;

  it('plans weekly first, then incidents and status changes in time order, then hubs', () => {
    expect(planIndexNowRun({
      until: UNTIL,
      weeklyStarts: ['2026-10-05', 'bad'],
      fresh: [row('b', 1), row('a', 3), row('x', 4, false)],
      freshLimit: 1_000,
      statusChanges: [row('c', 2), row('a', 5), row('y', 6, false)],
      statusLimit: 1_000,
    })).toEqual({
      urls: [
        'https://www.digibastion.com/threat-intel/weekly/2026-10-05',
        url('b'), url('c'), url('a'),
        'https://www.digibastion.com/threat-intel',
        'https://www.digibastion.com/threat-intel/weekly',
      ],
      truncated: false,
      cursor: UNTIL,
    });
  });
  it('plans nothing when nothing is new, and still moves the cursor', () => {
    expect(planIndexNowRun({ until: UNTIL, weeklyStarts: [], fresh: [row('x', 1, false)], freshLimit: 1_000, statusChanges: [], statusLimit: 1_000 }))
      .toEqual({ urls: [], truncated: false, cursor: UNTIL });
  });
  it('never loses a URL between the old and the new cursor when a run is truncated', () => {
    // A full fresh page (1,000 rows, one per minute), one weekly issue and one status change.
    const fresh = Array.from({ length: INDEXNOW_MAX_URLS_PER_RUN }, (_, i) => row(`f${i}`, i));
    const plan = planIndexNowRun({
      until: UNTIL, weeklyStarts: ['2026-10-05'], fresh, freshLimit: INDEXNOW_MAX_URLS_PER_RUN,
      statusChanges: [row('s', 500)], statusLimit: 1_000,
    });
    expect(plan.truncated).toBe(true);
    expect(plan.urls.length).toBeLessThanOrEqual(INDEXNOW_MAX_URLS_PER_RUN);
    expect(plan.urls).toContain(url('s'));
    const cursor = Date.parse(plan.cursor);
    // Every row at or before the new cursor was submitted in this run...
    for (const r of [...fresh, row('s', 500)]) {
      if (Date.parse(r.at) <= cursor) expect(plan.urls).toContain(url(r.id));
    }
    // ...and the first row left out is after the cursor, so the next run reads it.
    const missing = fresh.filter((r) => !plan.urls.includes(url(r.id)));
    expect(missing.length).toBeGreaterThan(0);
    expect(Date.parse(missing[0].at)).toBeGreaterThan(cursor);
  });
  it('resumes just before the last fetched row when the fresh query hit its limit', () => {
    const plan = planIndexNowRun({
      until: UNTIL, weeklyStarts: [], fresh: [row('a', 0), row('b', 60)], freshLimit: 2, statusChanges: [], statusLimit: 1_000,
    });
    expect(plan).toEqual({ urls: [url('a'), url('b'), 'https://www.digibastion.com/threat-intel'], truncated: true, cursor: '2026-10-11T08:59:59.999Z' });
  });
  it('does not skip status changes past a full status page', () => {
    const plan = planIndexNowRun({
      until: UNTIL, weeklyStarts: [], fresh: [row('a', 0), row('b', 90)], freshLimit: 1_000,
      statusChanges: [row('s1', 10), row('s2', 30)], statusLimit: 2,
    });
    expect(plan.truncated).toBe(true);
    expect(plan.cursor).toBe(new Date(Date.parse(at(30)) - 1).toISOString());
  });
  it('steps past a timestamp when a whole page shares it, so the pinger never loops', () => {
    const same = [row('a', 60), row('b', 60)];
    expect(planIndexNowRun({ until: UNTIL, weeklyStarts: [], fresh: same, freshLimit: 2, statusChanges: [], statusLimit: 1_000 }).cursor)
      .toBe('2026-10-11T09:00:00.001Z');
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
});
