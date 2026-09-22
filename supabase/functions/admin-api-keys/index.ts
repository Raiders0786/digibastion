import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
  .map(byte => byte.toString(16).padStart(2, '0')).join('');
const generateKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return `db_live_${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(byte => chars[byte % chars.length]).join('')}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
  const url = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !anonKey || !serviceKey) return json({ error: 'Server configuration error' }, 500);
  const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: claimsError } = await authClient.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsError || typeof userId !== 'string') return json({ error: 'Unauthorized' }, 401);
  const admin = createClient(url, serviceKey);
  const { data: role } = await admin.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
  if (!role) return json({ error: 'Admin access required' }, 403);

  try {
    const body = await req.json();
    const action = body.action;
    if (action === 'create') {
      const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
      if (!name) return json({ error: 'A key name is required' }, 400);
      const expiresAt = body.expires_at ? new Date(body.expires_at) : null;
      if (expiresAt && Number.isNaN(expiresAt.getTime())) return json({ error: 'Invalid expiry date' }, 400);
      const rawKey = generateKey();
      const { data: key, error } = await admin.from('api_keys').insert({ key_hash: await hash(rawKey), name, permissions: ['read:threat-intel'], is_active: true, created_by: userId, expires_at: expiresAt?.toISOString() || null }).select('id').single();
      if (error || !key) return json({ error: 'Failed to create API key' }, 500);
      await admin.from('api_key_admin_audit').insert({ api_key_id: key.id, actor_user_id: userId, action: 'created', details: { name } });
      return json({ success: true, data: { id: key.id, raw_key: rawKey } });
    }
    if (!['set-active', 'retire'].includes(action) || typeof body.id !== 'string') return json({ error: 'Invalid action' }, 400);
    const { data: key } = await admin.from('api_keys').select('id, name, retired_at').eq('id', body.id).maybeSingle();
    if (!key) return json({ error: 'API key not found' }, 404);
    if (action === 'retire') {
      if (key.retired_at) return json({ success: true });
      const { error } = await admin.from('api_keys').update({ is_active: false, retired_at: new Date().toISOString(), retired_by: userId }).eq('id', key.id);
      if (error) return json({ error: 'Failed to retire API key' }, 500);
      await admin.from('api_key_admin_audit').insert({ api_key_id: key.id, actor_user_id: userId, action: 'retired', details: { name: key.name } });
      return json({ success: true });
    }
    if (key.retired_at) return json({ error: 'Retired keys cannot be reactivated' }, 400);
    const isActive = body.is_active === true;
    const { error } = await admin.from('api_keys').update({ is_active: isActive }).eq('id', key.id);
    if (error) return json({ error: 'Failed to update API key' }, 500);
    await admin.from('api_key_admin_audit').insert({ api_key_id: key.id, actor_user_id: userId, action: isActive ? 'reactivated' : 'revoked', details: { name: key.name } });
    return json({ success: true });
  } catch (error) {
    console.error('[admin-api-keys]', error);
    return json({ error: 'Internal server error' }, 500);
  }
});