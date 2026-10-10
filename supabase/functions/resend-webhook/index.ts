import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.117.2';
import { emailHash, normalizeEmail } from '../_shared/email-compliance.ts';
import { lastEventFor, parseResendEvent, verifyResendSignature, type ResendEvent } from '../_shared/resend-webhook.ts';

// Resend delivery events (Svix-signed). Bounces and complaints go on the
// suppression list and turn the subscription off; every tracked event updates
// email_sends.last_event. Recipient addresses are never logged.
const MAX_BODY_BYTES = 256 * 1024;
const MAX_EVENT_ID_LENGTH = 100;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

async function suppress(db: SupabaseClient, event: ResendEvent, eventId: string | null): Promise<void> {
  const reason = event.kind === 'complaint' ? 'complaint' : 'bounce';
  const now = new Date().toISOString();
  for (const recipient of event.recipients) {
    const row = { email_hash: await emailHash(recipient), reason, source_event_id: eventId, updated_at: now };
    // A complaint overwrites any earlier reason; a bounce never replaces an
    // existing entry (a complaint or a manual suppression stays as it is).
    const { error } = await db.from('email_suppressions')
      .upsert(row, { onConflict: 'email_hash', ignoreDuplicates: reason === 'bounce' });
    if (error) throw new Error('email_suppressions write failed');

    const { error: subscriptionError } = await db.from('subscriptions')
      .update({ is_active: false, unsubscribed_at: now, updated_at: now })
      .eq('email', normalizeEmail(recipient))
      .eq('is_active', true);
    if (subscriptionError) throw new Error('subscription update failed');
  }
}

async function recordLastEvent(db: SupabaseClient, event: ResendEvent): Promise<void> {
  const lastEvent = lastEventFor(event.kind);
  if (!lastEvent || !event.emailId) return;
  let update = db.from('email_sends')
    .update({ last_event: lastEvent, updated_at: new Date().toISOString() })
    .eq('resend_id', event.emailId);
  // A late delivery or delay notice must not hide a bounce or complaint.
  if (lastEvent === 'delivered' || lastEvent === 'delivery_delayed') {
    update = update.or('last_event.is.null,last_event.in.(delivered,delivery_delayed)');
  }
  const { error } = await update;
  if (error) throw new Error('email_sends update failed');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });

  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return json({ error: 'payload too large' }, 413);
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength > MAX_BODY_BYTES) return json({ error: 'payload too large' }, 413);
  const body = new TextDecoder().decode(bytes);

  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !supabaseUrl || !serviceKey) return json({ error: 'not configured' }, 500);

  const svixId = req.headers.get('svix-id');
  const verified = await verifyResendSignature({
    secret,
    id: svixId,
    timestamp: req.headers.get('svix-timestamp'),
    signatureHeader: req.headers.get('svix-signature'),
    body,
    now: new Date(),
  });
  if (!verified) return json({ error: 'invalid signature' }, 401);

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  const event = parseResendEvent(payload);
  if (event.kind === 'ignored') return json({ ok: true });

  const eventId = event.eventId ?? (svixId ? svixId.slice(0, MAX_EVENT_ID_LENGTH) : null);
  const db = createClient(supabaseUrl, serviceKey);
  try {
    if (event.kind === 'bounce' || event.kind === 'complaint') await suppress(db, event, eventId);
    await recordLastEvent(db, event);
  } catch (error) {
    // A 5xx makes Resend retry; every write above is idempotent.
    console.error(`[resend-webhook] ${event.kind}:`, error instanceof Error ? error.message : 'unknown');
    return json({ error: 'processing failed' }, 500);
  }
  console.log(`[resend-webhook] processed ${event.kind} for ${event.recipients.length} recipient(s)`);
  return json({ ok: true });
});
