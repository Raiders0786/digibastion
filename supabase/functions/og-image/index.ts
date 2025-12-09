import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400',
};

const getCryptoCharacter = (score: number): { name: string; emoji: string; title: string } => {
  if (score >= 90) return { name: "Satoshi-Level", emoji: "👻", title: "The Phantom Founder" };
  if (score >= 75) return { name: "Whale Guard", emoji: "🐋", title: "The Protocol Protector" };
  if (score >= 60) return { name: "Diamond Hands", emoji: "💎", title: "The Steady Holder" };
  if (score >= 45) return { name: "Degen Defender", emoji: "🦍", title: "The Learning Ape" };
  if (score >= 30) return { name: "Paper Hands", emoji: "📄", title: "The Vulnerable Holder" };
  return { name: "Rekt Waiting", emoji: "💀", title: "One Click Away from Rekt" };
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#eab308';
  if (score >= 20) return '#f97316';
  return '#ef4444';
};

const getScoreGradient = (score: number): { start: string; end: string } => {
  if (score >= 80) return { start: '#22c55e', end: '#16a34a' };
  if (score >= 60) return { start: '#3b82f6', end: '#2563eb' };
  if (score >= 40) return { start: '#eab308', end: '#ca8a04' };
  if (score >= 20) return { start: '#f97316', end: '#ea580c' };
  return { start: '#ef4444', end: '#dc2626' };
};

async function fetchAvatarAsBase64(username: string): Promise<string | null> {
  try {
    const avatarUrl = `https://unavatar.io/twitter/${username}?fallback=false`;
    const response = await fetch(avatarUrl, { 
      headers: { 'User-Agent': 'Digibastion-OG-Generator/1.0' }
    });
    
    if (!response.ok) {
      console.log(`Failed to fetch avatar for ${username}: ${response.status}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error fetching avatar for ${username}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const username = url.searchParams.get('u') || 'anon';
    const score = parseInt(url.searchParams.get('s') || '0', 10);
    const badgesParam = url.searchParams.get('b') || '';
    
    const character = getCryptoCharacter(score);
    const scoreColor = getScoreColor(score);
    const gradient = getScoreGradient(score);
    const badges = badgesParam ? badgesParam.split(',').map(b => decodeURIComponent(b)).slice(0, 4) : [];
    
    console.log(`Generating OG image for @${username} with score ${score}`);

    // Fetch avatar as base64
    const avatarBase64 = await fetchAvatarAsBase64(username);
    const hasAvatar = avatarBase64 !== null;

    // Avatar rendering - use embedded image if available, otherwise placeholder
    const avatarContent = hasAvatar 
      ? `<image x="60" y="170" width="120" height="120" href="${avatarBase64}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="120" cy="230" r="60" fill="#334155"/>
         <text x="120" y="245" font-family="system-ui, sans-serif" font-size="40" fill="#94a3b8" text-anchor="middle">👤</text>`;

    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:1" />
          </linearGradient>
          <linearGradient id="cardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${gradient.start};stop-opacity:0.15" />
            <stop offset="100%" style="stop-color:${gradient.end};stop-opacity:0.05" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <clipPath id="avatarClip">
            <circle cx="120" cy="230" r="60"/>
          </clipPath>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bgGradient)"/>
        
        <!-- Grid pattern overlay -->
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148,163,184,0.05)" stroke-width="1"/>
        </pattern>
        <rect width="1200" height="630" fill="url(#grid)"/>
        
        <!-- Card background -->
        <rect x="40" y="40" width="1120" height="550" rx="24" fill="url(#cardGradient)" stroke="${scoreColor}" stroke-opacity="0.3" stroke-width="2"/>
        
        <!-- Logo/Brand -->
        <text x="80" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#a78bfa">
          🛡️ Digibastion
        </text>
        <text x="260" y="100" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#94a3b8">
          OpSec Assessment
        </text>
        
        <!-- Avatar with border -->
        <circle cx="120" cy="230" r="65" fill="none" stroke="${scoreColor}" stroke-width="3" stroke-opacity="0.5"/>
        ${avatarContent}
        
        <!-- Username -->
        <text x="200" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="700" fill="#f8fafc">
          @${username.length > 15 ? username.substring(0, 15) + '...' : username}
        </text>
        <text x="200" y="250" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#94a3b8">
          Security Level Assessment
        </text>
        
        <!-- Character emoji and name - centered -->
        <text x="600" y="340" font-family="system-ui, sans-serif" font-size="80" text-anchor="middle">
          ${character.emoji}
        </text>
        <text x="600" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800" fill="#f8fafc" text-anchor="middle">
          ${character.name}
        </text>
        <text x="600" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="${scoreColor}" text-anchor="middle">
          ${character.title}
        </text>
        
        <!-- Score circle -->
        <circle cx="1020" cy="280" r="90" fill="url(#scoreGradient)" filter="url(#glow)"/>
        <text x="1020" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="800" fill="white" text-anchor="middle" dominant-baseline="central">
          ${score}
        </text>
        <text x="1020" y="390" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">
          /100
        </text>
        
        <!-- Badges -->
        ${badges.length > 0 ? badges.map((badge, i) => `
          <rect x="${80 + i * 250}" y="490" width="230" height="40" rx="20" fill="#1e293b" stroke="${scoreColor}" stroke-opacity="0.3" stroke-width="1"/>
          <text x="${195 + i * 250}" y="517" font-family="system-ui, sans-serif" font-size="16" fill="#e2e8f0" text-anchor="middle">
            ${badge.length > 20 ? badge.substring(0, 20) + '...' : badge}
          </text>
        `).join('') : ''}
        
        <!-- CTA -->
        <text x="600" y="570" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="#64748b" text-anchor="middle">
          ✨ Think you can beat this? Take the quiz at digibastion.com
        </text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
