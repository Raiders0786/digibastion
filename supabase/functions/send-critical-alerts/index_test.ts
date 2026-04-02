import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Inline stripHtml from send-critical-alerts/index.ts
function stripHtml(text: string | null | undefined): string {
  if (!text) return '';
  let s = text, prev = '';
  while (s !== prev) {
    prev = s;
    s = s.replace(/&#(\d+);/g, (_, c) => String.fromCodePoint(parseInt(c, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&(amp|lt|gt|quot|apos|nbsp|mdash|ndash|hellip|rsquo|lsquo|rdquo|ldquo);/gi, (_, n) => {
        const m: Record<string, string> = { amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',mdash:'—',ndash:'–',hellip:'…',rsquo:'\u2019',lsquo:'\u2018',rdquo:'\u201D',ldquo:'\u201C' };
        return m[n.toLowerCase()] ?? '';
      });
    s = s.replace(/<[^>]*>/g, '');
  }
  return s.replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

Deno.test("stripHtml: empty/null input", () => {
  assertEquals(stripHtml(null), '');
  assertEquals(stripHtml(undefined), '');
  assertEquals(stripHtml(''), '');
});

Deno.test("stripHtml: simple tags", () => {
  assertEquals(stripHtml('<p>Hello</p>'), 'Hello');
});

Deno.test("stripHtml: double-encoded entities", () => {
  assertEquals(stripHtml('&amp;lt;p&amp;gt;text&amp;lt;/p&amp;gt;'), 'text');
});

Deno.test("stripHtml: complex Cisco-style content", () => {
  const input = '&lt;div&gt;&lt;p&gt;Cisco vulnerability&lt;/p&gt;&lt;/div&gt;';
  const result = stripHtml(input);
  assertEquals(result, 'Cisco vulnerability');
});

Deno.test("escapeHtml: prevents injection", () => {
  assertEquals(escapeHtml('<img onerror=alert(1)>'), '&lt;img onerror=alert(1)&gt;');
});
