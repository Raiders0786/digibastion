import { describe, expect, it } from 'vitest';
import { isPrivateOpenType, openPixelHtml, openPixelUrl, privateOpenEvent } from './email-open';

const TID = '0f8fad5b-d9cb-469f-a165-70867728950e';

describe('newsletter open tracking', () => {
  it('covers the daily brief and the weekly deep-dive only', () => {
    expect(isPrivateOpenType('daily_brief')).toBe(true);
    expect(isPrivateOpenType('weekly_deep_dive')).toBe(true);
    for (const type of ['digest', 'critical_alert', '', null, undefined]) expect(isPrivateOpenType(type)).toBe(false);
  });

  it('builds the pixel from a tracking id and nothing else', () => {
    expect(openPixelUrl('https://x.supabase.co/functions/v1/', TID)).toBe(`https://x.supabase.co/functions/v1/email-tracking?tid=${TID}&a=o`);
    expect(openPixelUrl('https://x.supabase.co/functions/v1', 'a@b.com')).toBeNull();
    expect(openPixelHtml(openPixelUrl('https://x.supabase.co/functions/v1', TID))).toBe(
      `<img src="https://x.supabase.co/functions/v1/email-tracking?tid=${TID}&amp;a=o" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />`,
    );
    expect(openPixelHtml(null)).toBe('');
  });

  it('stores no IP, region or browser string', () => {
    const row = privateOpenEvent({ subscriptionId: 's1', trackingId: TID, emailType: 'daily_brief', at: new Date('2026-10-12T03:00:00Z'), countryCode: 'in', deviceType: 'mobile', emailClient: 'Gmail' });
    expect(row).toEqual({
      subscription_id: 's1', tracking_id: TID, event_type: 'open', email_type: 'daily_brief',
      timestamp_utc: '2026-10-12T03:00:00.000Z', country_code: 'IN', device_type: 'mobile', email_client: 'Gmail',
    });
    expect(Object.keys(row)).not.toEqual(expect.arrayContaining(['ip_hash']));
    expect(privateOpenEvent({ subscriptionId: null, trackingId: TID, emailType: 'daily_brief', at: new Date(0), countryCode: 'XX-1', deviceType: 'desktop', emailClient: 'Other' }).country_code).toBeNull();
  });
});
