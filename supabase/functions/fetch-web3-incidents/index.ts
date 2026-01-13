import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  
  // Fallback to Date.parse
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// Extract dollar amount from text
function extractAmount(text: string): number | null {
  const patterns = [
    /\$(\d+(?:\.\d+)?)\s*million/i,
    /\$(\d+(?:\.\d+)?)\s*billion/i,
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
        // Likely already in full dollar amount
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

// Extract source links from content
function extractSources(content: string): string[] {
  const sources: string[] = [];
  
  // Match markdown links [text](url)
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkPattern.exec(content)) !== null) {
    const url = match[2];
    // Filter out internal web3isgoinggreat links and archive links
    if (!url.includes('web3isgoinggreat.com') && 
        !url.includes('archive.org') && 
        !url.includes('attribution') &&
        (url.startsWith('http://') || url.startsWith('https://'))) {
      sources.push(url);
    }
  }
  
  return sources.slice(0, 5); // Limit to 5 sources
}

// Determine category based on content
function determineCategory(title: string, content: string): string {
  const textLower = (title + ' ' + content).toLowerCase();
  
  if (textLower.includes('supply chain') || textLower.includes('npm') || textLower.includes('package')) {
    return 'supply-chain';
  }
  if (textLower.includes('vulnerability') || textLower.includes('cve') || textLower.includes('bug')) {
    return 'vulnerability-disclosure';
  }
  if (textLower.includes('phishing') || textLower.includes('scam') || textLower.includes('rug pull')) {
    return 'operational-security';
  }
  
  return 'web3-security';
}

// Extract affected technologies
function extractTechnologies(title: string, content: string): string[] {
  const techs: string[] = [];
  const textLower = (title + ' ' + content).toLowerCase();
  
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
  ];
  
  for (const { pattern, tech } of techPatterns) {
    if (pattern.test(title) || pattern.test(content)) {
      techs.push(tech);
    }
  }
  
  return [...new Set(techs)].slice(0, 5);
}

// Extract tags from theme/tech tags in content
function extractTags(content: string): string[] {
  const tags: string[] = [];
  
  // Look for theme tags
  const themeMatch = content.match(/Theme tags?:\s*([^\n]+)/i);
  if (themeMatch) {
    tags.push(...themeMatch[1].split(',').map(t => t.trim().toLowerCase()));
  }
  
  // Look for tech tags
  const techMatch = content.match(/Tech tags?:\s*([^\n]+)/i);
  if (techMatch) {
    tags.push(...techMatch[1].split(',').map(t => t.trim().toLowerCase()));
  }
  
  // Add derived tags
  const textLower = content.toLowerCase();
  if (textLower.includes('exploit')) tags.push('exploit');
  if (textLower.includes('hack')) tags.push('hack');
  if (textLower.includes('scam')) tags.push('scam');
  if (textLower.includes('rug pull')) tags.push('rug-pull');
  if (textLower.includes('phishing')) tags.push('phishing');
  if (textLower.includes('flash loan')) tags.push('flash-loan');
  if (textLower.includes('supply chain')) tags.push('supply-chain');
  
  return [...new Set(tags)].slice(0, 10);
}

// Generate SHA256 hash for deduplication
async function generateUID(title: string, date: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(title + date + 'web3isgoinggreat');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Parse markdown content into structured incidents
async function parseIncidents(markdown: string): Promise<any[]> {
  const incidents: any[] = [];
  
  // Split by date headers (e.g., "January 8, 2026")
  const datePattern = /(?:^|\n)((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+,?\s+\d{4})/g;
  
  // Split content into sections by dates
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
  
  // Add the last section
  if (lastDate && lastIndex < markdown.length) {
    sections.push({
      date: lastDate,
      content: markdown.slice(lastIndex).trim()
    });
  }
  
  // Process each section
  for (const section of sections) {
    // Extract individual incidents (marked by ## headers)
    const incidentPattern = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##|\n(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d|$)/g;
    
    let incidentMatch;
    while ((incidentMatch = incidentPattern.exec(section.content)) !== null) {
      const title = incidentMatch[1].trim();
      const content = incidentMatch[2].trim();
      
      // Skip non-incident headers
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
      
      // Get the first source link as primary reference
      const primarySource = sources[0] || '';
      
      // Generate UID
      const uid = await generateUID(title, section.date);
      
      // Extract clean summary (first paragraph without links)
      let summary = content
        .split('\n\n')[0]
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links, keep text
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
        .replace(/\[\[archive\]\][^\n]*/g, '') // Remove archive references
        .trim();
      
      if (summary.length > 500) {
        summary = summary.substring(0, 497) + '...';
      }
      
      incidents.push({
        uid,
        title,
        summary,
        content: content.substring(0, 2000),
        link: primarySource || `https://www.web3isgoinggreat.com/`,
        source_url: 'https://www.web3isgoinggreat.com/',
        source_name: 'Web3 Is Going Great',
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

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[fetch-web3-incidents] Starting fetch...');
    
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
    
    // Scrape web3isgoinggreat.com using Firecrawl
    console.log('[fetch-web3-incidents] Scraping web3isgoinggreat.com...');
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.web3isgoinggreat.com/',
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    
    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json();
      console.error('[fetch-web3-incidents] Firecrawl error:', errorData);
      throw new Error(`Firecrawl failed: ${errorData.error || scrapeResponse.status}`);
    }
    
    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    
    if (!markdown) {
      console.error('[fetch-web3-incidents] No markdown content received');
      throw new Error('No content received from scraper');
    }
    
    console.log(`[fetch-web3-incidents] Received ${markdown.length} chars of content`);
    
    // Parse incidents from markdown
    const incidents = await parseIncidents(markdown);
    console.log(`[fetch-web3-incidents] Parsed ${incidents.length} incidents`);
    
    // Calculate cutoff date (30 days ago for initial import, 7 days for regular)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Filter recent incidents
    const recentIncidents = incidents.filter(incident => {
      const pubDate = new Date(incident.published_at);
      return pubDate >= thirtyDaysAgo;
    });
    
    console.log(`[fetch-web3-incidents] ${recentIncidents.length} incidents within last 30 days`);
    
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
        message: 'Web3 incidents fetched successfully',
        incidentsFound: incidents.length,
        incidentsInserted: insertedCount,
        duplicatesSkipped: duplicateCount,
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
