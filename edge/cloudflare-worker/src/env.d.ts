// The few Cloudflare Workers types this Worker uses, so it needs no
// @cloudflare/workers-types dependency. Values come from wrangler.toml [vars].

interface Env {
  /** A separate host to fetch pages from. Empty or unset: the DNS record's origin (Lovable). */
  ORIGIN_URL?: string;
  SUPABASE_URL?: string;
  /** The public anon key, the same one the browser app ships with. Never a service-role key. */
  SUPABASE_ANON_KEY?: string;
  /** "true" sends the CSP as Content-Security-Policy-Report-Only. */
  CSP_REPORT_ONLY?: string;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

interface CacheStorage {
  /** The data centre's default cache (Cloudflare only). */
  readonly default: Cache;
}
