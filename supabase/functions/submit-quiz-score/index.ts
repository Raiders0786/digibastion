import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,50}$/;
const QUESTION_RULES: Record<number, { scores: number[]; category: string }> = {
  1:{scores:[10,30,60,100],category:'custody'},2:{scores:[5,15,85,100],category:'social'},
  3:{scores:[5,25,90,100],category:'verification'},4:{scores:[5,30,70,100],category:'backup'},
  5:{scores:[5,15,60,100],category:'device'},6:{scores:[10,25,60,100],category:'auth'},
  7:{scores:[5,30,85,100],category:'verification'},8:{scores:[5,20,85,100],category:'verification'},
  9:{scores:[10,30,70,100],category:'custody'},10:{scores:[5,40,75,100],category:'network'},
  11:{scores:[5,20,85,100],category:'social'},12:{scores:[5,30,65,100],category:'verification'},
  13:{scores:[10,40,80,100],category:'device'},14:{scores:[5,25,60,100],category:'privacy'},
  15:{scores:[10,20,70,100],category:'verification'},16:{scores:[5,25,75,100],category:'social'},
  17:{scores:[5,30,70,100],category:'custody'},18:{scores:[10,30,70,100],category:'device'},
  19:{scores:[5,15,80,100],category:'social'},20:{scores:[15,40,80,100],category:'auth'},
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});
const hash = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))
  .map(byte => byte.toString(16).padStart(2, '0')).join('');
const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
const hmac = async (value: string, secret: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))))
    .map(byte => byte.toString(16).padStart(2, '0')).join('');
};
const constantTimeEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
};
const characterFor = (score: number) => score >= 90 ? 'Satoshi-Level' : score >= 75 ? 'Whale Guard' : score >= 60 ? 'Diamond Hands' : score >= 45 ? 'Degen Defender' : score >= 30 ? 'Paper Hands' : 'Rekt Waiting';
const badgesFor = (score: number, categories: Record<string, number>) => {
  const badges: string[] = [];
  if (score >= 90) badges.push('🏆 OpSec Master');
  if (score >= 70) badges.push('🛡️ Security Conscious');
  if ((categories.custody || 0) >= 80) badges.push('🔐 Key Guardian');
  if ((categories.verification || 0) >= 80) badges.push('🔍 Transaction Auditor');
  if ((categories.privacy || 0) >= 80) badges.push('👤 Privacy Advocate');
  if ((categories.device || 0) >= 80) badges.push('💻 Device Defender');
  if (Object.keys(categories).length > 0 && Object.values(categories).every(value => value >= 50)) badges.push('⚖️ Balanced Security');
  return badges;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    const username = typeof body.username === 'string' ? body.username.trim().replace(/^@/, '').toLowerCase() : '';
    const sessionToken = typeof body.session_token === 'string' ? body.session_token : '';
    const answers = Array.isArray(body.answers) ? body.answers : [];
    if (!USERNAME_REGEX.test(username)) return json({ error: 'Username can only contain letters, numbers, and underscores' }, 400);
    if (!sessionToken || answers.length !== 8) return json({ error: 'Complete all quiz questions before submitting.' }, 400);

    const url = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) return json({ error: 'Server configuration error' }, 500);
    const supabase = createClient(url, serviceKey);
    const { data: session } = await supabase.from('quiz_sessions').select('id, question_ids, ip_hash, expires_at, completed_at').eq('session_token', sessionToken).maybeSingle();
    if (!session || session.completed_at || new Date(session.expires_at) < new Date()) return json({ error: 'Invalid, expired, or already submitted session.' }, 400);

    const questionIds = (session.question_ids as number[]).map(Number);
    const currentIpHash = await hash(clientIp(req));
    const [tokenSessionId, suppliedSignature, ...extraTokenParts] = sessionToken.split('.');
    const expectedSignature = await hmac(`${session.id}:${questionIds.join(',')}:${session.ip_hash}`, serviceKey);
    if (extraTokenParts.length > 0 || tokenSessionId !== session.id || !suppliedSignature || !constantTimeEqual(suppliedSignature, expectedSignature) || !constantTimeEqual(currentIpHash, session.ip_hash)) {
      return json({ error: 'Quiz session verification failed.' }, 401);
    }
    const answerMap = new Map<number, number>();
    for (const answer of answers) {
      const questionId = Number(answer?.questionId);
      const optionIndex = Number(answer?.optionIndex);
      if (!Number.isInteger(questionId) || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3 || answerMap.has(questionId)) {
        return json({ error: 'Invalid quiz answers.' }, 400);
      }
      answerMap.set(questionId, optionIndex);
    }
    if (questionIds.some(id => !answerMap.has(id)) || [...answerMap.keys()].some(id => !questionIds.includes(id))) return json({ error: 'Answers do not match this quiz session.' }, 400);

    const categoryTotals: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    let total = 0;
    for (const id of questionIds) {
      const rule = QUESTION_RULES[id];
      const index = answerMap.get(id);
      if (!rule || index === undefined) return json({ error: 'Invalid quiz question.' }, 400);
      const value = rule.scores[index];
      total += value;
      categoryTotals[rule.category] = (categoryTotals[rule.category] || 0) + value;
      categoryCounts[rule.category] = (categoryCounts[rule.category] || 0) + 1;
    }
    const score = Math.round(total / questionIds.length);
    const categoryScores = Object.fromEntries(Object.entries(categoryTotals).map(([category, value]) => [category, Math.round(value / categoryCounts[category])]));
    const character = characterFor(score);
    const badges = badgesFor(score, categoryScores);

    const ipHash = currentIpHash;
    const usernameHash = await hash(username);
    for (const [scope, identifier, max] of [['quiz:ip', ipHash, 5], ['quiz:username', usernameHash, 3]] as const) {
      const { data, error } = await supabase.rpc('consume_rate_limit', { _scope: scope, _identifier_hash: identifier, _max_attempts: max, _window_seconds: 3600 });
      if (error) return json({ error: 'Unable to verify submission limits.' }, 500);
      if (!data?.allowed) return json({ error: 'Quiz submission rate limit reached. Please try again later.' }, 429);
    }

    const { data: claimed, error: claimError } = await supabase.from('quiz_sessions').update({ completed_at: new Date().toISOString() }).eq('id', session.id).is('completed_at', null).select('id').maybeSingle();
    if (claimError || !claimed) return json({ error: 'This quiz session has already been submitted.' }, 409);

    if (username !== 'anon') {
      const { data: existing } = await supabase.from('quiz_scores').select('id, score').eq('username', username).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from('quiz_scores').insert({ username, score, badge_count: badges.length, character_rank: character });
        if (error) {
          await supabase.from('quiz_sessions').update({ completed_at: null }).eq('id', session.id);
          return json({ error: 'Failed to save score.' }, 500);
        }
      } else if (score > existing.score) {
        const { error } = await supabase.from('quiz_scores').update({ score, badge_count: badges.length, character_rank: character, created_at: new Date().toISOString() }).eq('id', existing.id);
        if (error) {
          await supabase.from('quiz_sessions').update({ completed_at: null }).eq('id', session.id);
          return json({ error: 'Failed to update score.' }, 500);
        }
      }
    }

    return json({ success: true, message: username === 'anon' ? 'Score verified privately.' : 'Score verified and recorded.', result: { score, categoryScores, character_rank: character, badges } });
  } catch (error) {
    console.error('[submit-quiz-score]', error);
    return json({ error: 'An unexpected error occurred' }, 500);
  }
});