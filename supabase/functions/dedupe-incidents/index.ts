import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { z } from 'npm:zod@3.23.8';
import { planDuplicateBackfill, type IncidentRow } from '../_shared/incident-dedup.ts';

// One-time (and repeatable) backfill that marks existing cross-provider
// duplicates. Defaults to a dry run so the matches can be reviewed first.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const RequestSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  days: z.number().int().min(1).max(180).optional().default(90),
}).strict();
const WEB3_INCIDENT_FILTER = 'metadata->>is_web3_incident.eq.true,metadata->>provider.in.(quillmonitor,web3-incidents,web3,slowmist)';
const PAGE_SIZE = 1_000;
// 180 days of every Web3 provider is well under this; hitting it means the
// filter is wrong, so the run stops instead of grouping a partial set.
const MAX_ROWS = 10_000;

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Server configuration is incomplete' }), { status: 500, headers: jsonHeaders });
  }
  if (!await authorize(req, url, anonKey, serviceKey)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  const rawBody: unknown = await req.json().catch(() => ({}));
  const request = RequestSchema.safeParse(rawBody);
  if (!request.success) {
    return new Response(JSON.stringify({ error: request.error.flatten().fieldErrors }), { status: 400, headers: jsonHeaders });
  }
  const { dryRun, days } = request.data;

  try {
    const db = createClient(url, serviceKey);
    // Two extra days so an incident at the window edge still meets its match.
    const since = new Date(Date.now() - (days + 2) * 86_400_000).toISOString();
    const rows: IncidentRow[] = [];
    for (let offset = 0; ; offset += PAGE_SIZE) {
      const { data, error } = await db
        .from('news_articles')
        .select('uid,title,published_at,source_name,metadata,link,source_url')
        .gte('published_at', since)
        .or(WEB3_INCIDENT_FILTER)
        .order('published_at', { ascending: true })
        .order('uid', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error('Incident rows could not be read');
      rows.push(...((data ?? []) as IncidentRow[]));
      if (rows.length > MAX_ROWS) throw new Error(`Incident window exceeded the ${MAX_ROWS}-row safety limit`);
      if (!data || data.length < PAGE_SIZE) break;
    }

    const plan = planDuplicateBackfill(rows);
    const pendingMarks = plan.marks.filter((mark) => mark.needsWrite);
    let duplicatesMarked = 0;
    let canonicalSourcesUpdated = 0;
    let writeErrors = 0;

    if (!dryRun) {
      for (const mark of pendingMarks) {
        const { error } = await db.from('news_articles').update({ metadata: mark.metadata }).eq('uid', mark.uid);
        if (error) writeErrors++;
        else duplicatesMarked++;
      }
      for (const update of plan.canonicalUpdates) {
        const { error } = await db.from('news_articles').update({ metadata: update.metadata }).eq('uid', update.uid);
        if (error) writeErrors++;
        else canonicalSourcesUpdated++;
      }
    }

    console.log(`[dedupe-incidents] dry_run=${dryRun} days=${days} rows=${rows.length} groups=${plan.groups.length} duplicates=${plan.marks.length} pending=${pendingMarks.length} marked=${duplicatesMarked} canonical_updates=${canonicalSourcesUpdated} write_errors=${writeErrors}`);
    return new Response(JSON.stringify({
      success: writeErrors === 0,
      dryRun,
      days,
      rowsScanned: rows.length,
      groups: plan.groups.length,
      duplicatesFound: plan.marks.length,
      duplicatesToMark: pendingMarks.length,
      canonicalSourceUpdates: plan.canonicalUpdates.length,
      duplicatesMarked,
      canonicalSourcesUpdated,
      writeErrors,
      samples: plan.samples,
    }), { status: writeErrors === 0 ? 200 : 207, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith('Incident')
      ? error.message
      : 'Duplicate backfill failed';
    console.error(`[dedupe-incidents] ${message}`);
    return new Response(JSON.stringify({ success: false, error: message }), { status: 500, headers: jsonHeaders });
  }
});
