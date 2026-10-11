// What each alert channel promises, written once so every subscribe surface
// says the same thing. Every sentence must stay true at any
// TELEGRAM_MIN_SEVERITY and while NEWSLETTERS_LIVE is false.
import { NEWSLETTERS_LIVE } from '../../seo/siteFacts';
import { TELEGRAM_CHANNEL_HANDLE } from './officialLinks';

/** post-telegram-alerts posts QuillMonitor records only; post-weekly-telegram adds the Monday link. */
export const TELEGRAM_CHANNEL_SUMMARY =
  `Telegram (${TELEGRAM_CHANNEL_HANDLE}) posts new Web3 incidents from QuillMonitor, plus a link to the weekly report every Monday.`;

export const TELEGRAM_AND_EMAIL_SUMMARY = `${TELEGRAM_CHANNEL_SUMMARY} Email alerts follow the filters you pick.`;

/** send-critical-alerts runs at :25 and :55 and sends critical and high records only. */
export const REALTIME_ALERTS_HINT = 'Critical and high incidents, checked every 30 minutes';

export type EmailChannelKey = 'realtime' | 'daily' | 'weekly';

export interface EmailChannelCopy {
  key: EmailChannelKey;
  label: string;
  hint: string;
}

/** Labels and hints for the three email types, in display order. */
export function emailChannelCopy(newslettersLive: boolean = NEWSLETTERS_LIVE): EmailChannelCopy[] {
  if (newslettersLive) {
    return [
      { key: 'realtime', label: 'Real-time alerts', hint: REALTIME_ALERTS_HINT },
      { key: 'daily', label: 'Daily brief', hint: 'One email a day at your chosen time' },
      { key: 'weekly', label: 'Weekly deep-dive (Mondays)', hint: 'Losses, trends and the top incidents of the week' },
    ];
  }
  return [
    { key: 'realtime', label: 'Real-time alerts', hint: REALTIME_ALERTS_HINT },
    {
      key: 'daily',
      label: 'Daily brief (starting soon)',
      hint: 'One email a day at your chosen time, once the newsletter launches',
    },
    {
      key: 'weekly',
      label: 'Weekly deep-dive (starting soon)',
      hint: 'Every Monday, once the newsletter launches. The weekly report is already on the site.',
    },
  ];
}
