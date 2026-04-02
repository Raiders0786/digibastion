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
    // Only allow if caller provides the CRON_SECRET itself (proves they know it)
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('authorization');
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use direct postgres connection via service role to update vault
    const dbUrl = Deno.env.get('SUPABASE_DB_URL');
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: 'No DB URL' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Connect directly to postgres to update vault
    const { Pool } = await import('https://deno.land/x/postgres@v0.17.0/mod.ts');
    const pool = new Pool(dbUrl, 1, true);
    const conn = await pool.connect();
    
    try {
      // Delete existing and insert new
      await conn.queryObject(`DELETE FROM vault.secrets WHERE name = 'CRON_SECRET'`);
      await conn.queryObject(`INSERT INTO vault.secrets (name, secret) VALUES ('CRON_SECRET', $1)`, [cronSecret]);
      
      // Verify it works
      const result = await conn.queryObject(`SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1`);
      const stored = (result.rows[0] as any)?.decrypted_secret;
      const matches = stored === cronSecret;
      
      return new Response(JSON.stringify({ 
        success: true, 
        verified: matches,
        message: matches ? 'CRON_SECRET synced to vault successfully' : 'Sync completed but verification failed'
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
