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
      // Remove common tracking parameters
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
      // Extract source from tweet links
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
    
    // Avoid duplicate URLs
    if (!sources.some(s => s.url === url)) {
      sources.push({ url, label });
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

// Extract tags from theme/tech/blockchain tags in content
function extractTags(content: string): string[] {
  const tags: string[] = [];
  
  // Look for theme tags - "Theme tags: Hack or scam"
  const themeMatch = content.match(/Theme tags?:\s*([^\n]+)/i);
  if (themeMatch) {
    const themeText = themeMatch[1].trim();
    // Handle "Hack or scam" style tags
    const themeTags = themeText.split(/,|or/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    tags.push(...themeTags);
  }
  
  // Look for tech tags - "Tech tags: DeFi"
  const techMatch = content.match(/Tech tags?:\s*([^\n]+)/i);
  if (techMatch) {
    const techText = techMatch[1].trim();
    const techTags = techText.split(/,|or/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    tags.push(...techTags);
  }
  
  // Look for blockchain tags - "Blockchain tags: Blockchain: Ethereum"
  const blockchainMatch = content.match(/Blockchain tags?:\s*(?:Blockchain:\s*)?([^\n]+)/i);
  if (blockchainMatch) {
    const blockchainText = blockchainMatch[1].replace(/^Blockchain:\s*/i, '').trim();
    const blockchainTags = blockchainText.split(/,|or/).map(t => t.trim().toLowerCase()).filter(t => t.length > 0);
    tags.push(...blockchainTags);
  }
  
  // Add derived tags based on content
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
  
  // Clean up and deduplicate
  return [...new Set(tags.filter(t => t.length > 0 && t !== 'blockchain'))].slice(0, 10);
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
      const primarySource = sources[0]?.url || '';
      
      // Generate UID
      const uid = await generateUID(title, section.date);
      
      // Clean content: remove images, archive links, attribution, tag lines, and ALL markdown links
      let cleanContent = content
        // Remove image markdown ![alt](url)
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
        // Remove attribution links
        .replace(/\[\(attribution\)\]\([^)]+\)/g, '')
        .replace(/\(attribution\)/gi, '')
        // Remove archive links and their markers
        .replace(/\[\[archive\]\]\([^)]+\)/g, '')
        .replace(/\[\\?\[archive\\?\]\]/g, '')
        // Remove entire bullet point lines that contain source links (before converting markdown)
        .replace(/^-\s*\[[^\]]+\]\([^)]+\).*$/gm, '')
        // Remove standalone archive URLs in parentheses
        .replace(/\(https?:\/\/(?:web\.)?archive\.org[^)]*\)/g, '')
        .replace(/\(https?:\/\/www\.web3isgoinggreat\.com\/archive[^)]*\)/g, '')
        // Remove ALL markdown links - keep only the text, not the URL
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove any remaining standalone URLs in parentheses
        .replace(/\(https?:\/\/[^)]+\)/g, '')
        // Remove bullet points that are now empty or just have URLs or italicized source names
        .replace(/^-\s*https?:\/\/[^\s]+.*$/gm, '')
        .replace(/^-\s*"[^"]*",?\s*_[^_]+_.*$/gm, '')
        .replace(/^-\s*,?\s*_[^_]+_.*$/gm, '')
        .replace(/^-\s*$/gm, '')
        // Remove "Other entries related to..." lines
        .replace(/Other entries related to[^\n]+/gi, '')
        // Remove tag lines at the end
        .replace(/\n*Theme tags?:[^\n]+/gi, '')
        .replace(/\n*Tech tags?:[^\n]+/gi, '')
        .replace(/\n*Blockchain tags?:[^\n]+/gi, '')
        // Remove icon images and IDs at the end
        .replace(/!\[\]\([^)]+\/icons\/[^)]+\)/g, '')
        .replace(/id:[a-f0-9-]+/gi, '')
        // Clean up excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Extract clean summary (first paragraph, fully cleaned)
      let summary = cleanContent
        .split('\n\n')[0]
        // Remove any remaining markdown links, keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .trim();
      
      // Ensure summary doesn't start with "!" or other artifacts
      if (summary.startsWith('!') || summary.startsWith('[')) {
        const parts = cleanContent.split('\n\n');
        summary = parts.find(p => p.length > 50 && !p.startsWith('!') && !p.startsWith('[') && !p.startsWith('-')) || parts[0];
        summary = summary.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      }
      
      if (summary.length > 500) {
        summary = summary.substring(0, 497) + '...';
      }
      
      // Format source links for storage (JSON stringify the array)
      const sourceLinks = sources.length > 0 ? JSON.stringify(sources) : null;
      
      incidents.push({
        uid,
        title,
        summary,
        content: cleanContent.substring(0, 2000),
        link: primarySource || `https://www.web3isgoinggreat.com/`,
        source_url: sourceLinks, // Store all source links as JSON
        source_name: null, // Remove "Web3 Is Going Great" attribution
        author: null, // No author
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
