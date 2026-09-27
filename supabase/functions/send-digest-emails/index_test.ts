import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { escapeHtml, stripHtml } from "../_shared/subscription-delivery.ts";

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
