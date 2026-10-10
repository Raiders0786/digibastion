import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { z } from 'npm:zod@3.23.8';
import { planDuplicateBackfill, type IncidentRow } from '../_shared/incident-dedup.ts';
import { planLegacyAmountRepairs, type LegacyAmountRow } from '../_shared/legacy-amounts.ts';

// One-time (and repeatable) backfill that marks existing cross-provider
// duplicates and, on request, re-parses loss figures written by the old
// web3-incidents importer. Defaults to a dry run so the changes can be
// reviewed first.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
// Duplicates are only looked for in the recent window; the legacy amount
// repair may reach back further, because the bad rows are years old.
const MAX_DUPLICATE_DAYS = 180;
const MAX_REPAIR_DAYS = 3650;
const RequestSchema = z.object({
  dryRun: z.boolean().optional().default(true),
  days: z.number().int().min(1).max(MAX_REPAIR_DAYS).optional().default(90),
  repairLegacyAmounts: z.boolean().optional().default(false),
}).strict().refine((body) => body.repairLegacyAmounts || body.days <= MAX_DUPLICATE_DAYS, {
  message: `days above ${MAX_DUPLICATE_DAYS} needs repairLegacyAmounts`,
  path: ['days'],
});
const WEB3_INCIDENT_FILTER = 'metadata->>is_web3_incident.eq.true,metadata->>provider.in.(quillmonitor,web3-incidents,web3,slowmist)';
const LEGACY_PROVIDER_FILTER = 'metadata->>provider.in.(web3-incidents,web3)';
const PAGE_SIZE = 1_000;
// 180 days of every Web3 provider, or every web3-incidents row ever stored,
// is well under this; hitting it means the filter is wrong, so the run stops
// instead of working on a partial set.
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

type Db = ReturnType<typeof createClient>;

async function readRows<T>(db: Db, columns: string, filter: string, since: string): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await db
      .from('news_articles')
      .select(columns)
      .gte('published_at', since)
      .or(filter)
      .order('published_at', { ascending: true })
      .order('uid', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw new Error('Incident rows could not be read');
    rows.push(...((data ?? []) as T[]));
    if (rows.length > MAX_ROWS) throw new Error(`Incident window exceeded the ${MAX_ROWS}-row safety limit`);
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

const sinceDays = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

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
  const { dryRun, days, repairLegacyAmounts } = request.data;
  const duplicateDays = Math.min(days, MAX_DUPLICATE_DAYS);

  try {
    const db = createClient(url, serviceKey);
    // Two extra days so an incident at the window edge still meets its match.
    const rows = await readRows<IncidentRow>(
      db,
      'uid,title,published_at,source_name,metadata,link',
      WEB3_INCIDENT_FILTER,
      sinceDays(duplicateDays + 2),
    );

    const legacyPlan = repairLegacyAmounts
      ? planLegacyAmountRepairs(await readRows<LegacyAmountRow>(
        db,
        'uid,title,summary,content,tags,severity,metadata',
        LEGACY_PROVIDER_FILTER,
        sinceDays(days),
      ))
      : null;
    // Duplicates are planned on the repaired metadata, so a duplicate write
    // never puts the old figure back and the "same loss" rule sees real amounts.
    const repairedMetadata = new Map(legacyPlan?.repairs.map((repair) => [repair.uid, repair.metadata]) ?? []);
    const plannedRows = repairedMetadata.size === 0
      ? rows
      : rows.map((row) => (repairedMetadata.has(row.uid) ? { ...row, metadata: repairedMetadata.get(row.uid) } : row));

    const plan = planDuplicateBackfill(plannedRows);
    const pendingMarks = plan.marks.filter((mark) => mark.needsWrite);
    let duplicatesMarked = 0;
    let canonicalSourcesUpdated = 0;
    let legacyAmountRepairs = 0;
    let legacyAmountSkipped = 0;
    let writeErrors = 0;

    if (!dryRun) {
      // Rows whose repair did not land keep their stored metadata this run.
      const unrepaired = new Set<string>();
      for (const repair of legacyPlan?.repairs ?? []) {
        // Guarded: only a row still on the old parser is rewritten, so a row
        // the importer refreshed since the read is left alone.
        const { data, error } = await db
          .from('news_articles')
          .update({ metadata: repair.metadata, severity: repair.severity })
          .eq('uid', repair.uid)
          .is('metadata->incident_date_unknown', null)
          .is('metadata->>amount_parser', null)
          .select('uid');
        if (error) {
          writeErrors++;
          unrepaired.add(repair.uid);
        } else if (!data || data.length === 0) {
          legacyAmountSkipped++;
          unrepaired.add(repair.uid);
        } else {
          legacyAmountRepairs++;
        }
      }
      for (const mark of pendingMarks) {
        if (unrepaired.has(mark.uid)) continue;
        const { error } = await db.from('news_articles').update({ metadata: mark.metadata }).eq('uid', mark.uid);
        if (error) writeErrors++;
        else duplicatesMarked++;
      }
      for (const update of plan.canonicalUpdates) {
        if (unrepaired.has(update.uid)) continue;
        const { error } = await db.from('news_articles').update({ metadata: update.metadata }).eq('uid', update.uid);
        if (error) writeErrors++;
        else canonicalSourcesUpdated++;
      }
    }

    console.log(`[dedupe-incidents] dry_run=${dryRun} days=${days} duplicate_days=${duplicateDays} rows=${rows.length} groups=${plan.groups.length} duplicates=${plan.marks.length} pending=${pendingMarks.length} marked=${duplicatesMarked} canonical_updates=${canonicalSourcesUpdated} legacy_rows=${legacyPlan?.legacyRows ?? 0} legacy_repairs=${legacyAmountRepairs} legacy_skipped=${legacyAmountSkipped} write_errors=${writeErrors}`);
    return new Response(JSON.stringify({
      success: writeErrors === 0,
      dryRun,
      days,
      duplicateDays,
      rowsScanned: rows.length,
      groups: plan.groups.length,
      duplicatesFound: plan.marks.length,
      duplicatesToMark: pendingMarks.length,
      canonicalSourceUpdates: plan.canonicalUpdates.length,
      duplicatesMarked,
      canonicalSourcesUpdated,
      writeErrors,
      samples: plan.samples,
      ...(legacyPlan
        ? {
          // Rows still on the old parser; each gets the v2 stamp. 0 after a write run.
          legacyAmountRows: legacyPlan.legacyRows,
          // Of those, rows whose loss figure or severity changes.
          legacyAmountChanges: legacyPlan.changed,
          // Rows written (always 0 in a dry run).
          legacyAmountRepairs,
          // Rows another writer changed since the read; picked up next run.
          legacyAmountSkipped,
          legacyAmountSamples: legacyPlan.samples,
        }
        : {}),
    }), { status: writeErrors === 0 ? 200 : 207, headers: jsonHeaders });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith('Incident')
      ? error.message
      : 'Duplicate backfill failed';
    console.error(`[dedupe-incidents] ${message}`);
    return new Response(JSON.stringify({ success: false, error: message }), { status: 500, headers: jsonHeaders });
  }
});
