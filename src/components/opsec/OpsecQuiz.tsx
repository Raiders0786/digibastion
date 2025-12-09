
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Lock, Zap, Twitter, Copy, User, Award, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface OpsecQuizProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuizOption {
  text: string;
  score: number;
  category: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

// Base questions - options will be shuffled
const baseQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "How do you primarily store your crypto assets?",
    options: [
      { text: "Exchange wallet (Binance, Coinbase, etc.)", score: 10, category: "custody" },
      { text: "Software/hot wallet (MetaMask, Rainbow)", score: 30, category: "custody" },
      { text: "Hardware wallet (Ledger, Trezor)", score: 60, category: "custody" },
      { text: "Multi-sig with hardware wallets", score: 100, category: "custody" }
    ]
  },
  {
    id: 2,
    question: "How do you manage your seed phrases?",
    options: [
      { text: "Stored digitally (notes, cloud)", score: 5, category: "backup" },
      { text: "Written on paper in one location", score: 30, category: "backup" },
      { text: "Metal backup in secure location", score: 70, category: "backup" },
      { text: "Split storage with multiple locations", score: 100, category: "backup" }
    ]
  },
  {
    id: 3,
    question: "What 2FA methods do you use?",
    options: [
      { text: "SMS only", score: 10, category: "auth" },
      { text: "Authenticator app (Google, Authy)", score: 50, category: "auth" },
      { text: "Hardware key (Yubikey, Passkey)", score: 90, category: "auth" },
      { text: "Multiple methods including hardware", score: 100, category: "auth" }
    ]
  },
  {
    id: 4,
    question: "How do you verify transactions before signing?",
    options: [
      { text: "I just approve quickly", score: 5, category: "verification" },
      { text: "Check the basic details", score: 30, category: "verification" },
      { text: "Use simulation tools (Tenderly, etc.)", score: 70, category: "verification" },
      { text: "Multiple verification + simulation", score: 100, category: "verification" }
    ]
  },
  {
    id: 5,
    question: "How do you handle address management?",
    options: [
      { text: "One address for everything", score: 10, category: "privacy" },
      { text: "A few addresses for different purposes", score: 40, category: "privacy" },
      { text: "Separate addresses for each use case", score: 75, category: "privacy" },
      { text: "Full separation with privacy tools", score: 100, category: "privacy" }
    ]
  },
  {
    id: 6,
    question: "How do you protect your devices?",
    options: [
      { text: "Basic password protection", score: 15, category: "device" },
      { text: "Strong passwords + auto-lock", score: 40, category: "device" },
      { text: "Full disk encryption + VPN", score: 70, category: "device" },
      { text: "Encrypted + dedicated security devices", score: 100, category: "device" }
    ]
  },
  {
    id: 7,
    question: "What's your approach to public WiFi?",
    options: [
      { text: "Connect freely when needed", score: 5, category: "network" },
      { text: "Use VPN sometimes", score: 30, category: "network" },
      { text: "Always use VPN on public networks", score: 70, category: "network" },
      { text: "Never use public WiFi for sensitive tasks", score: 100, category: "network" }
    ]
  },
  {
    id: 8,
    question: "How do you handle social media and travel?",
    options: [
      { text: "Post real-time locations and activities", score: 5, category: "social" },
      { text: "Sometimes delay posts", score: 30, category: "social" },
      { text: "Always delay location posts", score: 70, category: "social" },
      { text: "Minimal digital footprint", score: 100, category: "social" }
    ]
  },
  {
    id: 9,
    question: "How do you handle DMs from unknown accounts?",
    options: [
      { text: "Reply to all messages", score: 5, category: "social" },
      { text: "Check profile before responding", score: 35, category: "social" },
      { text: "Only reply to verified/known accounts", score: 70, category: "social" },
      { text: "DMs disabled or heavily filtered", score: 100, category: "social" }
    ]
  },
  {
    id: 10,
    question: "How do you interact with new smart contracts?",
    options: [
      { text: "Ape first, verify never", score: 5, category: "verification" },
      { text: "Check if others are using it", score: 25, category: "verification" },
      { text: "Review audit reports and TVL", score: 65, category: "verification" },
      { text: "Read code + check audits + small test first", score: 100, category: "verification" }
    ]
  },
  {
    id: 11,
    question: "What do you do when receiving unexpected airdrops?",
    options: [
      { text: "Claim immediately - free money!", score: 5, category: "verification" },
      { text: "Check the token contract quickly", score: 30, category: "verification" },
      { text: "Research thoroughly before any interaction", score: 75, category: "verification" },
      { text: "Never interact with unknown tokens", score: 100, category: "verification" }
    ]
  },
  {
    id: 12,
    question: "How do you handle browser extensions?",
    options: [
      { text: "Install whatever looks useful", score: 5, category: "device" },
      { text: "Stick to popular extensions", score: 30, category: "device" },
      { text: "Minimal extensions, review permissions", score: 70, category: "device" },
      { text: "Dedicated browser for crypto, minimal extensions", score: 100, category: "device" }
    ]
  }
];

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

type ThreatLevel = 'critical' | 'high' | 'moderate' | 'low' | 'secure';

interface QuizResult {
  score: number;
  threatLevel: ThreatLevel;
  recommendations: string[];
  categoryScores: { [key: string]: number };
  character: ReturnType<typeof getCryptoCharacter>;
  badges: string[];
}

const getThreatLevel = (score: number): ThreatLevel => {
  if (score < 20) return 'critical';
  if (score < 40) return 'high';
  if (score < 60) return 'moderate';
  if (score < 80) return 'low';
  return 'secure';
};

const getThreatLevelConfig = (level: ThreatLevel) => {
  const configs = {
    critical: {
      color: 'bg-red-500',
      textColor: 'text-red-500',
      borderColor: 'border-red-500/30',
      label: 'Critical Risk',
      gradient: 'from-red-500/20 to-red-600/10'
    },
    high: {
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      borderColor: 'border-orange-500/30',
      label: 'High Risk',
      gradient: 'from-orange-500/20 to-orange-600/10'
    },
    moderate: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-500',
      borderColor: 'border-yellow-500/30',
      label: 'Moderate Risk',
      gradient: 'from-yellow-500/20 to-yellow-600/10'
    },
    low: {
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      borderColor: 'border-blue-500/30',
      label: 'Low Risk',
      gradient: 'from-blue-500/20 to-blue-600/10'
    },
    secure: {
      color: 'bg-green-500',
      textColor: 'text-green-500',
      borderColor: 'border-green-500/30',
      label: 'Secure',
      gradient: 'from-green-500/20 to-green-600/10'
    }
  };
  return configs[level];
};

const getRecommendations = (categoryScores: { [key: string]: number }): string[] => {
  const recs: string[] = [];
  
  if (categoryScores.custody < 50) recs.push("Upgrade to hardware wallet for asset storage");
  if (categoryScores.backup < 50) recs.push("Use metal backup for seed phrases in multiple locations");
  if (categoryScores.auth < 50) recs.push("Enable hardware security keys for 2FA");
  if (categoryScores.verification < 50) recs.push("Use transaction simulation tools before signing");
  if (categoryScores.privacy < 50) recs.push("Separate wallet addresses for different activities");
  if (categoryScores.device < 50) recs.push("Enable full disk encryption on all devices");
  if (categoryScores.network < 50) recs.push("Always use VPN on untrusted networks");
  if (categoryScores.social < 50) recs.push("Delay location posts on social media");
  
  return recs.slice(0, 5);
};

const getBadges = (score: number, categoryScores: { [key: string]: number }): string[] => {
  const badges: string[] = [];
  
  if (score >= 90) badges.push("🏆 OpSec Master");
  if (score >= 70) badges.push("🛡️ Security Conscious");
  if (categoryScores.custody >= 80) badges.push("🔐 Key Guardian");
  if (categoryScores.verification >= 80) badges.push("🔍 Transaction Auditor");
  if (categoryScores.privacy >= 80) badges.push("👤 Privacy Advocate");
  if (categoryScores.device >= 80) badges.push("💻 Device Defender");
  if (Object.values(categoryScores).every(s => s >= 50)) badges.push("⚖️ Balanced Security");
  
  return badges;
};

// Fisher-Yates shuffle
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const OpsecQuiz = ({ isOpen, onClose }: OpsecQuizProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [username, setUsername] = useState('');
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Randomize questions and shuffle options on mount
  const randomizedQuestions = useMemo(() => {
    // Pick 8 random questions from the pool
    const shuffledQuestions = shuffleArray(baseQuestions).slice(0, 8);
    // Shuffle options within each question
    return shuffledQuestions.map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
  }, [isOpen]); // Re-randomize when dialog opens

  const progress = ((currentStep) / (randomizedQuestions.length + 1)) * 100;

  const handleAnswer = (questionId: number, score: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: score }));
  };

  const calculateResult = () => {
    const categoryScores: { [key: string]: number } = {};
    const categoryCounts: { [key: string]: number } = {};

    randomizedQuestions.forEach((q) => {
      const answer = answers[q.id];
      const option = q.options.find(o => o.score === answer);
      if (option) {
        if (!categoryScores[option.category]) {
          categoryScores[option.category] = 0;
          categoryCounts[option.category] = 0;
        }
        categoryScores[option.category] += answer;
        categoryCounts[option.category]++;
      }
    });

    Object.keys(categoryScores).forEach(cat => {
      categoryScores[cat] = Math.round(categoryScores[cat] / categoryCounts[cat]);
    });

    const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
    const avgScore = Math.round(totalScore / randomizedQuestions.length);
    
    const threatLevel = getThreatLevel(avgScore);
    const recommendations = getRecommendations(categoryScores);
    const character = getCryptoCharacter(avgScore);
    const badges = getBadges(avgScore, categoryScores);

    setResult({
      score: avgScore,
      threatLevel,
      recommendations,
      categoryScores,
      character,
      badges
    });
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentStep === 0 && !username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    if (currentStep > 0 && !answers[randomizedQuestions[currentStep - 1]?.id]) {
      toast.error("Please select an answer");
      return;
    }
    if (currentStep < randomizedQuestions.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleShare = async (platform: 'twitter' | 'copy') => {
    if (!result) return;
    
    const shareText = `${result.character.emoji} My OpSec Level: ${result.character.name} (${result.score}/100)

"${result.character.description}"

@${username} just completed the Digibastion OpSec Assessment!

Think you're more secure? Prove it 👇
https://www.digibastion.com

#OpSec #Web3Security #Digibastion #WAGMI`;
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Share text copied!");
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setUsername('');
    setResult(null);
    setShowResult(false);
  };

  const handleClose = () => {
    resetQuiz();
    onClose();
  };

  // Twitter profile pic URL
  const getTwitterPfp = (handle: string) => {
    return `https://unavatar.io/twitter/${handle}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-primary" />
            OpSec Assessment Quiz
          </DialogTitle>
        </DialogHeader>

        {!showResult ? (
          <div className="space-y-6">
            <Progress value={progress} className="h-2" />
            
            {currentStep === 0 ? (
              <div className="space-y-6 py-4">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Welcome to the OpSec Quiz</h3>
                  <p className="text-foreground-secondary text-sm">
                    Answer 8 randomized questions to discover your security level. Get a crypto character rank and share your results!
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your X (Twitter) Username</label>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground-secondary">@</span>
                    <Input
                      placeholder="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-foreground-secondary">Used to create your shareable results card with profile pic</p>
                </div>
                
                {/* Preview badges */}
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Earn Badges Like:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">🏆 OpSec Master</Badge>
                    <Badge variant="outline" className="text-xs">🔐 Key Guardian</Badge>
                    <Badge variant="outline" className="text-xs">🔍 Transaction Auditor</Badge>
                    <Badge variant="outline" className="text-xs">👤 Privacy Advocate</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between text-sm text-foreground-secondary">
                  <span>Question {currentStep} of {randomizedQuestions.length}</span>
                  <Badge variant="outline">{Math.round(progress)}% complete</Badge>
                </div>
                
                <h3 className="text-lg font-semibold">
                  {randomizedQuestions[currentStep - 1]?.question}
                </h3>
                
                <div className="space-y-3">
                  {randomizedQuestions[currentStep - 1]?.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(randomizedQuestions[currentStep - 1].id, option.score)}
                      className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
                        answers[randomizedQuestions[currentStep - 1]?.id] === option.score
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:border-primary/50 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          answers[randomizedQuestions[currentStep - 1]?.id] === option.score
                            ? 'border-primary bg-primary'
                            : 'border-foreground-secondary'
                        }`}>
                          {answers[randomizedQuestions[currentStep - 1]?.id] === option.score && (
                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm">{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleNext} className="gap-2">
                {currentStep === randomizedQuestions.length ? 'See Results' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          result && (
            <div className="space-y-6 py-4">
              {/* Shareable Card with Profile Pic */}
              <div className={`p-6 rounded-2xl border ${getThreatLevelConfig(result.threatLevel).borderColor} bg-gradient-to-br ${getThreatLevelConfig(result.threatLevel).gradient} relative overflow-hidden`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_20%,_currentColor_21%,_currentColor_22%,_transparent_23%)] bg-[length:20px_20px]" />
                </div>
                
                <div className="relative z-10">
                  {/* Profile header */}
                  <div className="flex items-center gap-4 mb-6">
                    <img 
                      src={getTwitterPfp(username)} 
                      alt={`@${username}`}
                      className="w-16 h-16 rounded-full border-2 border-primary/50 shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://unavatar.io/fallback.png';
                      }}
                    />
                    <div>
                      <p className="font-semibold text-foreground">@{username}</p>
                      <p className="text-sm text-foreground-secondary">OpSec Assessment</p>
                    </div>
                  </div>

                  {/* Character & Score */}
                  <div className="text-center space-y-3 mb-6">
                    <div className="text-5xl">{result.character.emoji}</div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{result.character.name}</h3>
                      <p className={`text-sm font-medium ${getThreatLevelConfig(result.threatLevel).textColor}`}>
                        {result.character.title}
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <div className={`px-6 py-3 rounded-full ${getThreatLevelConfig(result.threatLevel).color} shadow-lg`}>
                        <span className="text-3xl font-bold text-white">{result.score}</span>
                        <span className="text-white/80 text-lg">/100</span>
                      </div>
                    </div>
                    <p className="text-sm text-foreground-secondary italic max-w-xs mx-auto">
                      "{result.character.description}"
                    </p>
                  </div>

                  {/* Badges earned */}
                  {result.badges.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {result.badges.map((badge, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-background/50 backdrop-blur">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* CTA for others */}
                  <div className="text-center pt-4 border-t border-border/30">
                    <p className="text-xs text-foreground-secondary flex items-center justify-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Think you can beat this? Take the quiz at digibastion.com
                    </p>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Security Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.categoryScores).map(([cat, score]) => (
                    <div key={cat} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                      <div className={`w-2 h-2 rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                      <span className="text-xs capitalize flex-1">{cat}</span>
                      <span className="text-xs font-mono">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {result.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Level Up Your Security
                  </h4>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground-secondary">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Share Buttons */}
              <div className="space-y-3 pt-4 border-t border-border">
                <p className="text-sm text-center text-foreground-secondary">Challenge CT to beat your score!</p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleShare('twitter')}
                    className="flex-1 gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
                  >
                    <Twitter className="w-4 h-4" />
                    Share on X
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare('copy')}
                    className="flex-1 gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Text
                  </Button>
                </div>
              </div>

              <Button variant="outline" onClick={resetQuiz} className="w-full">
                Retake Quiz
              </Button>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
};
