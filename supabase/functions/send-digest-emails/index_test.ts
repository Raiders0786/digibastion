import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

// Inline stripHtml from send-digest-emails/index.ts
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

Deno.test("stripHtml: double-encoded", () => {
  assertEquals(stripHtml('&amp;lt;em&amp;gt;test&amp;lt;/em&amp;gt;'), 'test');
});

Deno.test("stripHtml: preserves clean text", () => {
  assertEquals(stripHtml('Already clean text'), 'Already clean text');
});

Deno.test("escapeHtml: escapes special chars", () => {
  assertEquals(escapeHtml('<script>alert("xss")</script>'), '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
});

Deno.test("escapeHtml: handles empty", () => {
  assertEquals(escapeHtml(''), '');
});
