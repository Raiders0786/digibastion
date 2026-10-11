import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { render } from "https://deno.land/x/resvg_wasm@0.2.0/mod.ts";
import { toNewsletterItem, type NewsletterSourceRow } from "../_shared/newsletter-content.ts";
import {
  incidentCardInput,
  renderIncidentCardSvg,
  renderQuizCardSvg,
  renderWeeklyCardSvg,
  weeklyCardInput,
} from "../_shared/og-card.ts";
import { isIndexableIncidentMetadata, SAFE_ARTICLE_ID, WEEK_START } from "../_shared/publishable.ts";
import { SITE_URL } from "../_shared/site-urls.ts";
import { isWeeklyPublicContent } from "../_shared/weekly-render.ts";

// Preview images. No `kind`: the quiz result card (u, s, b). `kind=incident&id=`
// and `kind=weekly&week=YYYY-MM-DD`: cards for incident and weekly pages.
// Anything missing, merged, retracted or not a Web3 incident redirects to the
// generic Threat Intel image, so a preview never shows a record we would not list.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400',
};

const FALLBACK_IMAGE = `${SITE_URL}/og-threat-intel.png`;
const ARTICLE_COLUMNS = 'id,uid,title,summary,severity,category,link,source_name,cve_id,tags,affected_technologies,created_at,metadata';

function fallback(): Response {
  // Short cache: the record may become listable later.
  return new Response(null, {
    status: 302,
    headers: { ...corsHeaders, 'Cache-Control': 'public, max-age=3600', Location: FALLBACK_IMAGE },
  });
}

async function image(svg: string, format: string): Promise<Response> {
  if (format === 'svg') {
    return new Response(svg, { headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml; charset=utf-8' } });
  }
  const png = await render(svg);
  return new Response(png, { headers: { ...corsHeaders, 'Content-Type': 'image/png' } });
}

function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return url && key ? createClient(url, key) : null;
}

async function incidentCard(id: string | null, format: string): Promise<Response> {
  if (!id || !SAFE_ARTICLE_ID.test(id)) return fallback();
  const db = serviceClient();
  if (!db) return fallback();
  const { data, error } = await db.from('news_articles').select(ARTICLE_COLUMNS).eq('id', id).maybeSingle();
  if (error || !data || !isIndexableIncidentMetadata((data as NewsletterSourceRow).metadata)) return fallback();
  const item = toNewsletterItem(data as NewsletterSourceRow, SITE_URL);
  return image(renderIncidentCardSvg(incidentCardInput(item)), format);
}

async function weeklyCard(week: string | null, format: string): Promise<Response> {
  if (!week || !WEEK_START.test(week)) return fallback();
  const db = serviceClient();
  if (!db) return fallback();
  const { data, error } = await db.rpc('get_weekly_newsletter', { p_week_start: week });
  const content = data && typeof data === 'object' ? (data as { content?: unknown }).content : null;
  if (error || !isWeeklyPublicContent(content)) return fallback();
  return image(renderWeeklyCardSvg(weeklyCardInput(content)), format);
}

async function fetchAvatarAsBase64(username: string): Promise<string | null> {
  try {
    const response = await fetch(`https://unavatar.io/twitter/${encodeURIComponent(username)}?fallback=false`, {
      headers: { 'User-Agent': 'Digibastion-OG/1.0' },
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const type = (response.headers.get('content-type') || 'image/png').split(';')[0].trim();
    return `data:${type};base64,${base64}`;
  } catch {
    return null;
  }
}

async function quizCard(url: URL, format: string): Promise<Response> {
  const username = url.searchParams.get('u') || 'anon';
  const score = parseInt(url.searchParams.get('s') || '0', 10);
  const badgesParam = url.searchParams.get('b') || '';
  const badges = badgesParam
    ? badgesParam.split(',').map((b) => decodeURIComponent(b).replace(/[^\x20-\x7E]/g, '').trim()).filter((b) => b.length > 0).slice(0, 3)
    : [];
  const avatarDataUri = await fetchAvatarAsBase64(username);
  return image(renderQuizCardSvg({ username, score, badges, avatarDataUri }), format);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get('format') || 'png').toLowerCase();
    const kind = url.searchParams.get('kind');
    if (kind === 'incident') return await incidentCard(url.searchParams.get('id'), format);
    if (kind === 'weekly') return await weeklyCard(url.searchParams.get('week'), format);
    return await quizCard(url, format);
  } catch (error) {
    console.error('Error generating OG image:', error instanceof Error ? error.message : 'unknown error');
    const kind = new URL(req.url).searchParams.get('kind');
    if (kind === 'incident' || kind === 'weekly') return fallback();
    return new Response(JSON.stringify({ error: 'Image could not be generated' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
