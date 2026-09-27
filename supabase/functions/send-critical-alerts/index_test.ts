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
