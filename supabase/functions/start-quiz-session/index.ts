import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get client IP
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

// Hash function for IP
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate HMAC signature for session token
async function generateHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Shuffle array deterministically with seed
function shuffleWithSeed(array: number[], seed: number): number[] {
  const result = [...array];
  let m = result.length;
  while (m) {
    const i = Math.floor((seed = (seed * 9301 + 49297) % 233280) / 233280 * m--);
    [result[m], result[i]] = [result[i], result[m]];
  }
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    const ipHash = await hashString(clientIP);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Rate limit: max 10 quiz sessions per hour per IP
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: sessionCount, error: countError } = await supabase
      .from('quiz_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('started_at', oneHourAgo);
    
    if (countError) {
      console.error('Error checking rate limit:', countError);
    } else if (sessionCount && sessionCount >= 10) {
      return new Response(
        JSON.stringify({ error: 'Too many quiz attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate random 8 question IDs from pool of 20
    const allQuestionIds = Array.from({ length: 20 }, (_, i) => i + 1);
    const seed = Date.now() + Math.floor(Math.random() * 10000);
    const shuffled = shuffleWithSeed(allQuestionIds, seed);
    const selectedQuestionIds = shuffled.slice(0, 8);
    
    // Generate session token with HMAC
    const sessionId = crypto.randomUUID();
    const tokenData = `${sessionId}:${selectedQuestionIds.join(',')}:${ipHash}`;
    const signature = await generateHMAC(tokenData, supabaseServiceKey);
    const sessionToken = `${sessionId}.${signature}`;
    
    // Store session in database
    const { error: insertError } = await supabase
      .from('quiz_sessions')
      .insert({
        session_token: sessionToken,
        question_ids: selectedQuestionIds,
        ip_hash: ipHash,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
      });
    
    if (insertError) {
      console.error('Error creating quiz session:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to start quiz session' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Cleanup expired sessions (fire and forget)
    supabase.rpc('cleanup_expired_quiz_sessions').then(({ error }) => {
      if (error) console.error('Error cleaning up sessions:', error);
    });
    
    console.log(`Quiz session started: ${sessionId}, questions: ${selectedQuestionIds.join(',')}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        questionIds: selectedQuestionIds
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
