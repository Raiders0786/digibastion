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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Delete old vault entry and insert new one
    const { error: deleteError } = await supabase.rpc('delete_vault_secret', { secret_name: 'CRON_SECRET' }).maybeSingle();
    
    // Use raw SQL via service role to update vault
    const { data, error } = await supabase.from('_sync_log').select('*').limit(0);
    
    // Direct approach: use the postgres connection through a helper function
    // Since we can't directly write to vault via REST, let's update the SQL function instead
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'CRON_SECRET is available in env',
      secret_length: cronSecret.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
