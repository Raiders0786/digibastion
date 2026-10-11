import { describe, expect, it } from 'vitest';
import { CLASSIFICATION_RELEVANCE_POSTGREST_FILTER, WEB3_INCIDENT_POSTGREST_FILTER } from '@/utils/newsIncident';
import { isPublishable } from '@/lib/threatIntel/articleRow';
import * as shared from '../../../supabase/functions/_shared/publishable';

describe('shared publishable filters match the SPA', () => {
  it('uses identical PostgREST strings', () => {
    expect(shared.PUBLISHABLE_POSTGREST_FILTER).toBe(CLASSIFICATION_RELEVANCE_POSTGREST_FILTER);
    expect(shared.WEB3_INCIDENT_POSTGREST_FILTER).toBe(WEB3_INCIDENT_POSTGREST_FILTER);
  });
  it.each([
    {},
    { duplicate_of_uid: 'x' },
    { duplicate_of_uid: '' },
    { duplicate_of_uid: null },
    { classification_relevant: false },
    { classification_relevant: 'false' },
    { classification_relevant: true },
    null,
    [],
  ])('agrees with isPublishable for %j', (metadata) => {
    expect(shared.isPublishableMetadata(metadata)).toBe(isPublishable(metadata));
  });
});
