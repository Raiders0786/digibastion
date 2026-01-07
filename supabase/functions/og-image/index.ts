import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { render } from "https://deno.land/x/resvg_wasm/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400',
};

const getCryptoCharacter = (score: number): { name: string; icon: string; title: string; tip: string } => {
  // Using simple icons instead of emojis for better SVG rendering
  if (score >= 90) return { 
    name: "Satoshi-Level", 
    icon: "S", 
    title: "The Phantom Founder",
    tip: "You're in the top 1% of security-conscious users"
  };
  if (score >= 75) return { 
    name: "Whale Guard", 
    icon: "W", 
    title: "The Protocol Protector",
    tip: "Your OpSec rivals institutional security"
  };
  if (score >= 60) return { 
    name: "Diamond Hands", 
    icon: "D", 
    title: "The Steady Holder",
    tip: "Solid foundation, ready for the next level"
  };
  if (score >= 45) return { 
    name: "Degen Defender", 
    icon: "A", 
    title: "The Learning Ape",
    tip: "You're on the right path, keep improving"
  };
  if (score >= 30) return { 
    name: "Paper Hands", 
    icon: "P", 
    title: "The Vulnerable Holder",
    tip: "Time to strengthen your security posture"
  };
  return { 
    name: "Rekt Waiting", 
    icon: "!", 
    title: "One Click Away from Rekt",
    tip: "Urgent: Your assets need protection ASAP"
  };
};

const getScoreGradient = (score: number): { start: string; end: string; glow: string; bg: string } => {
  if (score >= 80) return { start: '#22c55e', end: '#10b981', glow: '#34d399', bg: '#052e16' };
  if (score >= 60) return { start: '#3b82f6', end: '#6366f1', glow: '#818cf8', bg: '#172554' };
  if (score >= 40) return { start: '#f59e0b', end: '#eab308', glow: '#fbbf24', bg: '#422006' };
  if (score >= 20) return { start: '#f97316', end: '#ef4444', glow: '#fb923c', bg: '#431407' };
  return { start: '#ef4444', end: '#dc2626', glow: '#f87171', bg: '#450a0a' };
};

const getSecurityLevel = (score: number): string => {
  if (score >= 90) return "ELITE SECURITY";
  if (score >= 75) return "ADVANCED";
  if (score >= 60) return "SOLID";
  if (score >= 45) return "MODERATE";
  if (score >= 30) return "BASIC";
  return "CRITICAL RISK";
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
    const gradient = getScoreGradient(score);
    const securityLevel = getSecurityLevel(score);
    const badges = badgesParam ? badgesParam.split(',').map(b => decodeURIComponent(b)).slice(0, 3) : [];
    
    // Clean badge text - remove emojis for SVG compatibility
    const cleanBadges = badges.map(b => b.replace(/[^\x00-\x7F]/g, '').trim());
    
    console.log(`Generating OG image for @${username} with score ${score}`);

    const avatarBase64 = await fetchAvatarAsBase64(username);
    const hasAvatar = avatarBase64 !== null;

    // Calculate score ring
    const circumference = 2 * Math.PI * 65;
    const progress = (score / 100) * circumference;
    const dashOffset = circumference - progress;

    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0a0a0f"/>
            <stop offset="50%" style="stop-color:#0f172a"/>
            <stop offset="100%" style="stop-color:#1a1a2e"/>
          </linearGradient>
          
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${gradient.start}"/>
            <stop offset="100%" style="stop-color:${gradient.end}"/>
          </linearGradient>
          
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#a78bfa"/>
            <stop offset="100%" style="stop-color:#6366f1"/>
          </linearGradient>
          
          <clipPath id="avatarClip">
            <circle cx="100" cy="160" r="45"/>
          </clipPath>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bgGradient)"/>
        
        <!-- Decorative elements -->
        <circle cx="50" cy="550" r="150" fill="${gradient.start}" opacity="0.05"/>
        <circle cx="1150" cy="80" r="120" fill="${gradient.end}" opacity="0.06"/>
        
        <!-- Main card -->
        <rect x="40" y="40" width="1120" height="550" rx="24" fill="#111827" stroke="#374151" stroke-width="1"/>
        
        <!-- Top accent line -->
        <rect x="40" y="40" width="1120" height="3" rx="1" fill="url(#accentGradient)"/>
        
        <!-- Header -->
        <text x="80" y="95" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#a78bfa">
          DIGIBASTION
        </text>
        <text x="250" y="95" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
          OpSec Security Assessment
        </text>
        
        <!-- Security level badge -->
        <rect x="880" y="65" width="250" height="40" rx="20" fill="${gradient.bg}" stroke="${gradient.start}" stroke-width="2"/>
        <text x="1005" y="92" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="${gradient.start}" text-anchor="middle">
          ${securityLevel}
        </text>
        
        <!-- Avatar section -->
        <circle cx="100" cy="160" r="48" fill="none" stroke="${gradient.start}" stroke-width="3"/>
        ${hasAvatar 
          ? `<image x="55" y="115" width="90" height="90" href="${avatarBase64}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`
          : `<circle cx="100" cy="160" r="45" fill="#1f2937"/>
             <text x="100" y="170" font-family="Arial, sans-serif" font-size="28" fill="#6b7280" text-anchor="middle">?</text>`
        }
        
        <!-- User info -->
        <text x="170" y="150" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#f9fafb">
          @${username.length > 20 ? username.substring(0, 20) + '...' : username}
        </text>
        <text x="170" y="180" font-family="Arial, sans-serif" font-size="13" fill="#9ca3af">
          Security Level Assessment - ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </text>
        
        <!-- Divider -->
        <line x1="80" y1="220" x2="650" y2="220" stroke="#374151" stroke-width="1"/>
        
        <!-- Character section - Left side -->
        <g transform="translate(300, 380)">
          <!-- Character icon circle -->
          <circle cx="0" cy="0" r="55" fill="${gradient.bg}" stroke="${gradient.start}" stroke-width="3"/>
          <text x="0" y="15" font-family="Arial, sans-serif" font-size="48" font-weight="800" fill="${gradient.start}" text-anchor="middle">
            ${character.icon}
          </text>
        </g>
        
        <text x="300" y="470" font-family="Arial, sans-serif" font-size="36" font-weight="800" fill="#f9fafb" text-anchor="middle">
          ${character.name}
        </text>
        <text x="300" y="505" font-family="Arial, sans-serif" font-size="16" fill="${gradient.start}" text-anchor="middle" font-weight="600">
          ${character.title}
        </text>
        <text x="300" y="540" font-family="Arial, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle" font-style="italic">
          "${character.tip}"
        </text>
        
        <!-- Score section - Right side -->
        <g transform="translate(900, 350)">
          <!-- Background ring -->
          <circle cx="0" cy="0" r="80" fill="#1f2937"/>
          <circle cx="0" cy="0" r="70" fill="none" stroke="#374151" stroke-width="10"/>
          
          <!-- Progress ring -->
          <circle 
            cx="0" 
            cy="0" 
            r="65" 
            fill="none" 
            stroke="url(#scoreGradient)" 
            stroke-width="12" 
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"
            transform="rotate(-90)"
            filter="url(#glow)"
          />
          
          <!-- Score text -->
          <text x="0" y="10" font-family="Arial, sans-serif" font-size="52" font-weight="800" fill="#ffffff" text-anchor="middle">
            ${score}
          </text>
          <text x="0" y="40" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af" text-anchor="middle">
            out of 100
          </text>
        </g>
        
        <!-- Breakdown stats -->
        <g transform="translate(700, 250)">
          <text x="0" y="0" font-family="Arial, sans-serif" font-size="11" fill="#6b7280" font-weight="600">BREAKDOWN</text>
          
          <rect x="0" y="15" width="120" height="6" rx="3" fill="#374151"/>
          <rect x="0" y="15" width="${Math.max(20, Math.min(score * 1.2, 120))}" height="6" rx="3" fill="${gradient.start}"/>
          <text x="130" y="22" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">Authentication</text>
          
          <rect x="0" y="40" width="120" height="6" rx="3" fill="#374151"/>
          <rect x="0" y="40" width="${Math.max(20, Math.min((score + 5) * 1.15, 120))}" height="6" rx="3" fill="${gradient.end}"/>
          <text x="130" y="47" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">Wallet Security</text>
          
          <rect x="0" y="65" width="120" height="6" rx="3" fill="#374151"/>
          <rect x="0" y="65" width="${Math.max(20, Math.min((score - 3) * 1.25, 120))}" height="6" rx="3" fill="#a78bfa"/>
          <text x="130" y="72" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">OpSec Practices</text>
        </g>
        
        <!-- Badges section -->
        ${cleanBadges.length > 0 ? `
          <text x="80" y="245" font-family="Arial, sans-serif" font-size="10" fill="#6b7280" font-weight="600">EARNED BADGES</text>
          ${cleanBadges.map((badge, i) => `
            <rect x="${80 + i * 140}" y="255" width="130" height="28" rx="14" fill="#1f2937" stroke="#6366f1" stroke-width="1"/>
            <text x="${145 + i * 140}" y="274" font-family="Arial, sans-serif" font-size="11" fill="#a78bfa" text-anchor="middle">
              ${badge.length > 14 ? badge.substring(0, 14) + '..' : badge}
            </text>
          `).join('')}
        ` : ''}
        
        <!-- CTA -->
        <text x="900" y="480" font-family="Arial, sans-serif" font-size="12" fill="#6b7280" text-anchor="middle">
          Test your OpSec at
        </text>
        <text x="900" y="500" font-family="Arial, sans-serif" font-size="14" fill="#a78bfa" text-anchor="middle" font-weight="700">
          digibastion.com
        </text>
      </svg>
    `;

    const format = (url.searchParams.get('format') || 'png').toLowerCase();

    if (format === 'svg') {
      return new Response(svg, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'image/svg+xml; charset=utf-8',
        },
      });
    }

    const png = await render(svg);

    return new Response(png, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/png',
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
