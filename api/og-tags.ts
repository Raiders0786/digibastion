import type { VercelRequest } from '@vercel/node';

// Crypto character mappings based on score
const getCryptoCharacter = (score: number): { name: string; emoji: string; title: string; description: string } => {
  if (score >= 90) return {
    name: "Satoshi-Level",
    emoji: "👻",
    title: "The Phantom Founder",
    description: "Your OpSec is legendary. You'd make Satoshi proud."
  };
  if (score >= 75) return {
    name: "Whale Guard",
    emoji: "🐋",
    title: "The Protocol Protector", 
    description: "Smart contract auditors respect your security game."
  };
  if (score >= 60) return {
    name: "Diamond Hands",
    emoji: "💎",
    title: "The Steady Holder",
    description: "Solid security. Your keys, your crypto, your rules."
  };
  if (score >= 45) return {
    name: "Degen Defender",
    emoji: "🦍",
    title: "The Learning Ape",
    description: "You're aware of risks but still YOLO sometimes."
  };
  if (score >= 30) return {
    name: "Paper Hands",
    emoji: "📄",
    title: "The Vulnerable Holder",
    description: "Your security needs work before the next bull run."
  };
  return {
    name: "Rekt Waiting",
    emoji: "💀",
    title: "One Click Away from Rekt",
    description: "NGMI unless you level up your OpSec immediately."
  };
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url || '', 'https://digibastion.com');
  
  // Only process /quiz-result or /api/og-tags requests
  if (!url.pathname.startsWith('/quiz-result') && !url.pathname.startsWith('/api/og-tags')) {
    return new Response(null, { status: 404 });
  }

  // Sanitize inputs
  const rawUsername = url.searchParams.get('u') || 'anon';
  const username = escapeHtml(rawUsername.slice(0, 50));
  const score = Math.max(0, Math.min(100, parseInt(url.searchParams.get('s') || '0', 10)));
  const badgesParam = url.searchParams.get('b') || '';
  
  const character = getCryptoCharacter(score);
  
  // Generate OG image URL - use raw username here as it's being URI encoded
  const ogImageUrl = escapeHtml(`https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/og-image?u=${encodeURIComponent(rawUsername)}&s=${score}&b=${encodeURIComponent(badgesParam)}`);
  
  const ogTitle = escapeHtml(`${character.emoji} ${rawUsername}'s OpSec: ${character.name} (${score}/100)`);
  const ogDescription = escapeHtml(`"${character.description}" - Take the OpSec quiz at digibastion.com`);
  
  // pageUrl should be the canonical frontend URL, not the current API URL
  const pageUrl = escapeHtml(`https://digibastion.com/quiz-result${url.search}`);

  // Generate HTML with proper OG meta tags for Twitter/social crawlers
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${ogTitle}</title>
  <meta name="description" content="${ogDescription}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${pageUrl}" />
  <meta property="og:title" content="${ogTitle}" />
  <meta property="og:description" content="${ogDescription}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Digibastion" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${pageUrl}" />
  <meta name="twitter:title" content="${ogTitle}" />
  <meta name="twitter:description" content="${ogDescription}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  
  <!-- Redirect to SPA for non-crawler users -->
  <script>
    (function() {
      // Check if this is a social media crawler
      const userAgent = navigator.userAgent.toLowerCase();
      const crawlers = ['twitterbot', 'facebookexternalhit', 'linkedinbot', 'slackbot', 'discordbot', 'telegrambot', 'whatsapp'];
      const isCrawler = crawlers.some(bot => userAgent.includes(bot));
      
      // If not a crawler, redirect to the SPA version
      if (!isCrawler) {
        // Prevent infinite redirect loops by checking for a flag
        const urlParams = new URLSearchParams(window.location.search);
        if (!urlParams.has('redirected')) {
          urlParams.set('redirected', 'true');
          const newUrl = window.location.origin + '/quiz-result?' + urlParams.toString();
          window.location.replace(newUrl);
        }
      }
    })();
  </script>
  
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 24px;
      padding: 40px;
      max-width: 500px;
    }
    .emoji { font-size: 80px; }
    h1 { margin: 16px 0 8px; }
    .score {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      padding: 16px 32px;
      border-radius: 9999px;
      font-size: 48px;
      font-weight: bold;
      margin: 16px 0;
    }
    .description {
      color: #94a3b8;
      font-style: italic;
    }
    .cta {
      display: inline-block;
      background: #8b5cf6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">${character.emoji}</div>
    <h1>${escapeHtml(character.name)}</h1>
    <p style="color: #22c55e;">${escapeHtml(character.title)}</p>
    <div class="score">${score}<span style="opacity: 0.7; font-size: 24px;">/100</span></div>
    <p class="description">"${escapeHtml(character.description)}"</p>
    <a href="https://digibastion.com" class="cta">Take the Quiz</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
