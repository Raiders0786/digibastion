import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { render } from "https://deno.land/x/resvg_wasm/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, max-age=86400',
};

const getCryptoCharacter = (score: number): { name: string; icon: string; title: string } => {
  if (score >= 90) return { name: "Satoshi-Level", icon: "★", title: "The Phantom Founder" };
  if (score >= 75) return { name: "Whale Guard", icon: "◆", title: "The Protocol Protector" };
  if (score >= 60) return { name: "Diamond Hands", icon: "◇", title: "The Steady Holder" };
  if (score >= 45) return { name: "Degen Defender", icon: "▲", title: "The Learning Ape" };
  if (score >= 30) return { name: "Paper Hands", icon: "○", title: "The Vulnerable Holder" };
  return { name: "Rekt Waiting", icon: "!", title: "Critical Risk" };
};

const getScoreColor = (score: number): { main: string; bg: string } => {
  if (score >= 80) return { main: '#22c55e', bg: '#052e16' };
  if (score >= 60) return { main: '#3b82f6', bg: '#172554' };
  if (score >= 40) return { main: '#eab308', bg: '#422006' };
  if (score >= 20) return { main: '#f97316', bg: '#431407' };
  return { main: '#ef4444', bg: '#450a0a' };
};

async function fetchAvatarAsBase64(username: string): Promise<string | null> {
  try {
    const response = await fetch(`https://unavatar.io/twitter/${username}?fallback=false`, { 
      headers: { 'User-Agent': 'Digibastion-OG/1.0' }
    });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:${response.headers.get('content-type') || 'image/png'};base64,${base64}`;
  } catch {
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
    const score = Math.min(100, Math.max(0, parseInt(url.searchParams.get('s') || '0', 10)));
    const badgesParam = url.searchParams.get('b') || '';
    
    const character = getCryptoCharacter(score);
    const colors = getScoreColor(score);
    const badges = badgesParam ? badgesParam.split(',').map(b => decodeURIComponent(b).replace(/[^\x20-\x7E]/g, '').trim()).filter(b => b.length > 0).slice(0, 3) : [];
    const displayUsername = username.length > 16 ? username.substring(0, 16) + '...' : username;
    
    const avatarBase64 = await fetchAvatarAsBase64(username);

    // Calculate score ring (simplified)
    const circumference = 2 * Math.PI * 50;
    const progress = (score / 100) * circumference;
    const dashOffset = circumference - progress;

    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0f"/>
          <stop offset="100%" style="stop-color:#1a1a2e"/>
        </linearGradient>
        <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#8b5cf6"/>
          <stop offset="100%" style="stop-color:#6366f1"/>
        </linearGradient>
        <clipPath id="avatarClip"><circle cx="120" cy="200" r="50"/></clipPath>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Main Card -->
      <rect x="50" y="50" width="1100" height="530" rx="20" fill="#111827" stroke="#374151" stroke-width="1"/>
      <rect x="50" y="50" width="1100" height="4" fill="url(#accent)"/>
      
      <!-- Left Section: User Info -->
      <text x="80" y="110" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#8b5cf6">DIGIBASTION</text>
      <text x="80" y="135" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">OpSec Security Assessment</text>
      
      <!-- Avatar -->
      <circle cx="120" cy="200" r="52" fill="none" stroke="${colors.main}" stroke-width="3"/>
      ${avatarBase64 
        ? `<image x="70" y="150" width="100" height="100" href="${avatarBase64}" clip-path="url(#avatarClip)" preserveAspectRatio="xMidYMid slice"/>`
        : `<circle cx="120" cy="200" r="50" fill="#1f2937"/><text x="120" y="210" font-family="Arial" font-size="24" fill="#6b7280" text-anchor="middle">?</text>`
      }
      
      <!-- Username -->
      <text x="190" y="195" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#f9fafb">@${displayUsername}</text>
      <text x="190" y="220" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">Security Level Assessment</text>
      
      <!-- Character Info (Left-Center) -->
      <circle cx="200" cy="380" r="55" fill="${colors.bg}" stroke="${colors.main}" stroke-width="3"/>
      <text x="200" y="395" font-family="Arial, sans-serif" font-size="40" font-weight="800" fill="${colors.main}" text-anchor="middle">${character.icon}</text>
      
      <text x="200" y="470" font-family="Arial, sans-serif" font-size="28" font-weight="800" fill="#f9fafb" text-anchor="middle">${character.name}</text>
      <text x="200" y="500" font-family="Arial, sans-serif" font-size="14" fill="${colors.main}" text-anchor="middle">${character.title}</text>
      
      <!-- Divider -->
      <line x1="420" y1="100" x2="420" y2="530" stroke="#374151" stroke-width="1"/>
      
      <!-- Right Section: Score -->
      <text x="750" y="130" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle" font-weight="600">YOUR SECURITY SCORE</text>
      
      <!-- Score Circle -->
      <circle cx="750" cy="280" r="90" fill="#1f2937"/>
      <circle cx="750" cy="280" r="70" fill="none" stroke="#374151" stroke-width="12"/>
      <circle cx="750" cy="280" r="50" fill="none" stroke="${colors.main}" stroke-width="14" stroke-linecap="round"
        stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 750 280)"/>
      <text x="750" y="295" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#ffffff" text-anchor="middle">${score}</text>
      <text x="750" y="330" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">out of 100</text>
      
      <!-- Security Level Badge -->
      <rect x="650" y="400" width="200" height="36" rx="18" fill="${colors.bg}" stroke="${colors.main}" stroke-width="2"/>
      <text x="750" y="424" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${colors.main}" text-anchor="middle">${score >= 80 ? 'ELITE SECURITY' : score >= 60 ? 'ADVANCED' : score >= 40 ? 'MODERATE' : 'NEEDS WORK'}</text>
      
      <!-- Badges Section -->
      ${badges.length > 0 ? `
        <text x="550" y="480" font-family="Arial, sans-serif" font-size="10" fill="#6b7280" font-weight="600">EARNED BADGES</text>
        ${badges.map((badge, i) => `
          <rect x="${550 + i * 120}" y="495" width="110" height="26" rx="13" fill="#1f2937" stroke="#6366f1" stroke-width="1"/>
          <text x="${605 + i * 120}" y="513" font-family="Arial, sans-serif" font-size="10" fill="#a78bfa" text-anchor="middle">${badge.length > 12 ? badge.substring(0, 12) + '..' : badge}</text>
        `).join('')}
      ` : ''}
      
      <!-- Bottom CTA -->
      <rect x="950" y="500" width="180" height="50" rx="25" fill="url(#accent)"/>
      <text x="1040" y="532" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="#ffffff" text-anchor="middle">digibastion.com</text>
    </svg>`;

    const format = (url.searchParams.get('format') || 'png').toLowerCase();

    if (format === 'svg') {
      return new Response(svg, {
        headers: { ...corsHeaders, 'Content-Type': 'image/svg+xml; charset=utf-8' },
      });
    }

    const png = await render(svg);
    return new Response(png, {
      headers: { ...corsHeaders, 'Content-Type': 'image/png' },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
