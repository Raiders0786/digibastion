// Preview cards (1200x630 SVG) for incident pages, weekly pages and quiz
// results. The og-image function turns them into PNGs. Every interpolated
// value goes through xmlText, and the status words are the source's own.
// Pure module: no Deno or URL imports.
import { sourceCredit } from './share-links.ts';
import { formatLossReported, type NewsletterItem, type WeeklyPublicContent } from './newsletter-content.ts';
import { xmlText } from './xml.ts';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const TITLE_CHARS = 34;
const TITLE_LINES = 3;
const FONT = 'Arial, Helvetica, sans-serif';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const chars = (value: string) => Array.from(value);
const clip = (value: string, max: number) => (chars(value).length > max ? `${chars(value).slice(0, max - 1).join('').trimEnd()}…` : value);

/** Greedy word wrap in code points; the last line ends with "…" when text is left over. */
export function wrapTitle(text: string, maxChars = TITLE_CHARS, maxLines = TITLE_LINES): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
    .flatMap((word) => {
      const letters = chars(word);
      if (letters.length <= maxChars) return [word];
      const pieces: string[] = [];
      for (let i = 0; i < letters.length; i += maxChars) pieces.push(letters.slice(i, i + maxChars).join(''));
      return pieces;
    });
  const lines: string[] = [];
  let current = '';
  let index = 0;
  for (; index < words.length; index++) {
    const next = current ? `${current} ${words[index]}` : words[index];
    if (chars(next).length <= maxChars) {
      current = next;
      continue;
    }
    lines.push(current);
    current = words[index];
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) {
    lines.push(current);
    index = words.length;
  }
  if (index < words.length) {
    const last = lines[maxLines - 1] ?? '';
    lines[maxLines - 1] = chars(last).length + 1 <= maxChars
      ? `${last}…`
      : `${chars(last).slice(0, maxChars - 1).join('').trimEnd()}…`;
  }
  return lines.slice(0, maxLines);
}

const text = (x: number, y: number, size: number, fill: string, value: string, extra = '') =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" fill="${fill}"${extra}>${xmlText(value)}</text>`;

function frame(inner: string, accent: string): string {
  return `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#0b1120"/>` +
    `<rect x="40" y="40" width="1120" height="550" rx="20" fill="#111827" stroke="#374151" stroke-width="1"/>` +
    `<rect x="40" y="40" width="1120" height="6" fill="${accent}"/>` +
    inner +
    text(1120, 560, 22, '#9ca3af', 'www.digibastion.com', ' text-anchor="end" font-weight="700"') +
    '</svg>';
}

export interface IncidentCardInput {
  title: string;
  /** "~$4.2M reported lost" or "Loss not disclosed". */
  lossLabel: string;
  chain: string | null;
  attackType: string | null;
  sourceLabel: string;
  status: 'confirmed' | 'unconfirmed' | null;
  poweredByQuillMonitor: boolean;
}

export function renderIncidentCardSvg(i: IncidentCardInput): string {
  const statusPill = i.status === 'confirmed'
    ? { label: `CONFIRMED BY ${i.sourceLabel.toUpperCase()}`, color: '#22c55e' }
    : i.status === 'unconfirmed'
      ? { label: 'UNCONFIRMED REPORT', color: '#f59e0b' }
      : null;
  const titleLines = wrapTitle(i.title);
  const titleSvg = titleLines.map((line, index) =>
    text(80, 215 + index * 62, 52, '#f9fafb', line, ' font-weight="800" data-line="title"')).join('');
  const afterTitle = 215 + (titleLines.length - 1) * 62;
  const facts = [i.chain, i.attackType].map((value) => value?.trim()).filter(Boolean).join(' · ');
  const source = [`Source: ${clip(i.sourceLabel, 50)}`, i.poweredByQuillMonitor ? 'Powered by QuillMonitor' : '']
    .filter(Boolean).join('  ·  ');

  return frame(
    text(80, 105, 22, '#a78bfa', 'DIGIBASTION THREAT INTEL', ' font-weight="700" letter-spacing="2"') +
    (statusPill ? text(1120, 105, 20, statusPill.color, clip(statusPill.label, 44), ' font-weight="700" text-anchor="end"') : '') +
    titleSvg +
    text(80, afterTitle + 80, 40, i.lossLabel.startsWith('~') ? '#f87171' : '#d1d5db', clip(i.lossLabel, 40), ' font-weight="700"') +
    (facts ? text(80, afterTitle + 130, 28, '#d1d5db', clip(facts, 60)) : '') +
    text(80, 560, 22, '#9ca3af', clip(source, 70)),
    statusPill?.color ?? '#8b5cf6',
  );
}

/** Card fields from a stored or freshly mapped incident. */
export function incidentCardInput(item: NewsletterItem): IncidentCardInput {
  const credit = sourceCredit(item);
  const loss = formatLossReported(item.amountUsd);
  return {
    title: item.title || 'Security incident',
    lossLabel: loss ? `${loss} lost` : 'Loss not disclosed',
    chain: item.chain,
    attackType: item.attackType,
    sourceLabel: credit.label,
    status: item.status,
    poweredByQuillMonitor: credit.poweredByQuillMonitor,
  };
}

export interface WeeklyCardInput {
  /** "Oct 5, 2026" */
  weekLabel: string;
  /** "~$12.3M reported lost", or null when no loss was reported. */
  lossLabel: string | null;
  incidentCount: number;
}

export function renderWeeklyCardSvg(i: WeeklyCardInput): string {
  const count = `${i.incidentCount} ${i.incidentCount === 1 ? 'incident' : 'incidents'}`;
  return frame(
    text(80, 105, 22, '#a78bfa', 'DIGIBASTION WEEKLY REPORT', ' font-weight="700" letter-spacing="2"') +
    text(80, 215, 52, '#f9fafb', 'Web3 security,', ' font-weight="800"') +
    text(80, 277, 52, '#f9fafb', `week of ${clip(i.weekLabel, 24)}`, ' font-weight="800"') +
    text(80, 380, 48, i.lossLabel ? '#f87171' : '#d1d5db', i.lossLabel ?? 'No loss amounts reported', ' font-weight="700"') +
    text(80, 440, 30, '#d1d5db', i.incidentCount > 0 ? `${count} · every item names its source` : 'No incidents recorded') +
    text(80, 560, 22, '#9ca3af', 'Sources: QuillMonitor and other public trackers'),
    '#8b5cf6',
  );
}

export function weeklyCardInput(c: Pick<WeeklyPublicContent, 'weekStart' | 'totals'>): WeeklyCardInput {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(c.weekStart);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  const loss = c.totals.lossUsd > 0 ? formatLossReported(c.totals.lossUsd) : null;
  return {
    weekLabel: match && month ? `${month} ${Number(match[3])}, ${match[1]}` : c.weekStart,
    lossLabel: loss ? `${loss} lost` : null,
    incidentCount: c.totals.incidentCount,
  };
}

// ---------------------------------------------------------------------------
// Quiz result card (moved from og-image/index.ts, now escaped)
// ---------------------------------------------------------------------------

export interface QuizCardInput {
  username: string;
  score: number;
  badges: string[];
  /** data: URI of the avatar, or null for the placeholder. */
  avatarDataUri: string | null;
}

function quizCharacter(score: number): { name: string; icon: string; title: string } {
  if (score >= 90) return { name: 'Satoshi-Level', icon: '★', title: 'The Phantom Founder' };
  if (score >= 75) return { name: 'Whale Guard', icon: '◆', title: 'The Protocol Protector' };
  if (score >= 60) return { name: 'Diamond Hands', icon: '◇', title: 'The Steady Holder' };
  if (score >= 45) return { name: 'Degen Defender', icon: '▲', title: 'The Learning Ape' };
  if (score >= 30) return { name: 'Paper Hands', icon: '○', title: 'The Vulnerable Holder' };
  return { name: 'Rekt Waiting', icon: '!', title: 'Critical Risk' };
}

function quizColors(score: number): { main: string; bg: string } {
  if (score >= 80) return { main: '#22c55e', bg: '#052e16' };
  if (score >= 60) return { main: '#3b82f6', bg: '#172554' };
  if (score >= 40) return { main: '#eab308', bg: '#422006' };
  if (score >= 20) return { main: '#f97316', bg: '#431407' };
  return { main: '#ef4444', bg: '#450a0a' };
}

const SAFE_DATA_URI = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/;

export function renderQuizCardSvg(i: QuizCardInput): string {
  const score = Number.isFinite(i.score) ? Math.min(100, Math.max(0, Math.round(i.score))) : 0;
  const character = quizCharacter(score);
  const colors = quizColors(score);
  const username = xmlText(chars(i.username).length > 16 ? `${chars(i.username).slice(0, 16).join('')}...` : i.username);
  const badges = i.badges.slice(0, 3).map((badge) => xmlText(chars(badge).length > 12 ? `${chars(badge).slice(0, 12).join('')}..` : badge));
  const circumference = 2 * Math.PI * 50;
  const dashOffset = circumference - (score / 100) * circumference;
  const avatar = i.avatarDataUri && SAFE_DATA_URI.test(i.avatarDataUri)
    ? `<image x="70" y="150" width="100" height="100" href="${i.avatarDataUri}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="120" cy="200" r="50" fill="#1f2937"/><text x="120" y="210" font-family="Arial" font-size="24" fill="#6b7280" text-anchor="middle">?</text>`;
  const level = score >= 80 ? 'ELITE SECURITY' : score >= 60 ? 'ADVANCED' : score >= 40 ? 'MODERATE' : 'NEEDS WORK';

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0f"/>
          <stop offset="100%" style="stop-color:#1a1a2e"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#8b5cf6"/>
          <stop offset="100%" style="stop-color:#6366f1"/>
        </linearGradient>
        <clipPath id="avatarClip"><circle cx="120" cy="200" r="50"/></clipPath>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <rect x="50" y="50" width="1100" height="530" rx="20" fill="#111827" stroke="#374151" stroke-width="1"/>
      <rect x="50" y="50" width="1100" height="4" fill="url(#accent)"/>
      <text x="80" y="110" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#8b5cf6">DIGIBASTION</text>
      <text x="80" y="135" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">OpSec Security Assessment</text>
      <circle cx="120" cy="200" r="52" fill="none" stroke="${colors.main}" stroke-width="3"/>
      ${avatar}
      <text x="190" y="195" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#f9fafb">@${username}</text>
      <text x="190" y="220" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">Security Level Assessment</text>
      <circle cx="200" cy="380" r="55" fill="${colors.bg}" stroke="${colors.main}" stroke-width="3"/>
      <text x="200" y="395" font-family="Arial, sans-serif" font-size="40" font-weight="800" fill="${colors.main}" text-anchor="middle">${character.icon}</text>
      <text x="200" y="470" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#f9fafb" text-anchor="middle">${character.name}</text>
      <text x="200" y="500" font-family="Arial, sans-serif" font-size="14" fill="${colors.main}" text-anchor="middle">${character.title}</text>
      <line x1="420" y1="100" x2="420" y2="530" stroke="#374151" stroke-width="1"/>
      <text x="750" y="130" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" font-weight="600">YOUR SECURITY SCORE</text>
      <circle cx="750" cy="280" r="90" fill="#1f2937"/>
      <circle cx="750" cy="280" r="70" fill="none" stroke="#374151" stroke-width="12"/>
      <circle cx="750" cy="280" r="50" fill="none" stroke="${colors.main}" stroke-width="14" stroke-linecap="round"
        stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 750 280)"/>
      <text x="750" y="295" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#ffffff" text-anchor="middle">${score}</text>
      <text x="750" y="330" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">out of 100</text>
      <rect x="650" y="400" width="200" height="36" rx="18" fill="${colors.bg}" stroke="${colors.main}" stroke-width="2"/>
      <text x="750" y="424" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${colors.main}" text-anchor="middle">${level}</text>
      ${badges.length > 0 ? `
        <text x="550" y="480" font-family="Arial, sans-serif" font-size="10" fill="#6b7280" font-weight="600">EARNED BADGES</text>
        ${badges.map((badge, index) => `
          <rect x="${550 + index * 120}" y="495" width="110" height="26" rx="13" fill="#1f2937" stroke="#6366f1" stroke-width="1"/>
          <text x="${605 + index * 120}" y="513" font-family="Arial, sans-serif" font-size="10" fill="#a78bfa" text-anchor="middle">${badge}</text>
        `).join('')}
      ` : ''}
      <rect x="950" y="500" width="180" height="50" rx="25" fill="url(#accent)"/>
      <text x="1040" y="532" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#ffffff" text-anchor="middle">www.digibastion.com</text>
    </svg>`;
}
