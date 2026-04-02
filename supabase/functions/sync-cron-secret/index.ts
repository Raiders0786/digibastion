import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (!cronSecret) {
      return new Response(JSON.stringify({ error: 'CRON_SECRET env var not set' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth: accept admin user JWT
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error } = await authClient.auth.getUser(token);
      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Invalid auth' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Verify admin
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data: roleData } = await supabase
        .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: 'Admin required' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Auth required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Connect directly to postgres to update vault
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: 'No DB URL configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { Pool } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const pool = new Pool(dbUrl, 1, true);
    const conn = await pool.connect();
    
    try {
      await conn.queryObject(`DELETE FROM vault.secrets WHERE name = 'CRON_SECRET'`);
      await conn.queryObject(`INSERT INTO vault.secrets (name, secret) VALUES ('CRON_SECRET', $1)`, [cronSecret]);
      
      // Verify
      const result = await conn.queryObject(`SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1`);
      const stored = (result.rows[0] as any)?.decrypted_secret;
      const matches = stored === cronSecret;
      
      return new Response(JSON.stringify({ 
        success: true, 
        verified: matches,
        message: matches ? 'CRON_SECRET synced to vault' : 'Sync done but verification mismatch'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } finally {
      conn.release();
      await pool.end();
    }
  } catch (error) {
    console.error('[sync-cron-secret] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
