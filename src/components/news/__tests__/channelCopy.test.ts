import { describe, expect, it } from 'vitest';
import {
  emailChannelCopy,
  REALTIME_ALERTS_HINT,
  TELEGRAM_AND_EMAIL_SUMMARY,
  TELEGRAM_CHANNEL_SUMMARY,
} from '@/lib/threatIntel/channelCopy';

describe('channel copy', () => {
  it('describes Telegram in words that hold at any TELEGRAM_MIN_SEVERITY', () => {
    expect(TELEGRAM_AND_EMAIL_SUMMARY).toBe(
      'Telegram (@digibastion) posts new Web3 incidents from QuillMonitor, plus a link to the weekly report every Monday. Email alerts follow the filters you pick.',
    );
    for (const text of [TELEGRAM_CHANNEL_SUMMARY, TELEGRAM_AND_EMAIL_SUMMARY]) {
      expect(text).not.toMatch(/high and critical|critical and high|each new/i);
      expect(text).not.toMatch(/real-time|instantly|as they happen/i);
    }
  });

  it('gives the real-time hint the 30-minute schedule', () => {
    expect(REALTIME_ALERTS_HINT).toBe('Critical and high incidents, checked every 30 minutes');
  });

  it('marks the daily brief and weekly deep-dive as starting soon until newsletters launch', () => {
    const labels = emailChannelCopy(false).map((channel) => channel.label);
    expect(labels).toEqual(['Real-time alerts', 'Daily brief (starting soon)', 'Weekly deep-dive (starting soon)']);
    const hints = emailChannelCopy(false).map((channel) => channel.hint);
    expect(hints[0]).toBe(REALTIME_ALERTS_HINT);
    expect(hints[1]).toMatch(/once the newsletter launches/);
    expect(hints[2]).toMatch(/once the newsletter launches/);
  });

  it('drops the "starting soon" note once newsletters are live', () => {
    const channels = emailChannelCopy(true);
    expect(channels.map((channel) => channel.label)).toEqual(['Real-time alerts', 'Daily brief', 'Weekly deep-dive (Mondays)']);
    expect(channels.map((channel) => channel.hint).join(' ')).not.toMatch(/soon|launches/);
  });
});
