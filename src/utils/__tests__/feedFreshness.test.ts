import { describe, expect, it } from 'vitest';
import { summarizeFeedFreshness } from '../feedFreshness';

describe('summarizeFeedFreshness', () => {
  const now = new Date('2026-09-27T06:30:00.000Z');

  it('uses the oldest provider timestamp as the last complete source pass', () => {
    const result = summarizeFeedFreshness([
      { last_fetched_at: '2026-09-27T06:15:11.000Z' },
      { last_fetched_at: '2026-09-27T06:15:03.000Z' },
    ], now);

    expect(result).toMatchObject({
      activeFeedCount: 2,
      checkedFeedCount: 2,
      pipelineIsStale: false,
    });
    expect(result.pipelineCheckedAt?.toISOString()).toBe('2026-09-27T06:15:03.000Z');
  });

  it('marks the pipeline stale when any active source has never completed', () => {
    expect(summarizeFeedFreshness([
      { last_fetched_at: '2026-09-27T06:15:03.000Z' },
      { last_fetched_at: null },
    ], now)).toMatchObject({
      activeFeedCount: 2,
      checkedFeedCount: 1,
      pipelineIsStale: true,
    });
  });

  it('marks a complete pass stale after the expected polling window', () => {
    expect(summarizeFeedFreshness([
      { last_fetched_at: '2026-09-27T03:00:00.000Z' },
    ], now).pipelineIsStale).toBe(true);
  });
});
