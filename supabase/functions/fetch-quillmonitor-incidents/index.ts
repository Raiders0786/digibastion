import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3.23.8';
import {
  normalizeQuillMonitorIncident,
  parseQuillMonitorIncident,
  type NormalizedQuillMonitorArticle,
} from '../_shared/quillmonitor.ts';

const API_URL = 'https://www.quillaudits.com/api/partner/hack-incidents';
const RequestSchema = z.object({
  pages: z.number().int().min(1).max(20).optional().default(3),
  page_size: z.number().int().min(1).max(100).optional().default(100),
}).strict();

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right)),
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < leftBytes.length; index++) difference |= leftBytes[index] ^ rightBytes[index];
  return difference === 0;
}

async function authorize(req: Request, url: string, anonKey: string, serviceKey: string): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return false;

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && await timingSafeEqual(token, cronSecret)) return true;
  if (await timingSafeEqual(token, serviceKey)) return true;

  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return false;
  const admin = createClient(url, serviceKey);
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  return Boolean(role);
}

async function fetchPage(apiKey: string, page: number, limit: number): Promise<Record<string, unknown>> {
  let lastError = 'Unknown provider error';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    try {
      const response = await fetch(`${API_URL}?page=${page}&limit=${limit}&sort=newest`, {
        headers: { 'x-api-key': apiKey, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      const body = await response.text();
      if (!response.ok) {
        lastError = `QuillMonitor returned HTTP ${response.status}`;
        if (response.status !== 429 && response.status < 500) throw new Error(lastError);
        continue;
      }
      const parsed = JSON.parse(body);
      if (!parsed || typeof parsed !== 'object') throw new Error('QuillMonitor returned an invalid response');
      return parsed as Record<string, unknown>;
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'QuillMonitor request failed';
      if (attempt === 2 || lastError.includes('HTTP 4')) throw new Error(lastError);
    }
  }
  throw new Error(lastError);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = Deno.env.get('QUILLMONITOR_API_KEY');
  if (!url || !anonKey || !serviceKey || !apiKey) {
    return new Response(JSON.stringify({ error: 'Server configuration is incomplete' }), { status: 500, headers: jsonHeaders });
  }
  if (!await authorize(req, url, anonKey, serviceKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  let rawBody: unknown = {};
  try { rawBody = await req.json(); } catch { rawBody = {}; }
  const request = RequestSchema.safeParse(rawBody);
  if (!request.success) {
    return new Response(JSON.stringify({ error: request.error.flatten().fieldErrors }), { status: 400, headers: jsonHeaders });
  }

  try {
    const db = createClient(url, serviceKey);
    const articles: NormalizedQuillMonitorArticle[] = [];
    let invalidRecords = 0;
    let pagesFetched = 0;
    let nextPage: number | null = 1;

    while (nextPage !== null && pagesFetched < request.data.pages) {
      const payload = await fetchPage(apiKey, nextPage, request.data.page_size);
      if (payload.success !== true || !Array.isArray(payload.data)) throw new Error('QuillMonitor response did not match the documented format');
      for (const value of payload.data) {
        const incident = parseQuillMonitorIncident(value);
        if (!incident) {
          invalidRecords++;
          continue;
        }
        articles.push(normalizeQuillMonitorIncident(incident));
      }
      pagesFetched++;
      const candidate = payload.nextPage;
      nextPage = typeof candidate === 'number' && Number.isInteger(candidate) && candidate > nextPage ? candidate : null;
    }

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];
    for (const article of articles) {
      const { data: existing, error: readError } = await db.from('news_articles').select('id').eq('uid', article.uid).maybeSingle();
      if (readError) {
        errors.push(`${article.uid}: lookup failed`);
        continue;
      }
      const { error: writeError } = await db.from('news_articles').upsert(article, { onConflict: 'uid' });
      if (writeError) errors.push(`${article.uid}: write failed`);
      else if (existing) updated++;
      else inserted++;
    }

    console.log(`[fetch-quillmonitor-incidents] pages=${pagesFetched} normalized=${articles.length} inserted=${inserted} updated=${updated} invalid=${invalidRecords} errors=${errors.length}`);
    return new Response(JSON.stringify({
      success: errors.length === 0,
      incidentsFound: articles.length,
      incidentsInserted: inserted,
      incidentsUpdated: updated,
      invalidRecords,
      pagesFetched,
      hasMore: nextPage !== null,
      errors: errors.length ? errors.slice(0, 10) : undefined,
    }), { status: errors.length ? 207 : 200, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'QuillMonitor synchronization failed';
    console.error(`[fetch-quillmonitor-incidents] ${message}`);
    return new Response(JSON.stringify({ success: false, error: message }), { status: 502, headers: jsonHeaders });
  }
});