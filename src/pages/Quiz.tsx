import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { MetaTags } from '@/components/MetaTags';
import { OpsecQuiz } from '@/components/opsec/OpsecQuiz';
import { Button } from '@/components/ui/button';
import { ChallengeButton } from '@/components/quiz/ChallengeButton';
import { Shield, Zap, Trophy, Share2, ArrowRight, Sparkles, Target, Award, Medal } from 'lucide-react';

const Quiz = () => {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: '8 Scenario Questions',
      description: 'Randomized from a 20-question bank covering custody, devices, identity, verification and social risk'
    },
    {
      icon: Award,
      title: 'Clear Starting Point',
      description: 'See a category breakdown and practical follow-up actions alongside the optional character rank'
    },
    {
      icon: Share2,
      title: 'Private by Default',
      description: 'Use “anon” to keep the result off the public leaderboard, or choose a handle when you want to share'
    }
  ];

  return (
    <>
      <MetaTags 
        title="Free Crypto OpSec Quiz — Test Your Web3 Security Knowledge | Digibastion"
        description="Take an eight-question crypto OpSec self-check. Review practical scenarios, see category-level gaps, and get clear next steps without connecting a wallet."
        keywords="crypto security quiz, opsec assessment, web3 security test, blockchain security quiz, wallet security test, crypto safety quiz"
        image="https://www.digibastion.com/og-quiz.png"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-grow pt-24 pb-16">
          {/* Hero Section */}
          <section className="relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            
            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16 lg:py-24">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Scenario-based OpSec self-check</span>
              </div>

              {/* Main heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                How Secure Is Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
                  Crypto OpSec?
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
                Work through eight real-world scenarios, see where your habits are strongest, and leave with practical next steps. No wallet connection or account required.
              </p>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button 
                  onClick={() => setIsQuizOpen(true)}
                  size="lg"
                  className="gap-2 sm:gap-3 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group w-full sm:w-auto"
                >
                  <Shield className="w-5 h-5" />
                  <span>Start the self-check</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <ChallengeButton variant="outline" className="px-6 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto" />
              </div>

              {/* Leaderboard link */}
              <Button
                onClick={() => navigate('/leaderboard')}
                variant="ghost"
                className="mt-4 gap-2 text-muted-foreground hover:text-primary"
              >
                <Medal className="w-4 h-4" />
                View Leaderboard
              </Button>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-10 sm:mt-12 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span>2 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-warning" />
                  <span>20 scenarios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-accent" />
                  <span>Shareable</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Character Preview */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Which Crypto Character Are You?
              </h2>
              <p className="text-muted-foreground">
                The character rank makes the result memorable; the category breakdown is the part to act on.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {[
                { emoji: '👻', name: 'Satoshi-Level', score: '90+', color: 'from-green-500/20 to-emerald-500/20' },
                { emoji: '🐋', name: 'Whale Guard', score: '75-89', color: 'from-blue-500/20 to-cyan-500/20' },
                { emoji: '💎', name: 'Diamond Hands', score: '60-74', color: 'from-indigo-500/20 to-purple-500/20' },
                { emoji: '🦍', name: 'Degen Defender', score: '45-59', color: 'from-yellow-500/20 to-amber-500/20' },
                { emoji: '📄', name: 'Paper Hands', score: '30-44', color: 'from-orange-500/20 to-red-500/20' },
                { emoji: '💀', name: 'Rekt Waiting', score: '<30', color: 'from-red-500/20 to-rose-500/20' }
              ].map((char, idx) => (
                <div 
                  key={idx}
                  className={`p-3 sm:p-4 rounded-xl bg-gradient-to-br ${char.color} border border-border/30 text-center hover:scale-105 transition-transform`}
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{char.emoji}</div>
                  <div className="text-[10px] sm:text-xs font-semibold text-foreground truncate">{char.name}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">{char.score}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 border border-primary/20">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Ready for a quick security check?
              </h2>
              <p className="text-muted-foreground mb-6">
                Treat the result as a conversation starter, not a guarantee of safety. Security depends on your assets, adversaries and operating environment.
              </p>
              <Button 
                onClick={() => setIsQuizOpen(true)}
                size="lg"
                className="gap-2"
              >
                <Shield className="w-5 h-5" />
                Start the self-check
              </Button>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <OpsecQuiz isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} />
    </>
  );
};

export default Quiz;
