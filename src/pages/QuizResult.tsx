
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChallengeButton } from '@/components/quiz/ChallengeButton';
import { Shield, Sparkles, ArrowRight, ExternalLink, Copy, Check, Eye, Share2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

const getThreatLevelConfig = (score: number) => {
  if (score >= 80) return {
    color: 'bg-green-500',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    gradient: 'from-green-500/20 to-green-600/10'
  };
  if (score >= 60) return {
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    gradient: 'from-blue-500/20 to-blue-600/10'
  };
  if (score >= 40) return {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500/30',
    gradient: 'from-yellow-500/20 to-yellow-600/10'
  };
  if (score >= 20) return {
    color: 'bg-orange-500',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    gradient: 'from-orange-500/20 to-orange-600/10'
  };
  return {
    color: 'bg-red-500',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
    gradient: 'from-red-500/20 to-red-600/10'
  };
};

const QuizResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const hasSubmittedScore = useRef(false);
  
  const username = searchParams.get('u') || 'anon';
  const score = parseInt(searchParams.get('s') || '0', 10);
  const badgesParam = searchParams.get('b') || '';
  
  const character = getCryptoCharacter(score);
  const config = getThreatLevelConfig(score);
  const badges = badgesParam ? badgesParam.split(',').map(b => decodeURIComponent(b)) : [];
  
  // Dynamic OG image URL from edge function (PNG format for X compatibility)
  const ogImageUrl = `https://sdszjqltoheqhfkeprrd.supabase.co/functions/v1/og-image?u=${encodeURIComponent(username)}&s=${score}&b=${encodeURIComponent(badgesParam)}`;
  
  // Server-rendered OG page URL for crawlers
  const ogPageUrl = `https://digibastion.com/api/og-tags?u=${encodeURIComponent(username)}&s=${score}&b=${encodeURIComponent(badgesParam)}`;
  
  const getTwitterPfp = (handle: string) => {
    return `https://unavatar.io/twitter/${handle}`;
  };

  const handleCopyImageUrl = () => {
    navigator.clipboard.writeText(ogImageUrl);
    setCopied(true);
    toast.success('OG Image URL copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviewXCard = () => {
    window.open(ogPageUrl, '_blank');
  };

  const handleShareOnX = async () => {
    // Save score to leaderboard (only once per page load)
    if (!hasSubmittedScore.current && username !== 'anon') {
      hasSubmittedScore.current = true;
      await supabase.from('quiz_scores').insert({
        username,
        score,
        badge_count: badges.length,
        character_rank: character.name
      });
    }

    const shareUrl = `https://digibastion.com/quiz-result?u=${encodeURIComponent(username)}&s=${score}&b=${encodeURIComponent(badgesParam)}`;
    const tweetText = `${character.emoji} I scored ${score}/100 on the @digibastion OpSec Quiz!\n\nMy rank: ${character.name}\n"${character.description}"\n\nThink you can beat me? Take the quiz 👇\n${shareUrl}`;
    
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
  };

  // Set OG meta tags dynamically
  useEffect(() => {
    const ogTitle = `${username}'s OpSec Score: ${score}/100 | Digibastion`;
    const ogDescription = `${character.emoji} ${character.name} - "${character.description}" Take the OpSec quiz at digibastion.com`;
    
    document.title = ogTitle;
    
    // Update OG meta tags
    const updateMeta = (property: string, content: string, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        if (isName) {
          tag.setAttribute('name', property);
        } else {
          tag.setAttribute('property', property);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateMeta('og:title', ogTitle);
    updateMeta('og:description', ogDescription);
    updateMeta('og:image', ogImageUrl);
    updateMeta('og:url', window.location.href);
    updateMeta('og:type', 'website');
    
    updateMeta('twitter:card', 'summary_large_image', true);
    updateMeta('twitter:title', ogTitle, true);
    updateMeta('twitter:description', ogDescription, true);
    updateMeta('twitter:image', ogImageUrl, true);
  }, [username, score, character, ogImageUrl]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto">
          {/* Result Card */}
          <div className={`p-8 rounded-2xl border ${config.borderColor} bg-gradient-to-br ${config.gradient} relative overflow-hidden shadow-2xl`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_20%,_currentColor_21%,_currentColor_22%,_transparent_23%)] bg-[length:20px_20px]" />
            </div>
            
            <div className="relative z-10">
              {/* Profile header */}
              <div className="flex items-center gap-4 mb-8">
                <img 
                  src={getTwitterPfp(username)} 
                  alt={`@${username}`}
                  className="w-20 h-20 rounded-full border-2 border-primary/50 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://unavatar.io/fallback.png';
                  }}
                />
                <div>
                  <p className="font-bold text-xl text-foreground">@{username}</p>
                  <p className="text-sm text-foreground-secondary">OpSec Assessment</p>
                </div>
              </div>

              {/* Character & Score */}
              <div className="text-center space-y-4 mb-8">
                <div className="text-6xl">{character.emoji}</div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{character.name}</h1>
                  <p className={`text-lg font-medium ${config.textColor}`}>
                    {character.title}
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className={`px-8 py-4 rounded-full ${config.color} shadow-lg`}>
                    <span className="text-4xl font-bold text-white">{score}</span>
                    <span className="text-white/80 text-xl">/100</span>
                  </div>
                </div>
                <p className="text-foreground-secondary italic max-w-sm mx-auto text-lg">
                  "{character.description}"
                </p>
              </div>

              {/* Badges earned */}
              {badges.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {badges.map((badge, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm bg-background/50 backdrop-blur">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}

              {/* CTA */}
              <div className="pt-6 border-t border-border/30 space-y-4">
                {/* Share on X Button */}
                <Button 
                  onClick={handleShareOnX}
                  size="lg"
                  className="w-full gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white"
                >
                  <Share2 className="w-5 h-5" />
                  Share on X & Join Leaderboard
                </Button>

                {/* Challenge a Friend */}
                <ChallengeButton score={score} variant="outline" className="w-full" />

                {/* Leaderboard Link */}
                <Button
                  onClick={() => navigate('/leaderboard')}
                  variant="ghost"
                  className="w-full gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  View Leaderboard
                </Button>

                {/* Preview X Card Section */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    Preview how your card appears on X
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handlePreviewXCard}
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview X Card
                    </Button>
                    <Button 
                      onClick={handleCopyImageUrl}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 break-all">
                    {ogImageUrl}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Think you can beat this score?
                </p>
                <Button 
                  onClick={() => navigate('/quiz')} 
                  size="lg"
                  className="gap-2 w-full"
                >
                  <Shield className="w-5 h-5" />
                  Take the Quiz
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizResult;
