// Facts about Digibastion that pages, the prerender, llms.txt and the FAQ
// all repeat. Change a fact here and every surface follows.
// Pure module: relative imports only, no React, no window, no data modules.
import {
  CORRECTIONS_EMAIL,
  METHODOLOGY_PATH,
  TELEGRAM_CHANNEL_HANDLE,
  TELEGRAM_CHANNEL_URL,
} from '../lib/threatIntel/officialLinks';
import type { PrerenderLink } from './routeTypes';

/** Flip to true in the same commit that confirms NEWSLETTER_POSTAL_ADDRESS is set in production. */
export const NEWSLETTERS_LIVE = true;
/** From index.html twitter:site and the quiz share text. Set to null if the account is not Digibastion's. */
export const X_HANDLE: string | null = 'digibastion';
export const GITHUB_REPO_URL = 'https://github.com/Raiders0786/digibastion';
export const GITHUB_ROADMAP_URL = `${GITHUB_REPO_URL}/blob/main/docs/ROADMAP.md`;
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;
export const VANTAGE_URL = 'https://vantage.digibastion.com';

export const SITE_DEFINITION =
  'Digibastion is a free Web3 security site. It tracks crypto hacks, exploits and phishing from QuillMonitor and other public trackers, ' +
  'links every record to its source, and sends alerts by email and on Telegram. It also has security checklists, a two-minute OpSec ' +
  'self-check and practical guides. Teams that need more can hire Digibastion for OpSec consulting or a full-stack security review, ' +
  'or try Vantage (beta) to check their domain\'s security.';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  links?: PrerenderLink[];
}

const ALERTS_LIVE =
  `Join ${TELEGRAM_CHANNEL_HANDLE} on Telegram for new incidents from QuillMonitor, or subscribe by email for real-time alerts on ` +
  'critical and high incidents (checked every 30 minutes), a daily brief or a weekly deep-dive. All are free.';
const ALERTS_NOT_LIVE =
  `Join ${TELEGRAM_CHANNEL_HANDLE} on Telegram for new Web3 incidents from QuillMonitor, or subscribe by email for alerts on ` +
  'critical and high incidents, checked every 30 minutes. The daily brief and weekly deep-dive emails start soon; the weekly ' +
  'report is already published on the site every Monday.';

/** The site's plain Q&A, in display order. Visible text and FAQPage JSON-LD both read from here. */
export function faqEntries({ newslettersLive = NEWSLETTERS_LIVE }: { newslettersLive?: boolean } = {}): FaqEntry[] {
  return [
    {
      id: 'what-is-digibastion',
      question: 'What is Digibastion?',
      answer: SITE_DEFINITION,
      links: [{ href: '/about', label: 'About Digibastion' }],
    },
    {
      id: 'what-is-threat-intel',
      question: 'What is Digibastion Threat Intel?',
      answer: 'A free feed of crypto and Web3 security incidents (hacks, exploits, phishing, supply-chain attacks) and security news. ' +
        'Each incident has one record, even when several trackers report it, and every record names and links its source.',
      links: [{ href: '/threat-intel', label: 'Open the Threat Intel feed' }],
    },
    {
      id: 'sources',
      question: 'Where do the incidents come from?',
      answer: 'QuillMonitor, checked every 30 minutes; Web3 Is Going Just Great, every 6 hours; and security news sites such as ' +
        'The Hacker News, BleepingComputer and CISA, every hour. The methodology page lists every source.',
      links: [{ href: METHODOLOGY_PATH, label: 'How we track incidents' }],
    },
    {
      id: 'verification',
      question: 'Does Digibastion verify incidents?',
      answer: 'No. Digibastion shows the status the source gives. QuillMonitor marks incidents confirmed or unconfirmed; ' +
        'the other sources do not publish a status.',
    },
    {
      id: 'alerts',
      question: 'How do I get alerts?',
      answer: newslettersLive ? ALERTS_LIVE : ALERTS_NOT_LIVE,
      links: [
        { href: TELEGRAM_CHANNEL_URL, label: `${TELEGRAM_CHANNEL_HANDLE} on Telegram` },
        { href: '/threat-intel?tab=subscribe', label: 'Email alerts' },
        { href: '/threat-intel/weekly', label: 'Weekly reports' },
      ],
    },
    {
      id: 'severity',
      question: 'How is severity set?',
      answer: 'Mostly by reported loss: $50M or more is critical and $10M or more is high. Private-key compromise, access-control ' +
        'flaws, oracle manipulation, reentrancy and flash-loan attacks are rated high even when no loss is disclosed. Any other ' +
        'disclosed loss is medium, and the rest are low. Security news uses the publisher\'s own rating.',
      links: [{ href: `${METHODOLOGY_PATH}#severity`, label: 'Severity rules' }],
    },
    {
      id: 'duplicates',
      question: 'What happens when two trackers report the same hack?',
      answer: 'Digibastion keeps one record and lists both sources. It merges only on a strong match: the same project name on ' +
        'the same day, or within two days plus one more matching fact such as the loss. It never merges records just because the ' +
        'names look alike, because a wrong merge would hide a real incident.',
    },
    {
      id: 'free',
      question: 'Is it free?',
      answer: 'Yes. The feed, alerts, checklists, self-check and guides are free and need no account. OpSec consulting and ' +
        'security reviews are paid.',
      links: [{ href: '/services', label: 'Services' }],
    },
    {
      id: 'self-check',
      question: 'What is the OpSec self-check?',
      answer: 'Eight questions drawn from 20 real scenarios. It takes about two minutes, shows where your habits are weak and what ' +
        'to fix first, and needs no wallet or account.',
      links: [{ href: '/quiz', label: 'Take the self-check' }],
    },
    {
      id: 'corrections',
      question: 'How do I report a mistake?',
      answer: `Email ${CORRECTIONS_EMAIL} with the record's link, or open an issue on GitHub. The methodology page explains how ` +
        'corrections work.',
      links: [
        { href: GITHUB_ISSUES_URL, label: 'Open a GitHub issue' },
        { href: METHODOLOGY_PATH, label: 'Methodology' },
      ],
    },
  ];
}

/** The questions the /threat-intel page answers inline. */
export const THREAT_INTEL_FAQ_IDS: readonly string[] = [
  'what-is-threat-intel',
  'sources',
  'verification',
  'alerts',
  'severity',
  'duplicates',
];

/**
 * Questions the methodology page already answers. Each answer is the exact
 * visible text of that page's paragraphs (routeMeta.test.ts checks it), so the
 * FAQPage JSON-LD never says something the page does not.
 */
export function methodologyFaqEntries(): FaqEntry[] {
  return [
    {
      id: 'verification',
      question: 'What do confirmed and unconfirmed mean?',
      answer: 'Unconfirmed means the source has reported the incident but has not verified it. The details, the date and the ' +
        'loss figure may change, and some reports are withdrawn. Confirmed means the source has marked the incident as ' +
        'verified. Digibastion shows that status as the source gives it. Items with neither label come from sources that do ' +
        'not publish a verification status.',
    },
    {
      id: 'duplicates',
      question: 'How are duplicate reports merged?',
      answer: 'Several trackers often report the same incident. We treat two reports as one incident when the project name ' +
        'matches and either the incident dates are the same day, or they are within two days of each other and the reports ' +
        'agree on the loss amount, the attack method or a reference link. A loss of zero does not count as a match. Each ' +
        'incident keeps one record, and every report we merged into it is listed as a source on that record. When sources ' +
        'disagree, QuillMonitor comes first, then the other incident trackers, then SlowMist.',
    },
    {
      id: 'dates',
      question: 'Which dates does an incident record show?',
      answer: 'Each incident shows two dates: when it happened, as the source reports it, and when we added it. When a source ' +
        'gives no usable date, the record says the date is unknown rather than guessing.',
    },
    {
      id: 'corrections',
      question: 'How do I report a mistake?',
      answer: `If something is wrong, email ${CORRECTIONS_EMAIL} with the incident link, what is wrong, and a public source for ` +
        'the correct information. We fix our own errors. When the error comes from a source, we tell that source and update ' +
        'the record when they correct it.',
    },
  ];
}
