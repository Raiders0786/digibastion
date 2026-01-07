import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation constants
const MAX_USERNAME_LENGTH = 50;
const MIN_USERNAME_LENGTH = 1;
const MAX_SCORE = 100;
const MIN_SCORE = 0;
const MAX_BADGES = 10;
const MAX_BADGE_LENGTH = 50;
const MAX_RANK_LENGTH = 50;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_IP = 5;
const MAX_SUBMISSIONS_PER_USERNAME = 3;

// Valid character ranks
const VALID_RANKS = [
  'Satoshi-Level',
  'Whale Guard',
  'Diamond Hands',
  'Degen Defender',
  'Paper Hands',
  'Rekt Waiting'
];

// Username regex - alphanumeric, underscores, no spaces
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

// Get client IP
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

// Simple hash function for rate limiting (not cryptographic)
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sanitize username
function sanitizeUsername(username: string): string {
  return username
    .trim()
    .replace(/^@/, '') // Remove leading @
    .toLowerCase()
    .slice(0, MAX_USERNAME_LENGTH);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    const ipHash = await hashString(clientIP);

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { username, score, badge_count, character_rank } = body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedUsername = sanitizeUsername(username);

    if (sanitizedUsername.length < MIN_USERNAME_LENGTH) {
      return new Response(
        JSON.stringify({ error: 'Username is too short' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!USERNAME_REGEX.test(sanitizedUsername)) {
      return new Response(
        JSON.stringify({ error: 'Username can only contain letters, numbers, and underscores' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate score
    if (typeof score !== 'number' || score < MIN_SCORE || score > MAX_SCORE || !Number.isInteger(score)) {
      return new Response(
        JSON.stringify({ error: 'Score must be an integer between 0 and 100' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate badge count
    if (typeof badge_count !== 'number' || badge_count < 0 || badge_count > MAX_BADGES || !Number.isInteger(badge_count)) {
      return new Response(
        JSON.stringify({ error: 'Invalid badge count' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate character rank
    if (!character_rank || typeof character_rank !== 'string' || !VALID_RANKS.includes(character_rank)) {
      return new Response(
        JSON.stringify({ error: 'Invalid character rank' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
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

    // Hash username for rate limiting
    const usernameHash = await hashString(sanitizedUsername);

    // Check rate limits
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

    // Check IP rate limit
    const { count: ipCount, error: ipCountError } = await supabase
      .from('quiz_submission_log')
      .select('*', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('submitted_at', oneHourAgo);

    if (ipCountError) {
      console.error('Error checking IP rate limit:', ipCountError);
    } else if (ipCount && ipCount >= MAX_SUBMISSIONS_PER_IP) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many submissions. Please try again later.',
          retryAfter: 3600
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check username rate limit
    const { count: usernameCount, error: usernameCountError } = await supabase
      .from('quiz_submission_log')
      .select('*', { count: 'exact', head: true })
      .eq('username_hash', usernameHash)
      .gte('submitted_at', oneHourAgo);

    if (usernameCountError) {
      console.error('Error checking username rate limit:', usernameCountError);
    } else if (usernameCount && usernameCount >= MAX_SUBMISSIONS_PER_USERNAME) {
      return new Response(
        JSON.stringify({ 
          error: 'This username has reached the submission limit. Please try again later.',
          retryAfter: 3600
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this submission for rate limiting
    const { error: logError } = await supabase
      .from('quiz_submission_log')
      .insert({
        ip_hash: ipHash,
        username_hash: usernameHash,
        submitted_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging submission:', logError);
      // Continue anyway - don't fail the submission
    }

    // Check if this username already has a score
    const { data: existingScore, error: checkError } = await supabase
      .from('quiz_scores')
      .select('id, score')
      .eq('username', sanitizedUsername)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error checking existing score:', checkError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user exists and new score is not higher, don't update
    if (existingScore && existingScore.score >= score) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Score recorded (existing higher score kept)',
          score: existingScore.score
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If user exists and new score is higher, update
    if (existingScore) {
      const { error: updateError } = await supabase
        .from('quiz_scores')
        .update({
          score,
          badge_count,
          character_rank,
          created_at: new Date().toISOString() // Update timestamp
        })
        .eq('id', existingScore.id);

      if (updateError) {
        console.error('Error updating score:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update score' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Score updated!' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert new score
    const { error: insertError } = await supabase
      .from('quiz_scores')
      .insert({
        username: sanitizedUsername,
        score,
        badge_count,
        character_rank
      });

    if (insertError) {
      console.error('Error inserting score:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save score' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Score saved to leaderboard!' }),
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