export interface FeedFetchTimestamp {
  last_fetched_at: string | null;
}

export interface FeedFreshnessSummary {
  activeFeedCount: number;
  checkedFeedCount: number;
  pipelineCheckedAt: Date | null;
  pipelineIsStale: boolean;
}

export const FEED_PIPELINE_STALE_AFTER_MS = 2.5 * 60 * 60 * 1000;

/**
 * Treat the oldest successful timestamp as the completion time of the latest
 * full source pass. One stuck provider therefore cannot be hidden by another
 * provider that fetched recently.
 */
export function summarizeFeedFreshness(
  feeds: FeedFetchTimestamp[],
  now = new Date(),
): FeedFreshnessSummary {
  const timestamps = feeds
    .map((feed) => feed.last_fetched_at ? new Date(feed.last_fetched_at).getTime() : Number.NaN)
    .filter(Number.isFinite);

  const oldestSuccessfulFetch = timestamps.length > 0 ? Math.min(...timestamps) : null;
  const pipelineCheckedAt = oldestSuccessfulFetch === null ? null : new Date(oldestSuccessfulFetch);
  const fullPassCompleted = feeds.length > 0 && timestamps.length === feeds.length;
  const pipelineIsStale = !fullPassCompleted
    || pipelineCheckedAt === null
    || now.getTime() - pipelineCheckedAt.getTime() > FEED_PIPELINE_STALE_AFTER_MS;

  return {
    activeFeedCount: feeds.length,
    checkedFeedCount: timestamps.length,
    pipelineCheckedAt,
    pipelineIsStale,
  };
}
