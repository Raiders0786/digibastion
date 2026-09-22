import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Security: Blocked hosts to prevent SSRF attacks
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '::1',
  '0.0.0.0',
  '169.254.169.254', // AWS/GCP metadata
  '169.254.170.2',   // AWS ECS metadata
  'metadata.google.internal',
  'metadata.google',
];

// Security: Check if hostname is a private/internal IP
function isPrivateIP(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  const mappedV4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (mappedV4) return isPrivateIP(mappedV4);
  // RFC 1918 private ranges
  const privatePatterns = [
    /^10\./,                          // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[01])\./,  // 172.16.0.0/12
    /^192\.168\./,                    // 192.168.0.0/16
    /^127\./,                         // 127.0.0.0/8 loopback
    /^169\.254\./,                    // Link-local
    /^f[cd][0-9a-f]{2}:/i,            // IPv6 unique local (fc00::/7)
    /^fe80:/i,                        // IPv6 link-local
    /^::1$/,                          // IPv6 loopback
  ];
  
  return privatePatterns.some(pattern => pattern.test(normalized));
}

async function resolvesToPrivateAddress(hostname: string): Promise<boolean> {
  if (/^[\d.:\[\]a-f]+$/i.test(hostname)) return isPrivateIP(hostname);
  try {
    const results = await Promise.allSettled([
      Deno.resolveDns(hostname, 'A'),
      Deno.resolveDns(hostname, 'AAAA'),
    ]);
    const addresses = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
    return addresses.length === 0 || addresses.some(address => isPrivateIP(address));
  } catch {
    return true;
  }
}

// Security: Validate URL before scraping
async function validateUrl(urlString: string): Promise<{ valid: boolean; error?: string; url?: URL }> {
  try {
    const url = new URL(urlString);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP/HTTPS URLs are allowed' };
    }
    
    // Block internal/private hosts
    if (BLOCKED_HOSTS.includes(url.hostname.toLowerCase())) {
      return { valid: false, error: 'Access to internal resources is not allowed' };
    }
    
    // Block private IP ranges
    if (isPrivateIP(url.hostname)) {
      return { valid: false, error: 'Access to private network resources is not allowed' };
    }
    if (await resolvesToPrivateAddress(url.hostname)) {
      return { valid: false, error: 'The destination does not resolve to a public address' };
    }
    
    // Block file protocol attempts
    if (url.protocol === 'file:') {
      return { valid: false, error: 'File URLs are not allowed' };
    }
    
    return { valid: true, url };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Require valid CRON_SECRET or authenticated admin user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.replace('Bearer ', '');
    const cronSecret = Deno.env.get('CRON_SECRET');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    let authorized = false;
    if (cronSecret && token === cronSecret) authorized = true;
    if (!authorized && serviceKey && token === serviceKey) authorized = true;
    if (!authorized) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const authClient = createClient(supabaseUrl, anonKey);
        const { data: { user } } = await authClient.auth.getUser(token);
        if (user) {
          const admin = createClient(supabaseUrl, serviceKey!);
          const { data: roleData } = await admin
            .from('user_roles').select('role')
            .eq('user_id', user.id).eq('role', 'admin').maybeSingle();
          if (roleData) authorized = true;
        }
      } catch (_) { /* fall through */ }
    }
    if (!authorized) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { url, options } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('[firecrawl-scrape] FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Security: Validate URL before making request
    const validation = await validateUrl(formattedUrl);
    if (!validation.valid) {
      console.warn('[firecrawl-scrape] Blocked URL:', formattedUrl, '-', validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[firecrawl-scrape] Scraping URL:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: options?.formats || ['markdown', 'html'],
        onlyMainContent: options?.onlyMainContent ?? true,
        waitFor: options?.waitFor || 2000,
        location: options?.location,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[firecrawl-scrape] Firecrawl API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Request failed with status ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[firecrawl-scrape] Scrape successful');
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[firecrawl-scrape] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});