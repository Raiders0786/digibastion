import { describe, expect, it } from 'vitest';
import {
  buildUnsubscribeLinks,
  emailHash,
  isOneClickUnsubscribeRequest,
  listUnsubscribeHeaders,
  normalizeEmail,
  readPostalAddress,
  renderComplianceFooterHtml,
  renderComplianceFooterText,
  renderEmailDocument,
} from './email-compliance.ts';

const links = buildUnsubscribeLinks({
  siteUrl: 'https://www.digibastion.com/',
  functionsBaseUrl: 'https://example.supabase.co/functions/v1',
  email: 'a+b@example.com',
  token: 'tok en&1',
});

describe('buildUnsubscribeLinks', () => {
  it('builds the one-click, page and manage links with encoded values', () => {
    expect(links).toEqual({
      oneClickUrl: 'https://example.supabase.co/functions/v1/one-click-unsubscribe?token=tok%20en%261&email=a%2Bb%40example.com',
      unsubscribePageUrl: 'https://www.digibastion.com/unsubscribe?email=a%2Bb%40example.com&token=tok%20en%261',
      manageUrl: 'https://www.digibastion.com/manage-subscription?email=a%2Bb%40example.com&token=tok%20en%261',
    });
  });

  it('emits exactly the RFC 8058 headers', () => {
    expect(listUnsubscribeHeaders(links)).toEqual({
      'List-Unsubscribe': `<${links.oneClickUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });
});

describe('readPostalAddress', () => {
  it('trims and collapses whitespace', () => {
    expect(readPostalAddress('  Digibastion\n  1 Main Street,   Springfield  ')).toBe('Digibastion 1 Main Street, Springfield');
  });

  it('returns null for blank, short or very long values', () => {
    expect(readPostalAddress('  ')).toBeNull();
    expect(readPostalAddress(null)).toBeNull();
    expect(readPostalAddress(undefined)).toBeNull();
    expect(readPostalAddress('PO Box 1')).toBeNull();
    expect(readPostalAddress('x'.repeat(301))).toBeNull();
  });
});

describe('compliance footer', () => {
  const address = '1 Main <Street>, Springfield & Co';

  it('shows the escaped address and puts the unsubscribe link first, with manage preferences beside it', () => {
    const html = renderComplianceFooterHtml({ links, postalAddress: address, reason: 'You subscribed to the daily brief.' });
    expect(html).toContain('1 Main &lt;Street&gt;, Springfield &amp; Co');
    expect(html).not.toContain('<Street>');
    const unsubscribeAt = html.indexOf('>Unsubscribe<');
    const manageAt = html.indexOf('>Manage preferences<');
    expect(unsubscribeAt).toBeGreaterThan(-1);
    expect(manageAt).toBeGreaterThan(unsubscribeAt);
    expect(html).toContain(`href="${links.unsubscribePageUrl.replace(/&/g, '&amp;')}"`);
    expect(html).toContain(`href="${links.manageUrl.replace(/&/g, '&amp;')}"`);
    expect(html).toContain('You subscribed to the daily brief.');
  });

  it('has no address line when the address is missing', () => {
    const html = renderComplianceFooterHtml({ links, postalAddress: null, reason: 'Reason' });
    expect(html).not.toContain('data-postal-address');
    expect(html).not.toContain('Postal address not configured');
  });

  it('renders the test warning', () => {
    const html = renderComplianceFooterHtml({ links, postalAddress: null, reason: 'Reason', testWarning: true });
    expect(html).toContain('Postal address not configured');
    const text = renderComplianceFooterText({ links, postalAddress: null, reason: 'Reason', testWarning: true });
    expect(text).toContain('Postal address not configured');
  });

  it('renders a plain-text footer with the raw links and address', () => {
    const text = renderComplianceFooterText({ links, postalAddress: address, reason: 'Reason' });
    expect(text).toContain(`Unsubscribe: ${links.unsubscribePageUrl}`);
    expect(text).toContain(`Manage preferences: ${links.manageUrl}`);
    expect(text).toContain(address);
    expect(text.indexOf('Unsubscribe:')).toBeLessThan(text.indexOf('Manage preferences:'));
  });
});

describe('renderEmailDocument', () => {
  it('wraps the body and footer in the shared 640px shell with an escaped title and preheader', () => {
    const html = renderEmailDocument({
      title: 'Daily brief <1>',
      preheader: '3 incidents & 1 update',
      bodyHtml: '<tr><td>BODY</td></tr>',
      footerHtml: '<p>FOOTER</p>',
    });
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<title>Daily brief &lt;1&gt;</title>');
    expect(html).toContain('3 incidents &amp; 1 update');
    expect(html).toContain('max-width:640px');
    expect(html).toContain('<tr><td>BODY</td></tr>');
    expect(html).toContain('<p>FOOTER</p>');
    expect(html.indexOf('BODY')).toBeLessThan(html.indexOf('FOOTER'));
  });
});

describe('email hashing', () => {
  it('normalizes before hashing', async () => {
    expect(normalizeEmail(' A@B.com ')).toBe('a@b.com');
    const hash = await emailHash(' A@B.com ');
    expect(hash).toBe(await emailHash('a@b.com'));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // sha256("a@b.com")
    expect(hash).toBe('fb98d44ad7501a959f3f4f4a3f004fe2d9e581ea6207e218c4b02c08a4d75adf');
  });
});

describe('isOneClickUnsubscribeRequest (RFC 8058)', () => {
  const url = 'https://example.test/functions/v1/one-click-unsubscribe?token=t';

  it('accepts a form-urlencoded body', async () => {
    const req = new Request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'List-Unsubscribe=One-Click',
    });
    expect(await isOneClickUnsubscribeRequest(req)).toBe(true);
  });

  it('accepts a multipart/form-data body, as the RFC example sends', async () => {
    const form = new FormData();
    form.set('List-Unsubscribe', 'One-Click');
    const req = new Request(url, { method: 'POST', body: form });
    expect(req.headers.get('content-type')).toMatch(/^multipart\/form-data/);
    expect(await isOneClickUnsubscribeRequest(req)).toBe(true);
  });

  it('rejects other content types, a missing value and a malformed body', async () => {
    const json = new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"List-Unsubscribe":"One-Click"}' });
    expect(await isOneClickUnsubscribeRequest(json)).toBe(false);
    const wrong = new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=Yes' });
    expect(await isOneClickUnsubscribeRequest(wrong)).toBe(false);
    const broken = new Request(url, { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=x' }, body: 'not multipart' });
    expect(await isOneClickUnsubscribeRequest(broken)).toBe(false);
  });
});
