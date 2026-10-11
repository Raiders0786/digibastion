import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Everything under these folders ships publicly: the site root, the edge
// functions and the optional Worker. None of it may carry a secret.
const ROOTS = ['public', 'supabase/functions', 'edge'];
const SKIP = /\.(png|ico|jpg|jpeg|gif|webp|woff2?)$/i;
const JWT = /eyJ[A-Za-z0-9_-]+\.(eyJ[A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g;
const PATTERNS: [string, RegExp][] = [
  ['Resend key', /\bre_[A-Za-z0-9]{20,}/],
  ['webhook secret', /\bwhsec_[A-Za-z0-9+/=]{20,}/],
  ['Telegram bot token', /\b\d{8,10}:[A-Za-z0-9_-]{35}\b/],
  ['personal Gmail', /[A-Za-z0-9._%+-]+@gmail\.com/i],
  ['Supabase secret key', /\bsb_secret_[A-Za-z0-9_-]{10,}/],
];

function files(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  let out: string[] = [];
  for (const name of entries) {
    if (name === 'node_modules') continue;
    const path = join(dir, name);
    out = statSync(path).isDirectory() ? out.concat(files(path)) : SKIP.test(name) ? out : out.concat(path);
  }
  return out;
}

describe('public files carry no secrets', () => {
  const all = ROOTS.flatMap((root) => files(resolve(process.cwd(), root)));

  it('scans a real tree', () => {
    expect(all.some((file) => file.endsWith('robots.txt'))).toBe(true);
    expect(all.some((file) => file.endsWith('send-newsletters/index.ts'))).toBe(true);
  });

  it.each(PATTERNS)('no %s', (_label, pattern) => {
    const hits = all.filter((file) => pattern.test(readFileSync(file, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('no JWT other than the public anon key', () => {
    const hits = all.filter((file) => [...readFileSync(file, 'utf8').matchAll(JWT)].some((match) => {
      try {
        return JSON.parse(Buffer.from(match[1], 'base64url').toString('utf8')).role !== 'anon';
      } catch {
        return false;
      }
    }));
    expect(hits).toEqual([]);
  });

  it('the patterns catch what they are meant to', () => {
    const [, resend] = PATTERNS[0];
    const [, telegram] = PATTERNS[2];
    expect(resend.test(`re_${'A1'.repeat(12)}`)).toBe(true);
    expect(resend.test('re_test_secret_key')).toBe(false);
    expect(telegram.test(`123456789:${'a'.repeat(35)}`)).toBe(true);
  });
});
