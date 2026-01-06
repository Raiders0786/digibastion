import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { render } from "https://deno.land/x/resvg_wasm/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400',
};

const getCryptoCharacter = (score: number): { name: string; emoji: string; title: string; tip: string } => {
  if (score >= 90) return { 
    name: "Satoshi-Level", 
    emoji: "👻", 
    title: "The Phantom Founder",
    tip: "You're in the top 1% of security-conscious users"
  };
  if (score >= 75) return { 
    name: "Whale Guard", 
    emoji: "🐋", 
    title: "The Protocol Protector",
    tip: "Your OpSec rivals institutional security"
  };
  if (score >= 60) return { 
    name: "Diamond Hands", 
    emoji: "💎", 
    title: "The Steady Holder",
    tip: "Solid foundation, ready for the next level"
  };
  if (score >= 45) return { 
    name: "Degen Defender", 
    emoji: "🦍", 
    title: "The Learning Ape",
    tip: "You're on the right path, keep improving"
  };
  if (score >= 30) return { 
    name: "Paper Hands", 
    emoji: "📄", 
    title: "The Vulnerable Holder",
    tip: "Time to strengthen your security posture"
  };
  return { 
    name: "Rekt Waiting", 
    emoji: "💀", 
    title: "One Click Away from Rekt",
    tip: "Urgent: Your assets need protection ASAP"
  };
};

const getScoreGradient = (score: number): { start: string; end: string; glow: string } => {
  if (score >= 80) return { start: '#22c55e', end: '#10b981', glow: '#34d399' };
  if (score >= 60) return { start: '#3b82f6', end: '#6366f1', glow: '#818cf8' };
  if (score >= 40) return { start: '#f59e0b', end: '#eab308', glow: '#fbbf24' };
  if (score >= 20) return { start: '#f97316', end: '#ef4444', glow: '#fb923c' };
  return { start: '#ef4444', end: '#dc2626', glow: '#f87171' };
};

const getSecurityLevel = (score: number): { level: string; icon: string } => {
  if (score >= 90) return { level: "ELITE", icon: "🏆" };
  if (score >= 75) return { level: "ADVANCED", icon: "⭐" };
  if (score >= 60) return { level: "SOLID", icon: "🔷" };
  if (score >= 45) return { level: "MODERATE", icon: "🔶" };
  if (score >= 30) return { level: "BASIC", icon: "⚠️" };
  return { level: "CRITICAL", icon: "🚨" };
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
    
    console.log(`Generating OG image for @${username} with score ${score}`);

    const avatarBase64 = await fetchAvatarAsBase64(username);
    const hasAvatar = avatarBase64 !== null;

    const avatarContent = hasAvatar 
      ? `<image x="70" y="130" width="100" height="100" href="${avatarBase64}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`
      : `<circle cx="120" cy="180" r="50" fill="#1e293b"/>
         <text x="120" y="195" font-family="system-ui, sans-serif" font-size="36" fill="#64748b" text-anchor="middle">👤</text>`;

    // Calculate score ring
    const circumference = 2 * Math.PI * 70;
    const progress = (score / 100) * circumference;
    const dashOffset = circumference - progress;

    const svg = `
      <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <!-- Main background gradient -->
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#030712"/>
            <stop offset="50%" style="stop-color:#0f172a"/>
            <stop offset="100%" style="stop-color:#1e1b4b"/>
          </linearGradient>
          
          <!-- Score gradient -->
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${gradient.start}"/>
            <stop offset="100%" style="stop-color:${gradient.end}"/>
          </linearGradient>
          
          <!-- Card glass effect -->
          <linearGradient id="cardGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(255,255,255,0.1)"/>
            <stop offset="100%" style="stop-color:rgba(255,255,255,0.02)"/>
          </linearGradient>
          
          <!-- Accent gradient -->
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#a78bfa"/>
            <stop offset="50%" style="stop-color:#818cf8"/>
            <stop offset="100%" style="stop-color:#6366f1"/>
          </linearGradient>
          
          <!-- Glow filters -->
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <!-- Avatar clip -->
          <clipPath id="avatarClip">
            <circle cx="120" cy="180" r="50"/>
          </clipPath>
          
          <!-- Decorative pattern -->
          <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(148,163,184,0.1)"/>
          </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bgGradient)"/>
        <rect width="1200" height="630" fill="url(#dots)"/>
        
        <!-- Decorative orbs -->
        <circle cx="100" cy="500" r="200" fill="${gradient.start}" opacity="0.05" filter="url(#glow)"/>
        <circle cx="1100" cy="100" r="150" fill="${gradient.end}" opacity="0.08" filter="url(#glow)"/>
        <circle cx="600" cy="600" r="180" fill="#a78bfa" opacity="0.04" filter="url(#glow)"/>
        
        <!-- Main card -->
        <rect x="50" y="50" width="1100" height="530" rx="32" fill="url(#cardGlass)" stroke="rgba(148,163,184,0.15)" stroke-width="1"/>
        <rect x="50" y="50" width="1100" height="530" rx="32" fill="none" stroke="url(#scoreGradient)" stroke-width="2" stroke-opacity="0.3"/>
        
        <!-- Top accent line -->
        <rect x="50" y="50" width="1100" height="4" rx="2" fill="url(#accentGradient)"/>
        
        <!-- Header section -->
        <text x="90" y="110" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="24" font-weight="800" fill="url(#accentGradient)">
          DIGIBASTION
        </text>
        <text x="270" y="110" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#64748b" font-weight="500">
          OpSec Security Assessment
        </text>
        
        <!-- Security level badge -->
        <rect x="900" y="80" width="220" height="44" rx="22" fill="rgba(0,0,0,0.3)" stroke="${gradient.start}" stroke-width="2"/>
        <text x="930" y="110" font-family="system-ui, sans-serif" font-size="20">${securityLevel.icon}</text>
        <text x="960" y="109" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${gradient.start}">
          ${securityLevel.level} SECURITY
        </text>
        
        <!-- Avatar section -->
        <circle cx="120" cy="180" r="54" fill="none" stroke="${gradient.start}" stroke-width="3" filter="url(#softGlow)"/>
        ${avatarContent}
        
        <!-- User info -->
        <text x="190" y="165" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="700" fill="#f8fafc">
          @${username.length > 18 ? username.substring(0, 18) + '...' : username}
        </text>
        <text x="190" y="200" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#94a3b8">
          Security Level Assessment • ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </text>
        
        <!-- Divider -->
        <line x1="90" y1="240" x2="700" y2="240" stroke="rgba(148,163,184,0.1)" stroke-width="1"/>
        
        <!-- Character section -->
        <text x="350" y="330" font-family="system-ui, sans-serif" font-size="72" text-anchor="middle" filter="url(#softGlow)">
          ${character.emoji}
        </text>
        <text x="350" y="400" font-family="system-ui, -apple-system, sans-serif" font-size="42" font-weight="800" fill="#f8fafc" text-anchor="middle">
          ${character.name}
        </text>
        <text x="350" y="440" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="${gradient.start}" text-anchor="middle" font-weight="600">
          ${character.title}
        </text>
        <text x="350" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b" text-anchor="middle" font-style="italic">
          "${character.tip}"
        </text>
        
        <!-- Score section -->
        <g transform="translate(900, 350)">
          <!-- Background ring -->
          <circle cx="0" cy="0" r="75" fill="rgba(0,0,0,0.4)" stroke="rgba(148,163,184,0.1)" stroke-width="8"/>
          
          <!-- Progress ring -->
          <circle 
            cx="0" 
            cy="0" 
            r="70" 
            fill="none" 
            stroke="url(#scoreGradient)" 
            stroke-width="12" 
            stroke-linecap="round"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"
            transform="rotate(-90)"
            filter="url(#softGlow)"
          />
          
          <!-- Inner glow -->
          <circle cx="0" cy="0" r="55" fill="${gradient.start}" opacity="0.1"/>
          
          <!-- Score text -->
          <text x="0" y="8" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
            ${score}
          </text>
          <text x="0" y="45" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">
            out of 100
          </text>
        </g>
        
        <!-- Stats bar -->
        <g transform="translate(720, 280)">
          <text x="0" y="0" font-family="system-ui, sans-serif" font-size="12" fill="#64748b" font-weight="600">BREAKDOWN</text>
          
          <!-- Stat items -->
          <rect x="0" y="15" width="140" height="8" rx="4" fill="rgba(148,163,184,0.1)"/>
          <rect x="0" y="15" width="${Math.min(score * 1.4, 140)}" height="8" rx="4" fill="${gradient.start}"/>
          <text x="0" y="38" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Authentication</text>
          
          <rect x="0" y="55" width="140" height="8" rx="4" fill="rgba(148,163,184,0.1)"/>
          <rect x="0" y="55" width="${Math.min((score + 10) * 1.2, 140)}" height="8" rx="4" fill="${gradient.end}"/>
          <text x="0" y="78" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">Wallet Security</text>
          
          <rect x="0" y="95" width="140" height="8" rx="4" fill="rgba(148,163,184,0.1)"/>
          <rect x="0" y="95" width="${Math.min((score - 5) * 1.3, 140)}" height="8" rx="4" fill="#a78bfa"/>
          <text x="0" y="118" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">OpSec Practices</text>
        </g>
        
        <!-- Badges section -->
        ${badges.length > 0 ? `
          <text x="90" y="520" font-family="system-ui, sans-serif" font-size="12" fill="#64748b" font-weight="600">EARNED BADGES</text>
          ${badges.map((badge, i) => `
            <rect x="${90 + i * 180}" y="530" width="165" height="36" rx="18" fill="rgba(167,139,250,0.15)" stroke="#a78bfa" stroke-width="1" stroke-opacity="0.3"/>
            <text x="${172 + i * 180}" y="554" font-family="system-ui, sans-serif" font-size="13" fill="#c4b5fd" text-anchor="middle" font-weight="500">
              ✦ ${badge.length > 16 ? badge.substring(0, 16) + '..' : badge}
            </text>
          `).join('')}
        ` : `
          <rect x="90" y="520" width="200" height="36" rx="18" fill="rgba(99,102,241,0.1)" stroke="#6366f1" stroke-width="1" stroke-opacity="0.2"/>
          <text x="190" y="544" font-family="system-ui, sans-serif" font-size="13" fill="#818cf8" text-anchor="middle">
            🎯 Take quiz to earn badges
          </text>
        `}
        
        <!-- CTA -->
        <text x="900" y="545" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#64748b" text-anchor="middle">
          🔐 Test your OpSec at
        </text>
        <text x="900" y="565" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#a78bfa" text-anchor="middle" font-weight="700">
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
