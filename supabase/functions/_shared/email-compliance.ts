// Compliance pieces every subscriber email carries: one-click unsubscribe
// (RFC 8058), a body unsubscribe link with "Manage preferences" beside it, the
// postal address (CAN-SPAM) and the shared dark email shell. Also the email
// hash used by email_suppressions.
// Pure module: no Deno or URL imports, so vitest can import it.
import { escapeHtml } from './subscription-delivery.ts';

export interface UnsubscribeLinks { oneClickUrl: string; unsubscribePageUrl: string; manageUrl: string }

export interface ComplianceFooterOptions {
  links: UnsubscribeLinks;
  postalAddress: string | null;
  /** Why the reader gets this email, e.g. "You subscribed to the Digibastion daily brief." */
  reason: string;
  /** Admin test send without a configured address: say so in the footer. */
  testWarning?: boolean;
}

const MIN_POSTAL_ADDRESS_LENGTH = 10;
const MAX_POSTAL_ADDRESS_LENGTH = 300;
const TEST_WARNING = 'Postal address not configured. Subscriber sends stay off until NEWSLETTER_POSTAL_ADDRESS is set.';

const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');

export function buildUnsubscribeLinks(o: { siteUrl: string; functionsBaseUrl: string; email: string; token: string }): UnsubscribeLinks {
  const site = trimTrailingSlashes(o.siteUrl);
  const functions = trimTrailingSlashes(o.functionsBaseUrl);
  const email = encodeURIComponent(o.email);
  const token = encodeURIComponent(o.token);
  return {
    oneClickUrl: `${functions}/one-click-unsubscribe?token=${token}&email=${email}`,
    unsubscribePageUrl: `${site}/unsubscribe?email=${email}&token=${token}`,
    manageUrl: `${site}/manage-subscription?email=${email}&token=${token}`,
  };
}

export function listUnsubscribeHeaders(l: UnsubscribeLinks): { 'List-Unsubscribe': string; 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } {
  return {
    'List-Unsubscribe': `<${l.oneClickUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}

/** The NEWSLETTER_POSTAL_ADDRESS secret, cleaned; null when unset or implausible. */
export function readPostalAddress(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const address = raw.replace(/\s+/g, ' ').trim();
  return address.length >= MIN_POSTAL_ADDRESS_LENGTH && address.length <= MAX_POSTAL_ADDRESS_LENGTH ? address : null;
}

const LINK_STYLE = 'color:#93c5fd;text-decoration:underline;';
const TEXT_STYLE = 'margin:0;color:#a8b3c7;font-size:12px;line-height:19px;';

export function renderComplianceFooterHtml(o: ComplianceFooterOptions): string {
  const rows = [
    `<p style="${TEXT_STYLE}">${escapeHtml(o.reason)}</p>`,
    `<p style="${TEXT_STYLE}margin-top:8px;">` +
      `<a href="${escapeHtml(o.links.unsubscribePageUrl)}" style="${LINK_STYLE}">Unsubscribe</a>` +
      ' &nbsp;·&nbsp; ' +
      `<a href="${escapeHtml(o.links.manageUrl)}" style="${LINK_STYLE}">Manage preferences</a></p>`,
  ];
  if (o.postalAddress) {
    rows.push(`<p data-postal-address style="${TEXT_STYLE}margin-top:8px;">${escapeHtml(o.postalAddress)}</p>`);
  }
  if (o.testWarning) {
    rows.push(`<p style="margin:8px 0 0;color:#fbbf24;font-size:12px;line-height:19px;font-weight:700;">${escapeHtml(TEST_WARNING)}</p>`);
  }
  return rows.join('\n');
}

export function renderComplianceFooterText(o: ComplianceFooterOptions): string {
  const lines = [
    o.reason,
    `Unsubscribe: ${o.links.unsubscribePageUrl}`,
    `Manage preferences: ${o.links.manageUrl}`,
  ];
  if (o.postalAddress) lines.push(o.postalAddress);
  if (o.testWarning) lines.push(TEST_WARNING);
  return lines.join('\n');
}

/**
 * The shared email shell: 640px card on the dark theme of the current digest.
 * bodyHtml is one or more <tr> rows; footerHtml is placed in the footer cell.
 */
export function renderEmailDocument(o: { title: string; preheader: string; bodyHtml: string; footerHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(o.title)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    @media only screen and (max-width: 680px) {
      .email-shell { padding: 0 !important; }
      .email-card { border-radius: 0 !important; }
      .email-pad { padding-left: 18px !important; padding-right: 18px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(o.preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background-color:#111827;">
    <tr><td class="email-shell" align="center" style="padding:24px 12px;">
      <table role="presentation" width="640" cellpadding="0" cellspacing="0" class="email-card" style="width:100%;max-width:640px;margin:0 auto;background-color:#1f2937;border-radius:10px;overflow:hidden;">
        ${o.bodyHtml}
        <tr>
          <td class="email-pad" style="padding:20px 28px;background-color:#111827;text-align:center;">
            ${o.footerHtml}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** sha256 hex of the normalized address, the email_suppressions key. */
export async function emailHash(email: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeEmail(email)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
