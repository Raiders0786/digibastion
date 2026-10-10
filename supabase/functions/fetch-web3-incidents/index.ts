import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.117.2";
import { recordIngestionRun } from '../_shared/ingestion-health.ts';
import { classifyCollectedWeb3Incident } from './classifier.ts';
import { severityFromLoss } from '../_shared/incident-severity.ts';
import {
  extractSources,
  formatUsd,
  parseIncidentDate,
  parseUsdAmount,
  web3IncidentSources,
} from './parsing.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Obfuscated internal source identifiers (base64 encoded for privacy in open source)
const _s1 = atob('d2ViM2lzZ29pbmdncmVhdC5jb20='); // Primary source
// The secondary page scrape (feed-2) was retired: the QuillMonitor partner API
// returns the same incidents with stable IDs and verification status.

// Extract affected technologies
function extractTechnologies(title: string, content: string, chain?: string): string[] {
  const techs: string[] = [];
  const textLower = (title + ' ' + content).toLowerCase();
  
  // Add chain if provided
  if (chain) {
    techs.push(chain);
  }
  
  const techPatterns = [
    { pattern: /ethereum/i, tech: 'Ethereum' },
    { pattern: /bitcoin/i, tech: 'Bitcoin' },
    { pattern: /solana/i, tech: 'Solana' },
    { pattern: /defi/i, tech: 'DeFi' },
    { pattern: /nft/i, tech: 'NFT' },
    { pattern: /smart contract/i, tech: 'Smart Contracts' },
    { pattern: /metamask/i, tech: 'MetaMask' },
    { pattern: /ledger/i, tech: 'Ledger' },
    { pattern: /binance/i, tech: 'Binance' },
    { pattern: /tornado cash/i, tech: 'Tornado Cash' },
    { pattern: /uniswap/i, tech: 'Uniswap' },
    { pattern: /aave/i, tech: 'Aave' },
    { pattern: /curve/i, tech: 'Curve' },
    { pattern: /flow/i, tech: 'Flow' },
    { pattern: /polygon/i, tech: 'Polygon' },
    { pattern: /arbitrum/i, tech: 'Arbitrum' },
    { pattern: /optimism/i, tech: 'Optimism' },
    { pattern: /avalanche/i, tech: 'Avalanche' },
    { pattern: /bridge/i, tech: 'Cross-chain Bridge' },
    { pattern: /flash loan/i, tech: 'Flash Loans' },
    { pattern: /stablecoin/i, tech: 'Stablecoins' },
    { pattern: /wallet/i, tech: 'Wallet' },
    { pattern: /base/i, tech: 'Base' },
    { pattern: /sui/i, tech: 'Sui' },
    { pattern: /hyperliquid/i, tech: 'HyperLiquid' },
  ];
  
  for (const { pattern, tech } of techPatterns) {
    if (pattern.test(title) || pattern.test(content)) {
      if (!techs.includes(tech)) {
        techs.push(tech);
      }
    }
  }
  
  return [...new Set(techs)].slice(0, 5);
}

// Extract tags from content
function extractTags(content: string, issueType?: string, category?: string): string[] {
  const tags: string[] = [];
  
  // Add issue type as tag
  if (issueType) {
    const cleanIssue = issueType.toLowerCase().replace(/\s+/g, '-');
    if (!tags.includes(cleanIssue)) tags.push(cleanIssue);
  }
  
  // Add category as tag
  if (category) {
    const cleanCat = category.toLowerCase().replace(/\s+/g, '-');
    if (!tags.includes(cleanCat)) tags.push(cleanCat);
  }
  
  const textLower = content.toLowerCase();
  if (textLower.includes('exploit') && !tags.includes('exploit')) tags.push('exploit');
  if (textLower.includes('hack') && !tags.includes('hack')) tags.push('hack');
  if (textLower.includes('scam') && !tags.includes('scam')) tags.push('scam');
  if (textLower.includes('rug pull') && !tags.includes('rug-pull')) tags.push('rug-pull');
  if (textLower.includes('phishing') && !tags.includes('phishing')) tags.push('phishing');
  if (textLower.includes('flash loan') && !tags.includes('flash-loan')) tags.push('flash-loan');
  if (textLower.includes('supply chain') && !tags.includes('supply-chain')) tags.push('supply-chain');
  if (textLower.includes('address poisoning') && !tags.includes('address-poisoning')) tags.push('address-poisoning');
  if (textLower.includes('infinite mint') && !tags.includes('infinite-mint')) tags.push('infinite-mint');
  if (textLower.includes('reentrancy') && !tags.includes('reentrancy')) tags.push('reentrancy');
  if (textLower.includes('oracle') && !tags.includes('oracle')) tags.push('oracle');
  if (textLower.includes('access control') && !tags.includes('access-control')) tags.push('access-control');
  if (textLower.includes('private key') && !tags.includes('private-key-compromise')) tags.push('private-key-compromise');
  
  return [...new Set(tags.filter(t => t.length > 0))].slice(0, 10);
}

// Generate SHA256 hash for deduplication
async function generateUID(title: string, date: string, source: string = 'primary'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(title + date + source);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Parse incidents from primary source (web3isgoinggreat.com)
async function parsePrimaryIncidents(markdown: string): Promise<any[]> {
  const incidents: any[] = [];
  
  // Split by date headers (e.g., "January 8, 2026")
  const datePattern = /(?:^|\n)((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})/g;
  
  const sections: { date: string; content: string }[] = [];
  let lastIndex = 0;
  let lastDate = '';
  let match;
  
  while ((match = datePattern.exec(markdown)) !== null) {
    if (lastDate && lastIndex < match.index) {
      sections.push({
        date: lastDate,
        content: markdown.slice(lastIndex, match.index).trim()
      });
    }
    lastDate = match[1];
    lastIndex = match.index + match[0].length;
  }
  
  if (lastDate && lastIndex < markdown.length) {
    sections.push({
      date: lastDate,
      content: markdown.slice(lastIndex).trim()
    });
  }
  
  for (const section of sections) {
    const incidentPattern = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##|\n(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d|$)/g;
    
    let incidentMatch;
    while ((incidentMatch = incidentPattern.exec(section.content)) !== null) {
      const title = incidentMatch[1].trim();
      const content = incidentMatch[2].trim();
      
      if (title.toLowerCase().includes('filter') || title.toLowerCase().includes('about')) {
        continue;
      }
      
      // A missing date stays unknown instead of silently becoming "today".
      const incidentDate = parseIncidentDate(section.date);
      const ingestedAt = new Date().toISOString();
      const amountUsd = parseUsdAmount(`${title} ${content}`);
      const sources = extractSources(content);
      const classification = classifyCollectedWeb3Incident(title, content);
      const category = classification.category;
      const technologies = extractTechnologies(title, content);
      const tags = extractTags(content);
      // Loss-based rubric shared with QuillMonitor and SlowMist. All attack
      // tags are passed (not only tags[0], which is usually "exploit"), so a
      // "private-key-compromise" tag still raises an unknown-loss incident.
      const severity = severityFromLoss(amountUsd, tags.join(' '));
      
      const primarySource = sources[0]?.url || '';
      const uid = await generateUID(title, section.date, 'p');
      
      // Clean content
      const cleanContent = content
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\[\(attribution\)\]\([^)]+\)/g, '')
        .replace(/\(attribution\)/gi, '')
        .replace(/\[\[archive\]\]\([^)]+\)/g, '')
        .replace(/\[\\?\[archive\\?\]\]/g, '')
        .replace(/^-\s*\[.+$/gm, '')
        .replace(/\(https?:\/\/(?:web\.)?archive\.org[^)]*\)/g, '')
        .replace(/\(https?:\/\/www\.web3isgoinggreat\.com[^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\(https?:\/\/[^)]+\)/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/^-\s*"[^"]*",?\s*_[^_]+_.*$/gm, '')
        .replace(/^-\s*,?\s*_[^_]+_.*$/gm, '')
        .replace(/^-\s*,?\s*$/gm, '')
        .replace(/^-\s*$/gm, '')
        .replace(/Other entries related to[^\n]+/gi, '')
        .replace(/\n*Theme tags?:[^\n]+/gi, '')
        .replace(/\n*Tech tags?:[^\n]+/gi, '')
        .replace(/\n*Blockchain tags?:[^\n]+/gi, '')
        .replace(/!\[\]\([^)]+\/icons\/[^)]+\)/g, '')
        .replace(/id:[a-f0-9-]+/gi, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\n\s*\n\s*$/g, '')
        .trim();
      
      let summary = cleanContent.split('\n\n')[0].replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      if (summary.startsWith('!') || summary.startsWith('[')) {
        const parts = cleanContent.split('\n\n');
        summary = parts.find(p => p.length > 50 && !p.startsWith('!') && !p.startsWith('[') && !p.startsWith('-')) || parts[0];
        summary = summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      }
      if (summary.length > 500) summary = summary.substring(0, 497) + '...';
      
      const sourceLinks = sources.length > 0 ? JSON.stringify(sources) : null;
      
      // Build rich metadata for future analysis
      const metadata = {
        provider: 'web3-incidents',
        security_domain: classification.securityDomain,
        is_web3_incident: true,
        taxonomy_version: classification.taxonomyVersion,
        classification_reasons: classification.reasons,
        amount_lost_usd: amountUsd, // Full USD, never millions
        amount_display: formatUsd(amountUsd),
        attack_type: tags[0] || null,
        incident_date: incidentDate,
        incident_date_unknown: incidentDate === null,
        reference_url: primarySource || null,
        summary_origin: 'publisher',
        sources: web3IncidentSources(sources, amountUsd),
        data_source: 'feed-1',
        scraped_at: ingestedAt,
      };
      
      incidents.push({
        uid,
        title,
        summary,
        content: cleanContent.substring(0, 2000),
        link: primarySource || 'https://www.web3isgoinggreat.com/',
        source_url: sourceLinks,
        source_name: null,
        author: null,
        category,
        severity,
        tags,
        affected_technologies: technologies,
        cve_id: null,
        published_at: incidentDate ? `${incidentDate}T00:00:00.000Z` : ingestedAt,
        raw_content: content,
        is_processed: false,
        metadata
      });
    }
  }
  
  return incidents;
}

serve(async (req) => {
  const startedAt = Date.now();
  const attemptedAt = new Date().toISOString();
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: require CRON_SECRET or admin JWT
  const cronSecret = Deno.env.get('CRON_SECRET');
  const authHeader = req.headers.get('authorization');
  let authorized = false;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    authorized = true;
  } else if (authHeader?.startsWith('Bearer ')) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const token = authHeader.replace('Bearer ', '');
      if (token === serviceKey) {
        authorized = true;
      } else {
        const authClient = createClient(supabaseUrl, anonKey);
        const { data: { user } } = await authClient.auth.getUser(token);
        if (user) {
          const admin = createClient(supabaseUrl, serviceKey);
          const { data: roleData } = await admin
            .from('user_roles').select('role')
            .eq('user_id', user.id).eq('role', 'admin').maybeSingle();
          if (roleData) authorized = true;
        }
      }
    } catch (_) { /* deny */ }
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('[fetch-web3-incidents] Starting multi-source fetch...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (!firecrawlApiKey) {
      console.error('[fetch-web3-incidents] FIRECRAWL_API_KEY not configured');
      await recordIngestionRun(supabase, {
        pipeline: 'web3-incidents', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
        success: false, duration_ms: Date.now() - startedAt,
        error_summary: 'Provider configuration is incomplete',
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const allIncidents: any[] = [];
    const sourceResults: { source: string; found: number; errors: string[] }[] = [];
    
    // Fetch from primary source
    try {
      console.log('[fetch-web3-incidents] Fetching from primary source...');
      const response1 = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.${_s1}/`,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 3000,
        }),
      });
      
      if (response1.ok) {
        const data1 = await response1.json();
        const md1 = data1.data?.markdown || data1.markdown || '';
        if (md1) {
          const incidents1 = await parsePrimaryIncidents(md1);
          allIncidents.push(...incidents1);
          sourceResults.push({ source: 'primary', found: incidents1.length, errors: [] });
          console.log(`[fetch-web3-incidents] Primary source: ${incidents1.length} incidents`);
        } else {
          sourceResults.push({ source: 'primary', found: 0, errors: ['Empty provider response'] });
        }
      } else {
        sourceResults.push({ source: 'primary', found: 0, errors: ['Failed to fetch'] });
      }
    } catch (e) {
      console.error('[fetch-web3-incidents] Primary source error:', e);
      sourceResults.push({ source: 'primary', found: 0, errors: [e instanceof Error ? e.message : 'Unknown source error'] });
    }
    
    console.log(`[fetch-web3-incidents] Total incidents from all sources: ${allIncidents.length}`);
    
    // Calculate cutoff date (90 days for historical coverage)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const recentIncidents = allIncidents.filter(incident => {
      const pubDate = new Date(incident.published_at);
      return pubDate >= ninetyDaysAgo;
    });
    
    console.log(`[fetch-web3-incidents] ${recentIncidents.length} incidents within last 90 days`);
    
    // Deduplicate across sources: extract project name and check for similar incidents
    function extractProjectName(title: string): string {
      // Extract first meaningful part of title
      return title
        .split(' - ')[0]
        .split(' exploited')[0]
        .split(' suffers')[0]
        .split(' loses')[0]
        .split(' hit by')[0]
        .toLowerCase()
        .trim();
    }
    
    // Group by project name + approximate date to find duplicates
    const seenProjects = new Map<string, any>();
    const deduplicatedIncidents: any[] = [];
    
    for (const incident of recentIncidents) {
      const projectName = extractProjectName(incident.title);
      const dateKey = new Date(incident.published_at).toISOString().slice(0, 10); // YYYY-MM-DD
      const key = `${projectName}|${dateKey}`;
      
      // Check for existing within 7 days
      let isDuplicate = false;
      for (const [existingKey, existing] of seenProjects) {
        const [existingProject, existingDate] = existingKey.split('|');
        if (existingProject === projectName) {
          const daysDiff = Math.abs(
            (new Date(dateKey).getTime() - new Date(existingDate).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff <= 7) {
            // Prefer feed-1 (primary) over feed-2, or longer content
            const incidentSource = incident.metadata?.data_source || 'feed-1';
            const existingSource = existing.metadata?.data_source || 'feed-1';
            if (incidentSource === 'feed-2' && existingSource === 'feed-1') {
              isDuplicate = true;
              break;
            }
            if (incidentSource === 'feed-1' && existingSource === 'feed-2') {
              // Replace with feed-1 version
              seenProjects.delete(existingKey);
              break;
            }
            // Same source - keep the one with more content
            if ((incident.content?.length || 0) <= (existing.content?.length || 0)) {
              isDuplicate = true;
              break;
            }
            seenProjects.delete(existingKey);
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        seenProjects.set(key, incident);
        deduplicatedIncidents.push(incident);
      }
    }
    
    console.log(`[fetch-web3-incidents] After dedup: ${deduplicatedIncidents.length} unique incidents`);
    
    // Check for existing similar entries in database before inserting
    let insertedCount = 0;
    let duplicateCount = 0;
    let skippedSimilar = 0;
    const errors: string[] = [];
    
    for (const incident of deduplicatedIncidents) {
      const projectName = extractProjectName(incident.title);
      const incidentDate = new Date(incident.published_at);
      const dateMin = new Date(incidentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dateMax = new Date(incidentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Check for similar existing entry
      const { data: existing } = await supabase
        .from('news_articles')
        .select('id, title')
        .gte('published_at', dateMin.toISOString())
        .lte('published_at', dateMax.toISOString())
        .limit(50);
      
      const hasSimilar = existing?.some(e => {
        const existingProject = extractProjectName(e.title);
        return existingProject === projectName;
      });
      
      if (hasSimilar) {
        skippedSimilar++;
        continue;
      }
      
      const { error: insertError } = await supabase
        .from('news_articles')
        .upsert(incident, { onConflict: 'uid', ignoreDuplicates: true });
      
      if (insertError) {
        if (insertError.code === '23505') {
          duplicateCount++;
        } else {
          console.error('[fetch-web3-incidents] Insert error:', insertError);
          errors.push(`${incident.title}: ${insertError.message}`);
        }
      } else {
        insertedCount++;
      }
    }
    
    console.log(`[fetch-web3-incidents] Inserted: ${insertedCount}, Duplicates: ${duplicateCount}, Similar: ${skippedSimilar}`);
    const sourceFailures = sourceResults.filter((source) => source.errors.length > 0).length;
    const sourcesSucceeded = sourceResults.length - sourceFailures;
    const categoryCounts = deduplicatedIncidents.reduce((counts: Record<string, number>, incident) => {
      counts[incident.category] = (counts[incident.category] || 0) + 1;
      return counts;
    }, {});
    await recordIngestionRun(supabase, {
      pipeline: 'web3-incidents', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
      success: errors.length === 0 && sourceFailures === 0,
      records_found: allIncidents.length, records_inserted: insertedCount,
      records_invalid: errors.length, duration_ms: Date.now() - startedAt,
      error_summary: errors.length || sourceFailures
        ? `${sourceFailures} provider fetches and ${errors.length} incident writes failed`
        : undefined,
      metadata: {
        duplicates: duplicateCount,
        similar_skipped: skippedSimilar,
        sources_checked: sourceResults.length,
        sources_succeeded: sourcesSucceeded,
        taxonomy_version: deduplicatedIncidents[0]?.metadata?.taxonomy_version || null,
        category_counts: categoryCounts,
      },
    });
    
    // Trigger AI summarization for new articles
    if (insertedCount > 0) {
      console.log('[fetch-web3-incidents] Triggering AI summarization...');
      try {
        const summarizeUrl = `${supabaseUrl}/functions/v1/summarize-article`;
        fetch(summarizeUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit: Math.min(insertedCount, 10) }),
        }).catch(e => console.error('[fetch-web3-incidents] Summarize trigger error:', e));
      } catch (e) {
        console.error('[fetch-web3-incidents] Failed to trigger summarization:', e);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: sourcesSucceeded > 0 && errors.length === 0,
        partial: sourceFailures > 0 || errors.length > 0,
        message: 'Web3 incidents fetched',
        incidentsFound: allIncidents.length,
        incidentsInserted: insertedCount,
        duplicatesSkipped: duplicateCount,
        sources: sourceResults.map(s => ({ ...s, source: 'feed-1' })),
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[fetch-web3-incidents] Fatal error:', error);
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseServiceKey) {
      await recordIngestionRun(createClient(supabaseUrl, supabaseServiceKey), {
        pipeline: 'web3-incidents', attempted_at: attemptedAt, completed_at: new Date().toISOString(),
        success: false, duration_ms: Date.now() - startedAt,
        error_summary: 'Web3 incident synchronization failed before completion',
      });
    }
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
