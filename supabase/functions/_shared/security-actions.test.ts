import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SECURITY_ACTIONS, pickSecurityAction } from './security-actions.ts';

const CATEGORY_DIR = fileURLToPath(new URL('../../../src/data/categories/', import.meta.url));
const HYPE = /massive|devastating|urgent|immediate action required|act now|critical alert/i;

describe('SECURITY_ACTIONS', () => {
  it('holds 8 to 12 entries with unique ids', () => {
    expect(SECURITY_ACTIONS.length).toBeGreaterThanOrEqual(8);
    expect(SECURITY_ACTIONS.length).toBeLessThanOrEqual(12);
    expect(new Set(SECURITY_ACTIONS.map((action) => action.id)).size).toBe(SECURITY_ACTIONS.length);
  });

  it('links every /category/<id> to an existing guide', () => {
    const guides = new Set(readdirSync(CATEGORY_DIR).map((file) => file.replace(/\.tsx?$/, '')));
    for (const action of SECURITY_ACTIONS) {
      const url = new URL(action.url);
      expect(url.protocol).toBe('https:');
      if (url.hostname === 'www.digibastion.com') {
        const match = /^\/category\/([a-z0-9-]+)$/.exec(url.pathname);
        expect(match, action.url).not.toBeNull();
        expect(guides.has(match![1]), action.url).toBe(true);
      }
    }
  });

  it('uses plain wording with no hype words or emoji', () => {
    for (const action of SECURITY_ACTIONS) {
      expect(action.text).not.toMatch(HYPE);
      expect(action.guideTitle).not.toMatch(HYPE);
      expect(action.text).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(action.text.length).toBeLessThanOrEqual(200);
    }
  });
});

describe('pickSecurityAction', () => {
  it('is deterministic for the same input', () => {
    const input = { seed: '2026-10-12', attackTypes: [], categories: [] };
    expect(pickSecurityAction(input)).toEqual(pickSecurityAction(input));
  });

  it('rotates by seed when nothing matches', () => {
    const picks = new Set(Array.from({ length: 30 }, (_, day) =>
      pickSecurityAction({ seed: `2026-10-${String(day + 1).padStart(2, '0')}`, attackTypes: [], categories: [] }).id));
    expect(picks.size).toBeGreaterThan(3);
  });

  it('maps phishing and drainers to approvals or the wallet guide', () => {
    for (const attackType of ['Phishing', 'Wallet Drainer', 'Approval exploit']) {
      const action = pickSecurityAction({ seed: '2026-10-12', attackTypes: [attackType], categories: [] });
      expect(action.url === 'https://revoke.cash' || action.url.endsWith('/category/wallet'), action.id).toBe(true);
    }
  });

  it('maps private key and access control to the opsec guide', () => {
    for (const attackType of ['Private Key Compromise', 'Access Control']) {
      const action = pickSecurityAction({ seed: '2026-10-12', attackTypes: [attackType], categories: [] });
      expect(action.url).toBe('https://www.digibastion.com/category/opsec');
    }
  });

  it('maps supply chain and npm to the developer guide', () => {
    expect(pickSecurityAction({ seed: 'x', attackTypes: ['Supply Chain'], categories: [] }).url)
      .toBe('https://www.digibastion.com/category/developers');
    expect(pickSecurityAction({ seed: 'x', attackTypes: ['malicious npm package'], categories: [] }).url)
      .toBe('https://www.digibastion.com/category/developers');
    expect(pickSecurityAction({ seed: 'x', attackTypes: [], categories: ['supply-chain'] }).url)
      .toBe('https://www.digibastion.com/category/developers');
  });
});
