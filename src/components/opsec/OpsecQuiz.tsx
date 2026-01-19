
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

// Extended question bank with more difficult/tricky questions - 8 will be randomly selected
const baseQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "How do you primarily store your crypto assets?",
    options: [
      { text: "Exchange wallet (Binance, Coinbase, etc.)", score: 10, category: "custody" },
      { text: "Software/hot wallet (MetaMask, Rainbow)", score: 30, category: "custody" },
      { text: "Hardware wallet (Ledger, Trezor)", score: 60, category: "custody" },
      { text: "Multi-sig with geographically distributed hardware wallets", score: 100, category: "custody" }
    ]
  },
  {
    id: 2,
    question: "A 'verified' project DMs you about an exclusive airdrop. What do you do?",
    options: [
      { text: "Click the link - it's verified!", score: 5, category: "social" },
      { text: "Check their follower count before clicking", score: 15, category: "social" },
      { text: "Ignore and block - legit projects don't DM first", score: 85, category: "social" },
      { text: "Report, screenshot for CT, and warn others", score: 100, category: "social" }
    ]
  },
  {
    id: 3,
    question: "Your MetaMask shows a pending transaction you didn't initiate. What's your first move?",
    options: [
      { text: "Approve it to see what happens", score: 5, category: "verification" },
      { text: "Reject it and continue using the wallet", score: 25, category: "verification" },
      { text: "Reject and transfer all funds to a fresh wallet immediately", score: 90, category: "verification" },
      { text: "Reject, revoke all approvals, migrate to new seed, then investigate", score: 100, category: "verification" }
    ]
  },
  {
    id: 4,
    question: "How do you manage your seed phrase backup?",
    options: [
      { text: "Screenshot on phone / cloud notes", score: 5, category: "backup" },
      { text: "Written on paper in one secure location", score: 30, category: "backup" },
      { text: "Metal backup (Cryptosteel/Billfodl) in a safe", score: 70, category: "backup" },
      { text: "Shamir Secret Sharing across multiple geographic locations", score: 100, category: "backup" }
    ]
  },
  {
    id: 5,
    question: "You find a USB drive at a crypto conference with 'Private Keys Backup' written on it. What do you do?",
    options: [
      { text: "Plug it in to see what's there - free alpha!", score: 5, category: "device" },
      { text: "Plug it into an old laptop first", score: 15, category: "device" },
      { text: "Hand it to security - someone lost their keys", score: 60, category: "device" },
      { text: "Destroy it immediately - this is a classic BadUSB attack vector", score: 100, category: "device" }
    ]
  },
  {
    id: 6,
    question: "What authentication do you use for your exchange accounts?",
    options: [
      { text: "Strong password only", score: 10, category: "auth" },
      { text: "Password + SMS 2FA", score: 25, category: "auth" },
      { text: "Password + Authenticator app (Google/Authy)", score: 60, category: "auth" },
      { text: "Password + Hardware key (Yubikey) + Authenticator backup", score: 100, category: "auth" }
    ]
  },
  {
    id: 7,
    question: "You receive an email from 'Uniswap' about unclaimed rewards. The link looks legit. What do you do?",
    options: [
      { text: "Click and claim - free money!", score: 5, category: "verification" },
      { text: "Check the sender email domain", score: 30, category: "verification" },
      { text: "Manually navigate to uniswap.org and check there", score: 85, category: "verification" },
      { text: "Verify on official Discord/Twitter, never click email links", score: 100, category: "verification" }
    ]
  },
  {
    id: 8,
    question: "You're connecting to mint an NFT. The site requests 'setApprovalForAll'. Your reaction?",
    options: [
      { text: "Approve - it's needed for the mint", score: 5, category: "verification" },
      { text: "Check if others have minted successfully", score: 20, category: "verification" },
      { text: "Decline - mints should never need unlimited approval", score: 85, category: "verification" },
      { text: "Use a burner wallet and simulate the tx first", score: 100, category: "verification" }
    ]
  },
  {
    id: 9,
    question: "How do you handle addresses when sending large amounts?",
    options: [
      { text: "Copy-paste from wherever I have it saved", score: 10, category: "custody" },
      { text: "Verify first and last characters match", score: 30, category: "custody" },
      { text: "Send a small test transaction first", score: 70, category: "custody" },
      { text: "Hardware wallet verification + test tx + clipboard malware check", score: 100, category: "custody" }
    ]
  },
  {
    id: 10,
    question: "You're at a crypto conference. How do you handle hotel WiFi?",
    options: [
      { text: "Use it normally - hotels are secure", score: 5, category: "network" },
      { text: "Use it with a VPN enabled", score: 40, category: "network" },
      { text: "Use mobile data only for anything crypto-related", score: 75, category: "network" },
      { text: "Dedicated travel device + mobile hotspot + VPN", score: 100, category: "network" }
    ]
  },
  {
    id: 11,
    question: "A friend's Discord account messages you a 'collab opportunity' with a link. What do you do?",
    options: [
      { text: "Click it - I trust my friends", score: 5, category: "social" },
      { text: "Ask them about it in Discord", score: 20, category: "social" },
      { text: "Call or text them through a different channel to verify", score: 85, category: "social" },
      { text: "Verify via call, warn them their account is compromised", score: 100, category: "social" }
    ]
  },
  {
    id: 12,
    question: "How do you verify a smart contract before interacting?",
    options: [
      { text: "If it's on a DEX, it's safe", score: 5, category: "verification" },
      { text: "Check if contract is verified on Etherscan", score: 30, category: "verification" },
      { text: "Check audit reports, TVL, and time deployed", score: 65, category: "verification" },
      { text: "Read code, check audits, simulate tx, start with small test", score: 100, category: "verification" }
    ]
  },
  {
    id: 13,
    question: "Your browser extension wallet suddenly shows a different balance. What happened?",
    options: [
      { text: "Probably a display bug, refresh and check later", score: 10, category: "device" },
      { text: "Check transaction history on Etherscan", score: 40, category: "device" },
      { text: "Immediately move remaining funds to a fresh wallet", score: 80, category: "device" },
      { text: "Disconnect internet, use separate device to move funds, investigate malware", score: 100, category: "device" }
    ]
  },
  {
    id: 14,
    question: "How do you protect your crypto activity from your ISP and network observers?",
    options: [
      { text: "I don't - nothing to hide", score: 5, category: "privacy" },
      { text: "Use HTTPS everywhere", score: 25, category: "privacy" },
      { text: "VPN for all crypto activities", score: 60, category: "privacy" },
      { text: "VPN + Tor for sensitive ops + separate browser profile", score: 100, category: "privacy" }
    ]
  },
  {
    id: 15,
    question: "You accidentally sent 0.1 ETH to a wrong address. It's a contract. What do you do?",
    options: [
      { text: "Email the contract owner to return it", score: 10, category: "verification" },
      { text: "Try to interact with the contract to recover", score: 20, category: "verification" },
      { text: "Accept the loss and document for taxes", score: 70, category: "verification" },
      { text: "Verify if it's a recoverable proxy, else document and move on", score: 100, category: "verification" }
    ]
  },
  {
    id: 16,
    question: "How do you handle social media when traveling for crypto events?",
    options: [
      { text: "Post real-time check-ins and event photos", score: 5, category: "social" },
      { text: "Post same day but avoid exact locations", score: 25, category: "social" },
      { text: "Delay all location posts by 24-48 hours", score: 75, category: "social" },
      { text: "No location posts, minimal digital footprint, separate travel identity", score: 100, category: "social" }
    ]
  },
  {
    id: 17,
    question: "A new dApp asks to connect your wallet. What's your protocol?",
    options: [
      { text: "Connect main wallet - convenient", score: 5, category: "custody" },
      { text: "Check the URL matches before connecting", score: 30, category: "custody" },
      { text: "Use a dedicated dApp wallet with limited funds", score: 70, category: "custody" },
      { text: "Burner wallet + simulate first + revoke after use", score: 100, category: "custody" }
    ]
  },
  {
    id: 18,
    question: "How many browser extensions do you have installed?",
    options: [
      { text: "10+ useful ones I've collected over time", score: 10, category: "device" },
      { text: "5-10 popular, well-reviewed extensions", score: 30, category: "device" },
      { text: "Less than 5, only essential ones", score: 70, category: "device" },
      { text: "Minimal extensions + dedicated browser for crypto only", score: 100, category: "device" }
    ]
  },
  {
    id: 19,
    question: "Someone offers to help you 'sync your wallet' to fix an issue. Your response?",
    options: [
      { text: "Follow their instructions - they seem knowledgeable", score: 5, category: "social" },
      { text: "Ask for their credentials first", score: 15, category: "social" },
      { text: "Politely decline - wallets don't need syncing", score: 80, category: "social" },
      { text: "Block, report, and warn the community about the scammer", score: 100, category: "social" }
    ]
  },
  {
    id: 20,
    question: "How do you secure your email associated with crypto accounts?",
    options: [
      { text: "Standard email with strong password", score: 15, category: "auth" },
      { text: "Unique password + 2FA app", score: 40, category: "auth" },
      { text: "Dedicated email address for crypto only + hardware 2FA", score: 80, category: "auth" },
      { text: "ProtonMail/Tutanota + hardware key + aliases per service", score: 100, category: "auth" }
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
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [serverQuestionIds, setServerQuestionIds] = useState<number[]>([]);

  // Fetch session token and question IDs from server when quiz starts
  const startQuizSession = async () => {
    setIsStartingSession(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/start-quiz-session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      const data = await response.json();
      if (response.ok && data.sessionToken) {
        setSessionToken(data.sessionToken);
        setServerQuestionIds(data.questionIds || []);
        return data.questionIds || [];
      } else {
        console.error('Failed to start quiz session:', data.error);
        toast.error('Failed to start quiz. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Error starting quiz session:', error);
      toast.error('Failed to connect to server. Please try again.');
      return null;
    } finally {
      setIsStartingSession(false);
    }
  };

  // Use server-provided question IDs when available, otherwise use client-side selection
  const randomizedQuestions = useMemo(() => {
    let selectedQuestions: QuizQuestion[];
    
    if (serverQuestionIds.length > 0) {
      // Use server-provided question IDs
      selectedQuestions = serverQuestionIds
        .map(id => baseQuestions.find(q => q.id === id))
        .filter((q): q is QuizQuestion => q !== undefined);
    } else {
      // Fallback to client-side random selection
      selectedQuestions = shuffleArray(baseQuestions).slice(0, 8);
    }
    
    // Shuffle options within each question
    return selectedQuestions.map(q => ({
      ...q,
      options: shuffleArray(q.options)
    }));
  }, [serverQuestionIds, isOpen]);

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

  const handleNext = async () => {
    if (currentStep === 0 && !username.trim()) {
      toast.error("Please enter a username");
      return;
    }
    
    // When starting the quiz (step 0 -> step 1), fetch session token
    if (currentStep === 0) {
      const questionIds = await startQuizSession();
      if (!questionIds) {
        return; // Failed to start session
      }
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
    
    // Create shareable URL with params for OG tags
    const badgesEncoded = result.badges.map(b => encodeURIComponent(b)).join(',');
    // Include session token in share URL for validation
    const tokenParam = sessionToken ? `&t=${encodeURIComponent(sessionToken)}` : '';
    const shareUrl = `https://digibastion.com/quiz-result?u=${encodeURIComponent(username)}&s=${result.score}&b=${badgesEncoded}${tokenParam}`;
    
    const shareText = `${result.character.emoji} My OpSec Level: ${result.character.name} (${result.score}/100)

"${result.character.description}"

Think you can beat my score? Take the quiz 👇
${shareUrl}`;
    
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
    setSessionToken(null);
    setServerQuestionIds([]);
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

                {/* Privacy Notice */}
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    <div className="text-xs text-foreground-secondary">
                      <span className="font-medium text-warning">Privacy Notice:</span> If you share your results, your username and score will appear on the public leaderboard. Use "anon" to skip leaderboard submission.
                    </div>
                  </div>
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
              <Button onClick={handleNext} className="gap-2" disabled={isStartingSession}>
                {isStartingSession ? 'Starting...' : currentStep === randomizedQuestions.length ? 'See Results' : currentStep === 0 ? 'Start Quiz' : 'Next'}
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
