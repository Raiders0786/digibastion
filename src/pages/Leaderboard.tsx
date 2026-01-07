import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, Crown, Loader2, Users } from 'lucide-react';

interface QuizScore {
  id: string;
  username: string;
  score: number;
  badge_count: number;
  character_rank: string;
  created_at: string;
}

const getRankIcon = (index: number) => {
  if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
  if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
  if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
  return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{index + 1}</span>;
};

const getCharacterEmoji = (rank: string) => {
  const emojiMap: Record<string, string> = {
    'Satoshi-Level': '👻',
    'Whale Guard': '🐋',
    'Diamond Hands': '💎',
    'Degen Defender': '🦍',
    'Paper Hands': '📄',
    'Rekt Waiting': '💀'
  };
  return emojiMap[rank] || '🔒';
};

const Leaderboard = () => {
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      const { data, error } = await supabase
        .from('quiz_scores')
        .select('*')
        .order('score', { ascending: false })
        .order('badge_count', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setScores(data);
      }
      setLoading(false);
    };

    fetchScores();
  }, []);

  return (
    <>
      <MetaTags 
        title="OpSec Leaderboard — Top Crypto Security Scores | Digibastion"
        description="See the top OpSec quiz scores from the crypto community. Compare your security knowledge against other crypto users. Take the quiz and join the leaderboard!"
        keywords="crypto security leaderboard, opsec quiz scores, web3 security ranking, blockchain security competition"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Community Leaderboard</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                OpSec Hall of Fame
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                The top security-conscious individuals who've shared their quiz results. 
                Take the quiz and share to join the leaderboard!
              </p>
              {/* Privacy Notice */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground">
                <span>🔒</span>
                <span>Only shared scores appear here. Use "anon" username to skip.</span>
              </div>
            </div>

            {/* Leaderboard */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : scores.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No scores yet</h3>
                <p className="text-muted-foreground">
                  Be the first to take the quiz and share your results!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Top 3 podium for larger screens */}
                {scores.length >= 3 && (
                  <div className="hidden sm:grid grid-cols-3 gap-4 mb-8">
                    {/* 2nd place */}
                    <div className="order-1 pt-8">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 text-center">
                        <div className="text-3xl mb-2">{getCharacterEmoji(scores[1].character_rank)}</div>
                        <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="font-bold text-foreground truncate">@{scores[1].username}</p>
                        <p className="text-2xl font-bold text-gray-400">{scores[1].score}</p>
                        <p className="text-xs text-muted-foreground">{scores[1].character_rank}</p>
                      </div>
                    </div>
                    {/* 1st place */}
                    <div className="order-2">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-600/10 border border-yellow-500/30 text-center shadow-lg">
                        <div className="text-4xl mb-2">{getCharacterEmoji(scores[0].character_rank)}</div>
                        <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                        <p className="font-bold text-lg text-foreground truncate">@{scores[0].username}</p>
                        <p className="text-3xl font-bold text-yellow-500">{scores[0].score}</p>
                        <p className="text-sm text-muted-foreground">{scores[0].character_rank}</p>
                      </div>
                    </div>
                    {/* 3rd place */}
                    <div className="order-3 pt-12">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-600/10 to-orange-600/5 border border-amber-600/20 text-center">
                        <div className="text-3xl mb-2">{getCharacterEmoji(scores[2].character_rank)}</div>
                        <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                        <p className="font-bold text-foreground truncate">@{scores[2].username}</p>
                        <p className="text-2xl font-bold text-amber-600">{scores[2].score}</p>
                        <p className="text-xs text-muted-foreground">{scores[2].character_rank}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full list */}
                <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span>Rank</span>
                    <span>User</span>
                    <span className="text-center">Badges</span>
                    <span className="text-right">Score</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {scores.map((score, index) => (
                      <div 
                        key={score.id}
                        className={`grid grid-cols-[auto_1fr_auto_auto] gap-4 p-4 items-center hover:bg-muted/30 transition-colors ${
                          index < 3 ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center w-8">
                          {getRankIcon(index)}
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl">{getCharacterEmoji(score.character_rank)}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">@{score.username}</p>
                            <p className="text-xs text-muted-foreground">{score.character_rank}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="px-2 py-1 rounded-full bg-muted text-xs font-medium">
                            {score.badge_count}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-primary">{score.score}</span>
                          <span className="text-muted-foreground text-sm">/100</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Leaderboard;