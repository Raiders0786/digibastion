import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Obfuscated internal source identifiers (base64 encoded for privacy in open source)
const _s1 = atob('d2ViM2lzZ29pbmdncmVhdC5jb20='); // Primary source
const _s2 = atob('cXVpbGxhdWRpdHMuY29tL3dlYjMtaGFja3MtZGF0YWJhc2U='); // Secondary source

// Parse date from various formats found on web3isgoinggreat.com
function parseDate(dateStr: string): Date {
  const months: Record<string, number> = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };
  
  // Try "Month Day, Year" format (e.g., "January 8, 2026")
  const match = dateStr.match(/(\w+)\s+(\d+),?\s+(\d{4})/);
  if (match) {
    const month = months[match[1]];
    if (month !== undefined) {
      return new Date(parseInt(match[3]), month, parseInt(match[2]));
    }
  }
  
  // Try DD/MM/YY format (e.g., "07/01/26")
  const shortMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2})/);
  if (shortMatch) {
    const day = parseInt(shortMatch[1]);
    const month = parseInt(shortMatch[2]) - 1;
    let year = parseInt(shortMatch[3]);
    year = year < 50 ? 2000 + year : 1900 + year;
    return new Date(year, month, day);
  }
  
  // Fallback to Date.parse
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Extract dollar amount from text
function extractAmount(text: string): number | null {
  const patterns = [
    /\$\s*(\d+(?:\.\d+)?)\s*Million/i,
    /\$\s*(\d+(?:\.\d+)?)\s*Billion/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*Million/i,
    /\$\s*(\d+(?:\.\d+)?)\s*million/i,
    /\$\s*(\d+(?:\.\d+)?)\s*billion/i,
    /\$(\d+(?:,\d{3})*(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*million\s*(?:dollars?|\$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let amount = parseFloat(match[1].replace(/,/g, ''));
      if (text.toLowerCase().includes('billion')) {
        amount *= 1000;
      } else if (text.toLowerCase().includes('million')) {
        // Already in millions
      } else if (amount < 1000) {
        // Likely already in full dollar amount, convert to millions
        amount /= 1000000;
      }
      return amount;
    }
  }
  return null;
}

// Determine severity based on amount and content
function determineSeverity(amount: number | null, title: string, content: string): string {
  const textLower = (title + ' ' + content).toLowerCase();
  
  // Critical indicators
  if (amount && amount >= 50) return 'critical';
  if (textLower.includes('supply chain') || textLower.includes('backdoor')) return 'critical';
  if (textLower.includes('major') || textLower.includes('massive')) return 'critical';
  
  // High indicators
  if (amount && amount >= 10) return 'high';
  if (textLower.includes('exploit') || textLower.includes('hack')) return 'high';
  if (textLower.includes('drain') || textLower.includes('stolen')) return 'high';
  
  // Medium indicators
  if (amount && amount >= 1) return 'medium';
  if (textLower.includes('vulnerability') || textLower.includes('bug')) return 'medium';
  
  return 'low';
}

// Extract source links from content with proper sanitization
function extractSources(content: string): { url: string; label: string }[] {
  const sources: { url: string; label: string }[] = [];
  
  // Match markdown links [text](url)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    const linkText = match[1].trim();
    let url = match[2].trim();
    
    // Skip internal links, archive links, and attribution links
    if (url.includes('web3isgoinggreat.com') || 
        url.includes('archive.org') ||
        url.includes('web.archive.org') ||
        linkText.toLowerCase().includes('archive') ||
        linkText.toLowerCase().includes('attribution') ||
        !url.startsWith('http')) {
      continue;
    }
    
    // Remove any tracking parameters/referers from URLs
    try {
      const urlObj = new URL(url);
      ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref_src', 'ref_url'].forEach(param => {
        urlObj.searchParams.delete(param);
      });
      url = urlObj.toString();
    } catch {
      // If URL parsing fails, use as-is
    }
    
    // Generate clean label
    let label = linkText;
    if (linkText.toLowerCase().includes('tweet')) {
      if (url.includes('x.com') || url.includes('twitter.com')) {
        const usernameMatch = url.match(/(?:x\.com|twitter\.com)\/([^/]+)/);
        label = usernameMatch ? `@${usernameMatch[1]}` : 'Twitter/X';
      }
    } else if (url.includes('etherscan.io')) {
      label = 'Etherscan';
    } else if (url.includes('bscscan.com')) {
      label = 'BscScan';
    } else if (url.includes('polygonscan.com')) {
      label = 'PolygonScan';
    }
    
    if (!sources.some(s => s.url === url)) {
      sources.push({ url, label });
    }
  }
  
  return sources.slice(0, 5);
}

// Determine category based on content
function determineCategory(title: string, content: string, issueType?: string): string {
  const textLower = (title + ' ' + content + ' ' + (issueType || '')).toLowerCase();
  
  if (textLower.includes('supply chain') || textLower.includes('npm') || textLower.includes('package')) {
    return 'supply-chain';
  }
  if (textLower.includes('vulnerability') || textLower.includes('cve') || textLower.includes('bug')) {
    return 'vulnerability-disclosure';
  }
  if (textLower.includes('phishing') || textLower.includes('scam') || textLower.includes('rug pull')) {
    return 'operational-security';
  }
  if (textLower.includes('defi') || textLower.includes('flash loan') || textLower.includes('liquidity')) {
    return 'defi-exploits';
  }
  
  return 'web3-security';
}

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
      
      const pubDate = parseDate(section.date);
      const amount = extractAmount(title + ' ' + content);
      const severity = determineSeverity(amount, title, content);
      const sources = extractSources(content);
      const category = determineCategory(title, content);
      const technologies = extractTechnologies(title, content);
      const tags = extractTags(content);
      
      const primarySource = sources[0]?.url || '';
      const uid = await generateUID(title, section.date, 'p');
      
      // Clean content
      let cleanContent = content
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
        published_at: pubDate.toISOString(),
        raw_content: content,
        is_processed: false
      });
    }
  }
  
  return incidents;
}

// Parse incidents from secondary source (table format)
async function parseSecondaryIncidents(markdown: string): Promise<any[]> {
  const incidents: any[] = [];
  
  // Find the markdown table (starts with | NAME | DATE |)
  const tablePattern = /\|\s*NAME\s*\|\s*DATE\s*\|\s*TYPE OF ISSUE\s*\|\s*AMOUNT LOST\s*\|\s*CHAINS\s*\|\s*CATEGORY\s*\|\s*POST MORTEM\s*\|\s*\n\|[-\s|]+\|\s*\n([\s\S]*?)(?=\n\n|\n[^|]|$)/i;
  const tableMatch = markdown.match(tablePattern);
  
  if (tableMatch) {
    const tableRows = tableMatch[1].trim().split('\n');
    
    for (const row of tableRows) {
      // Parse table row: | Name | Date | Issue | Amount | Chain | Category | Link |
      const cells = row.split('|').map(c => c.trim()).filter(c => c);
      
      if (cells.length >= 6) {
        const name = cells[0];
        const dateStr = cells[1];
        const issueType = cells[2];
        const amountStr = cells[3];
        const chainImg = cells[4];
        const categoryStr = cells[5];
        const linkCell = cells[6] || '';
        
        // Extract chain from image alt text
        const chainMatch = chainImg.match(/!\[([^\]]+)\]/);
        const chain = chainMatch ? chainMatch[1] : '';
        
        // Extract post-mortem link
        const linkMatch = linkCell.match(/\]\(([^)]+)\)/);
        const postMortemLink = linkMatch ? linkMatch[1] : '';
        
        // Parse data
        const pubDate = parseDate(dateStr);
        const amount = extractAmount(amountStr);
        const title = `${name} exploited for ${amountStr.replace('$', '').trim()}`;
        const content = `${name} was affected by a ${issueType.toLowerCase()} issue. Category: ${categoryStr}. Chain: ${chain}.`;
        const severity = determineSeverity(amount, title, content);
        const category = determineCategory(title, content, issueType);
        const technologies = extractTechnologies(title, content, chain);
        const tags = extractTags(content, issueType, categoryStr);
        
        const uid = await generateUID(name, dateStr, 's');
        
        // Create summary
        const summary = `${name} suffered a ${issueType.toLowerCase()} attack, losing approximately ${amountStr}. The incident occurred on the ${chain} chain and affected the ${categoryStr} sector.`;
        
        incidents.push({
          uid,
          title: `${name} - ${issueType} (${amountStr})`,
          summary,
          content: `**Project:** ${name}\n**Issue Type:** ${issueType}\n**Amount Lost:** ${amountStr}\n**Chain:** ${chain}\n**Category:** ${categoryStr}\n\n${summary}`,
          link: postMortemLink || '',
          source_url: postMortemLink ? JSON.stringify([{ url: postMortemLink, label: 'Post-Mortem' }]) : null,
          source_name: null,
          author: null,
          category,
          severity,
          tags,
          affected_technologies: technologies,
          cve_id: null,
          published_at: pubDate.toISOString(),
          raw_content: row,
          is_processed: false
        });
      }
    }
  }
  
  return incidents;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[fetch-web3-incidents] Starting multi-source fetch...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!firecrawlApiKey) {
      console.error('[fetch-web3-incidents] FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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
        }
      } else {
        sourceResults.push({ source: 'primary', found: 0, errors: ['Failed to fetch'] });
      }
    } catch (e) {
      console.error('[fetch-web3-incidents] Primary source error:', e);
      sourceResults.push({ source: 'primary', found: 0, errors: [e.message] });
    }
    
    // Fetch from secondary source (internal only)
    try {
      console.log('[fetch-web3-incidents] Fetching from secondary source...');
      const response2 = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.${_s2}`,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 5000,
        }),
      });
      
      if (response2.ok) {
        const data2 = await response2.json();
        const md2 = data2.data?.markdown || data2.markdown || '';
        if (md2) {
          const incidents2 = await parseSecondaryIncidents(md2);
          allIncidents.push(...incidents2);
          sourceResults.push({ source: 'secondary', found: incidents2.length, errors: [] });
          console.log(`[fetch-web3-incidents] Secondary source: ${incidents2.length} incidents`);
        }
      } else {
        sourceResults.push({ source: 'secondary', found: 0, errors: ['Failed to fetch'] });
      }
    } catch (e) {
      console.error('[fetch-web3-incidents] Secondary source error:', e);
      sourceResults.push({ source: 'secondary', found: 0, errors: [e.message] });
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
    
    // Insert incidents into database
    let insertedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];
    
    for (const incident of recentIncidents) {
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
    
    console.log(`[fetch-web3-incidents] Inserted: ${insertedCount}, Duplicates: ${duplicateCount}`);
    
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
        success: true,
        message: 'Web3 incidents fetched from multiple sources',
        incidentsFound: allIncidents.length,
        incidentsInserted: insertedCount,
        duplicatesSkipped: duplicateCount,
        sources: sourceResults.map(s => ({ ...s, source: s.source === 'primary' ? 'feed-1' : 'feed-2' })),
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[fetch-web3-incidents] Fatal error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
